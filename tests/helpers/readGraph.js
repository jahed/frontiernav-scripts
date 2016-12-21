const fs = require('fs')
const file = require('file')
const path = require('path')
const readObjects = require('./readObjects')

const parsers = {
    '.json': JSON.parse
}

module.exports = function readGraph(graphPath, mapResult) {
    const read = directory => readObjects(path.resolve(graphPath, directory), mapResult)
    return {
        nodeLabels:        read('nodeLabels'),
        nodes:             read('nodes'),
        relationships:     read('relationships'),
        relationshipTypes: read('relationshipTypes'),
        properties:        read('properties'),
    }
}
