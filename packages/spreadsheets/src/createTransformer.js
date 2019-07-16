const _ = require('lodash')
const assert = require('assert')
const { nameToId, nameToLabelId } = require('@frontiernav/graph')
const log = require('@frontiernav/logger').get(__filename)
const types = require('./types')
const defaultFieldSchema = require('./defaultFieldSchema.json')

const objectify = a => a.reduce(
  (acc, next) => {
    acc[next] = true
    return acc
  },
  {}
)

const getColumnField = columnName => _.snakeCase(columnName)

const getUsedProperties = (schema) => (
  _(schema.columns)
    .omitBy(column => column.type === 'multi_reference' || column.type === 'reference')
    .mapKeys((v, columnName) => getColumnField(columnName))
    .mapValues(() => ({}))
    .value()
)

const getPropertySchema = (schema) => (
  _(schema.columns)
    .flatMap((columnSchema, columnName) => {
      if (columnSchema.type === 'multi_reference' || columnSchema.type === 'reference') {
        return getPropertySchema(columnSchema)
      }
      return [({
        id: getColumnField(columnName),
        type: columnSchema.type === 'json' ? 'object' : columnSchema.type
      })]
    })
    .value()
)

function createTransformer ({ id: configId, schema, filters }) {
  function getNodeLabels () {
    return _(schema)
      .map(sheet => ({
        id: nameToLabelId(sheet.label),
        name: sheet.label,
        properties: getUsedProperties(sheet)
      }))
      .keyBy('id')
      .value()
  }

  function getRelationshipTypes () {
    return _(schema)
      .flatMap(sheet => {
        return _(sheet.columns)
          .filter(column => column.type === 'reference' || column.type === 'multi_reference')
          .map(column => {
            const endLabels = (column.sheet ? [column.sheet] : column.sheets)
              .map(refSheetName => {
                const refSheet = schema[refSheetName]
                assert(refSheet, `Referenced Sheet ${refSheetName} does not exist.`)
                return nameToLabelId(refSheet.label)
              })

            return {
              id: column.relationship,
              startLabels: [nameToLabelId(sheet.label)],
              endLabels: endLabels,
              properties: getUsedProperties(column)
            }
          })
          .value()
      })
      .reduce((acc, next) => {
        const current = acc[next.id] || {
          id: next.id,
          startLabels: {},
          endLabels: {},
          properties: {}
        }

        return {
          ...acc,
          [next.id]: {
            ...current,
            startLabels: {
              ...current.startLabels,
              ...objectify(next.startLabels)
            },
            endLabels: {
              ...current.endLabels,
              ...objectify(next.endLabels)
            },
            properties: {
              ...current.properties,
              ...next.properties
            }
          }
        }
      }, {})
  }

  function getProperties () {
    return _(schema)
      .flatMap(sheet => getPropertySchema(sheet))
      .keyBy('id')
      .value()
  }

  function getSheetSchema (sheetName) {
    const sheetSchema = schema[sheetName]
    assert(sheetSchema, `Sheet ${sheetName} does not have a schema.`)
    return sheetSchema
  }

  function filter (sheetName, row) {
    const f = filters[sheetName]
    return f ? f(row) : true
  }

  function parse (sheetName, row) {
    const sheetSchema = getSheetSchema(sheetName)

    return _(row)
      .omitBy(fieldValue => fieldValue === '-')
      .mapValues((fieldValue, fieldName) => {
        const fieldSchema = _.get(sheetSchema, ['columns', fieldName], defaultFieldSchema)
        const type = types[fieldSchema.type]
        assert(type, `Type ${fieldSchema.type} does not exist.`)
        return type.parse(fieldValue, row, fieldSchema, fieldName)
      })
      .value()
  }

  function transformRowToNode (sheetName, row) {
    const sheetSchema = getSheetSchema(sheetName)

    return {
      id: nameToId(row['Name'].value),
      labels: {
        [nameToLabelId(sheetSchema.label)]: true
      },
      data: _(row)
        .mapValues(v => v.value)
        .pickBy(v => v !== '')
        .mapKeys((value, fieldName) => _.snakeCase(fieldName))
        .value()
    }
  }

  function transformRowToRelationships (sheetName, row) {
    return _(row)
      .flatMap(v => Array.isArray(v) ? v : [v])
      .filter(v => v.relationship)
      .map(v => v.relationship)
      .keyBy('id')
      .value()
  }

  function transformSheet (sheet) {
    return _(sheet.data)
      .filter(row => filter(sheet.name, row))
      .map(row => parse(sheet.name, row))
      .map(row => ({
        node: transformRowToNode(sheet.name, row),
        relationships: transformRowToRelationships(sheet.name, row)
      }))
      .value()
  }

  function transform (sheets) {
    const transformLog = log.child({ name: configId })

    const rows = _.flatMap(sheets, sheet => {
      transformLog.info(`parsing sheet ${sheet.name}`)
      return transformSheet(sheet)
    })

    transformLog.info(`finding duplicates`)

    const duplicates = _(rows)
      .groupBy(row => row.node.id)
      .pickBy(nodes => nodes.length > 1)
      .value()

    const duplicateCount = _.size(duplicates)

    if (duplicateCount > 1) {
      console.log(JSON.stringify(duplicates, null, 2))
      throw new Error(`${duplicateCount} Node IDs were used multiple times.`)
    }

    transformLog.info(`calculating node labels and relationship types`)

    const nodeLabels = getNodeLabels()
    const relationshipTypes = getRelationshipTypes()
    const properties = getProperties()

    transformLog.info(`generating graph`)

    return rows.reduce(
      (acc, next) => {
        acc.nodes[next.node.id] = next.node
        Object.assign(acc.relationships, next.relationships)
        return acc
      },
      {
        id: configId,
        nodeLabels,
        nodes: {},
        relationshipTypes,
        relationships: {},
        properties
      }
    )
  }

  return {
    transform
  }
}

module.exports = createTransformer
