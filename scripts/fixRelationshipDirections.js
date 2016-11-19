const _ = require('lodash')
const transformAll = require('./helpers/transformAll')
const readGraph = require('../tests/helpers/readGraph')

const graph = readGraph('./graph', r => r.content)
const nodes = _.keyBy(graph.nodes, 'id')

transformAll('./graph/relationships', '.json', relationship => {
    const startNode = nodes[relationship.start]
    const endNode = nodes[relationship.end]

    if(endNode.labels.indexOf('MapLayer') !== -1) {
        if(startNode.labels.indexOf('MapMarker') !== -1 || startNode.labels.indexOf('MapArea') !== -1) {
            return Object.assign({}, relationship, {
                start: endNode.id,
                end: startNode.id,
                type: 'MARKED_WITH',
            })
        }
    }

    if(endNode.labels.indexOf('MapMarker') !== -1 || startNode.labels.indexOf('MapArea') !== -1) {
        if(startNode.labels.indexOf('MapLayer') !== -1) {
            return Object.assign({}, relationship, {
                type: 'MARKED_WITH',
            })
        }
    }

    return relationship
})
