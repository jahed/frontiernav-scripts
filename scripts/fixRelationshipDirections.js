const _ = require('lodash')
const path = require('path')
const transformAll = require('./helpers/transformAll')
const readGraph = require('../tests/helpers/readGraph')

// const graph = readGraph('./graph', r => r.content)
// const nodes = _.keyBy(graph.nodes, 'id')

fixRelationshipsWithNoContent()

function fixRelationshipsWithNoContent() {
    transformAll('./graph/relationships/xenoblade-x/pet-species', '.json', ({ object, fileContent, filePath }) => {
        if(!!fileContent) {
            return object
        }

        const id = path.basename(filePath, path.extname(filePath))
        const parts = id.split('__')
        if(parts.length !== 3) {
            throw new Error(`Found empty file with incorrect filename: ${filePath}`)
        }

        return {
            id,
            start: parts[0],
            type: parts[1],
            end: parts[2]
        }
    }, i => i)
}

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
