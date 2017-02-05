const readGraph = require('../helpers/readGraph')
const writeGraph = require('../helpers/writeGraph')
const changeNodeId = require('../helpers/changeNodeID')
const _ = require('lodash')

function arrayToIdMap(rawGraph) {
    return _.mapValues(rawGraph, objs => _.keyBy(objs, 'id'))
}

const graphDir = './games/pokemon-sun-moon/graph'
const graph = arrayToIdMap(readGraph(graphDir, ({ content }) => content))
const markerIdRegex = /^n(\d+)$/

// let newGraph = graph
// _(graph.nodes).forEach(node => {
//     if(node.labels.indexOf('MapMarker') !== -1 && markerIdRegex.test(node.id)) {
//         const matches = markerIdRegex.exec(node.id)
//         if(matches[1]) {
let newGraph = changeNodeId(graph, 'alola-location-layer', `map-layer-zygarde-pieces`)
//         }
//     }
// })


writeGraph(graphDir, newGraph, { dryRun: false })
