const _ = require('lodash')
const assert = require('assert')
const { nameToId, createNodeLabel, nameToLabelId } = require('@frontiernav/graph')
const types = require('./types')
const defaultFieldSchema = require('./defaultFieldSchema.json')

function createTransformer ({ schema, filters }) {
  function getLabels () {
    return _(schema)
      .map(sheet => sheet.label)
      .map(label => createNodeLabel({ name: label }))
      .keyBy('id')
      .value()
  }

  function getRelationshipTypes () {
    return _(schema)
      .flatMap(sheet => {
        return _(sheet.columns)
          .filter(column => column.type === 'reference')
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
              endLabels: endLabels
            }
          })
          .value()
      })
      .reduce((acc, next) => {
        const current = acc[next.id] || {
          id: next.id,
          startLabels: [],
          endLabels: []
        }

        return {
          ...acc,
          [next.id]: {
            ...current,
            startLabels: current.startLabels.concat(next.startLabels),
            endLabels: current.endLabels.concat(next.endLabels)
          }
        }
      }, {})
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
      .filter(v => v.relationship)
      .map(v => v.relationship)
      .keyBy('id')
      .value()
  }

  function transform (sheets) {
    return _(sheets)
      .flatMap(sheet => {
        return _(sheet.data)
          .filter(row => filter(sheet.name, row))
          .map(row => parse(sheet.name, row))
          .map(row => ({
            node: transformRowToNode(sheet.name, row),
            relationships: transformRowToRelationships(sheet.name, row)
          }))
          .value()
      })
      .reduce((acc, next) => {
        return {
          ...acc,
          nodes: {
            ...acc.nodes,
            [next.node.id]: next.node
          },
          relationships: {
            ...acc.relationships,
            ...next.relationships
          }
        }
      }, {
        nodeLabels: getLabels(),
        nodes: {},
        relationshipTypes: getRelationshipTypes(),
        relationships: {}
      })
  }

  return {
    transform
  }
}

module.exports = createTransformer
