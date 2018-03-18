const path = require('path')
const readObjects = require('./readObjects')

function readGraph (graphPath, mapResult) {
  const readGraphObjects = directory => readObjects(path.resolve(graphPath, directory), mapResult)
  return {
    nodeLabels: readGraphObjects('nodeLabels'),
    nodes: readGraphObjects('nodes'),
    relationships: readGraphObjects('relationships'),
    relationshipTypes: readGraphObjects('relationshipTypes'),
    properties: readGraphObjects('properties')
  }
}

module.exports = readGraph
