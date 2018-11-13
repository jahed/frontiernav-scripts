const { forEach } = require('lodash')

const addRelationshipReferences = graph => {
  forEach(graph.relationships, r => {
    const startNode = graph.nodes[r.start]
    startNode.relationships = startNode.relationships || {}
    startNode.relationships[r.id] = true

    const endNode = graph.nodes[r.end]
    endNode.relationships = endNode.relationships || {}
    endNode.relationships[r.id] = true
  })

  return graph
}

exports.addRelationshipReferences = addRelationshipReferences
