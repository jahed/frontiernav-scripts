const readGraph = require('../helpers/readGraph')
const writeGraph = require('../helpers/writeGraph')
const changeNodeId = require('../helpers/changeNodeID')
const _ = require('lodash')

function arrayToIdMap(rawGraph) {
    return _.mapValues(rawGraph, objs => _.keyBy(objs, 'id'))
}

const graphDir = './games/pokemon-sun-moon/graph'
const graph = arrayToIdMap(readGraph(graphDir, ({ content }) => content))
const nodeRegex = /^marker-zygarde-core-\d+$/

let newGraph = graph
_(graph.nodes).forEach(node => {
    if(nodeRegex.test(node.id)) {
        newGraph = Object.assign({}, newGraph, {
            nodes: Object.assign({}, newGraph.nodes, {
                [node.id]: Object.assign({}, node, {
                    data: Object.assign({}, node.data, {
                        markerStyle: 'image'
                    })
                })
            })
        })
    }
})


writeGraph(graphDir, newGraph, { dryRun: false })
