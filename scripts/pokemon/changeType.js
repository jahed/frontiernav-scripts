const readGraph = require('../helpers/readGraph')
const writeGraph = require('../helpers/writeGraph')
const _ = require('lodash')

function arrayToIdMap(rawGraph) {
    return _.mapValues(rawGraph, objs => _.keyBy(objs, 'id'))
}

const graphDir = './games/pokemon-sun-moon/graph'
const graph = arrayToIdMap(readGraph(graphDir, ({ content }) => content))

let newGraph = graph
_(graph.relationships).forEach(relationship => {
    if(relationship.type === 'HAS' && relationship.start === 'map-layer-zygarde-pieces') {
        const newId = `${relationship.start}__MARKED_WITH__${relationship.end}`
        newGraph = Object.assign({}, newGraph, {
            relationships: Object.assign({}, _.omit(newGraph.relationships, [relationship.id]), {
                [newId]: Object.assign({}, relationship, {
                    id: newId,
                    type: 'MARKED_WITH'
                })
            })
        })
    }
})


writeGraph(graphDir, newGraph, { dryRun: false })
