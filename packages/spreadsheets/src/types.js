const _ = require('lodash')
const assert = require('assert')
const { nameToId, stampRelationshipId } = require('@frontiernav/graph')

module.exports = {
  'string': {
    parse (value) {
      return {
        value: value
      }
    }
  },
  'json': {
    parse (value) {
      return {
        value: JSON.parse(value)
      }
    }
  },
  'number': {
    parse (value) {
      return {
        value: +value
      }
    }
  },
  'boolean': {
    parse (value) {
      const normalisedValue = _.lowerCase(value)
      return {
        value: normalisedValue === 'true' || normalisedValue === 'yes'
      }
    }
  },
  'reference': {
    parse (value, row, fieldSchema, fieldName) {
      assert(fieldSchema.relationship, `Field "${fieldName}" does not have a relationship type.`)
      return {
        relationship: stampRelationshipId({
          type: fieldSchema.relationship,
          start: nameToId(row['Name']),
          end: nameToId(value)
        })
      }
    }
  },
  'multi_reference': {
    parse (value, row, fieldSchema, fieldName) {
      assert(fieldSchema.relationship, `Field "${fieldName}" does not have a relationship type.`)
      const values = JSON.parse(value)
      return values.map(({ id, ...data }) => ({
        relationship: stampRelationshipId({
          type: fieldSchema.relationship,
          start: nameToId(row['Name']),
          end: id,
          data
        })
      }))
    }
  }
}
