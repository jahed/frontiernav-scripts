const forEach = require('lodash/forEach')

function satisfiesLabels (node, labels) {
  return Object.keys(node.labels).some(label => labels[label])
}

function validateGraph (graph) {
  const failures = []

  forEach(graph.relationships, r => {
    const rType = graph.relationshipTypes[r.type]

    const failure = {
      type: 'relationship',
      content: r,
      relationshipType: rType,
      errors: []
    }

    if (!rType) {
      failure.errors.push(`Relationship Type "${r.type}" does not exist.`)
    }

    const startNode = graph.nodes[r.start]
    if (!startNode) {
      failure.errors.push(`Start Node "${r.start}" does not exist.`)
    }

    const endNode = graph.nodes[r.end]
    if (!endNode) {
      failure.errors.push(`End Node "${r.end}" does not exist.`)
    }

    if (rType && startNode && endNode) {
      if (!satisfiesLabels(startNode, rType.startLabels)) {
        failure.errors.push(`Start Node "${r.start}" does not satisfy relationship "${r.type}".`)
      }

      if (!satisfiesLabels(endNode, rType.endLabels)) {
        failure.errors.push(`End Node "${r.end}" does not satisfy relationship "${r.type}".`)
      }
    }

    if (failure.errors.length > 0) {
      failures.push(failure)
    }
  })

  return Promise.resolve(failures)
}

module.exports = validateGraph
