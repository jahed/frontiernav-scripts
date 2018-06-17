const forEach = require('lodash/forEach')
const log = require('@frontiernav/logger').get(__filename)

function satisfiesLabels (node, labels) {
  return Object.keys(node.labels).some(label => labels[label])
}

function validateGraph (graph) {
  const failures = []

  const validationLog = log.child({ name: graph.id })

  validationLog.info('validating relationships')
  forEach(graph.relationships, r => {
    const rType = graph.relationshipTypes[r.type]

    const errors = []

    if (!rType) {
      errors.push(`Relationship Type "${r.type}" does not exist.`)
    }

    const startNode = graph.nodes[r.start]
    if (!startNode) {
      errors.push(`Start Node "${r.start}" does not exist.`)
    }

    const endNode = graph.nodes[r.end]
    if (!endNode) {
      errors.push(`End Node "${r.end}" does not exist.`)
    }

    if (rType && startNode && endNode) {
      if (!satisfiesLabels(startNode, rType.startLabels)) {
        errors.push(`Start Node "${r.start}" does not satisfy relationship "${r.type}".`)
      }

      if (!satisfiesLabels(endNode, rType.endLabels)) {
        errors.push(`End Node "${r.end}" does not satisfy relationship "${r.type}".`)
      }
    }

    if (errors.length > 0) {
      failures.push({
        type: 'relationship',
        content: r,
        relationshipType: rType,
        errors
      })
    }
  })

  return Promise.resolve(failures)
}

module.exports = validateGraph
