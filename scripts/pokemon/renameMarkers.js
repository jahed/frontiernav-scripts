const readGraph = require('../helpers/readGraph')
const writeGraph = require('../helpers/writeGraph')
const changeNodeId = require('../helpers/changeNodeID')
const _ = require('lodash')

function arrayToIdMap(rawGraph) {
    return _.mapValues(rawGraph, objs => _.keyBy(objs, 'id'))
}

const graphDir = './games/pokemon-sun-moon/graph'
const graph = arrayToIdMap(readGraph(graphDir, ({ content }) => content))

const newGraph = changeNodeId(graph, 'n1', 'marker-zygarde-cell-1')

writeGraph(graphDir, newGraph)
