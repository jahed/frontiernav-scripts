const readGraph = require('../helpers/readGraph')
const writeGraph = require('../helpers/writeGraph')
const changeNodeId = require('../helpers/changeNodeID')
const _ = require('lodash')

function arrayToIdMap(rawGraph) {
    return _.mapValues(rawGraph, objs => _.keyBy(objs, 'id'))
}

const graphDir = './games/pokemon-sun-moon/graph'
const graph = arrayToIdMap(readGraph(graphDir, ({ content }) => content))
const encounterRegex = /^encounter-zygarde-core-(\d+)$/

let newGraph = graph
_(graph.nodes).forEach(node => {
    if(encounterRegex.test(node.id)) {
        const matches = encounterRegex.exec(node.id)
        const number = matches[1]
        if(number) {
            const markerId = `marker-zygarde-core-${number}`
            const rid = `${markerId}__MAP_LINK__${node.id}`
            newGraph = Object.assign({}, newGraph, {
                relationships: Object.assign({}, newGraph.relationships, {
                    [rid]: {
                        id: rid,
                        start: markerId,
                        type: 'MAP_LINK',
                        end: node.id
                    }
                })
            })
        }
    }
})


writeGraph(graphDir, newGraph, { dryRun: false })
