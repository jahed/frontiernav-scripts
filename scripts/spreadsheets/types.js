const _ = require('lodash')
const assert = require('assert')
const { nameToId, stampRelationshipId } = require('../utils/GraphFactory')

module.exports = {
    "string": {
        parse(value) {
            return {
                value: value
            }
        }
    },
    "number": {
        parse(value) {
            return {
                value: +value
            }
        }
    },
    "boolean": {
        parse(value) {
            const normalisedValue = _.lowerCase(value)
            return {
                value: normalisedValue === "true" || normalisedValue === "yes"
            }
        }
    },
    "reference": {
        parse(value, row, fieldSchema, fieldName) {
            assert(fieldSchema.relationship, `Field "${fieldName}" does not have a relationship type.`)
            return {
                relationship: stampRelationshipId({
                    type: fieldSchema.relationship,
                    start: nameToId(row['Name']),
                    end: nameToId(value)
                })
            }
        }
    }
}
