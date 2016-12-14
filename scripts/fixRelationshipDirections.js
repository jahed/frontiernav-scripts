const _ = require('lodash')
const transformAll = require('./helpers/transformAll')
const readGraph = require('../tests/helpers/readGraph')

const graph = readGraph('./graph', r => r.content)
const nodes = _.keyBy(graph.nodes, 'id')

fixUnsetRelationshipTypes()

function fixUnsetRelationshipTypes() {
    transformAll('./graph/relationships', '.json', relationship => {
        if(typeof relationship.type !== 'undefined') {
            return relationship
        }

        return Object.assign({}, relationship, {
            type: 'HAS'
        })
    })
}

function fixSegmentGoalDirections() {
    transformAll('./graph/relationships', '.json', relationship => {
        if(relationship.type !== 'GOAL') {
            return relationship
        }

        const startNode = nodes[relationship.start]
        const endNode = nodes[relationship.end]

        if(nodeHasLabel(startNode, 'Segment')) {
            return relationship
        }

        return Object.assign({}, relationship, {
            type: 'GOAL',
            start: endNode.id,
            end: startNode.id,
        })
    })
}

function fixMapLinkDirections() {
    transformAll('./graph/relationships', '.json', relationship => {
        if(relationship.type !== 'MAP_LINK') {
            return relationship
        }

        const startNode = nodes[relationship.start]
        const endNode = nodes[relationship.end]

        if(nodeIsMarker(startNode)) {
            return relationship
        }

        return Object.assign({}, relationship, {
            type: 'MAP_LINK',
            start: endNode.id,
            end: startNode.id,
        })
    })
}


function nodeHasLabel(node, label) {
    return node.labels.indexOf(label) !== -1
}

function nodeIsMarker(node) {
    return nodeHasLabel(node, 'MapMarker')
        || nodeHasLabel(node, 'MapArea')
        || nodeHasLabel(node, 'FNSiteGraph')
        || nodeHasLabel(node, 'SegmentGrid')
}
