const assert = require('assert')
const nameToLabelId = require('./nameToLabelId')

function createNodeLabel ({ id, name }) {
  assert(id || name, 'A name or id must be provided to create a Node Label.')

  return {
    id: id || nameToLabelId(name),
    name: name || id,
    pageDescription: 'Find out more about {name} and where you can find them.',
    properties: {}
  }
}

module.exports = createNodeLabel
