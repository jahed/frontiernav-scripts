const _ = require('lodash')
const assert = require('assert')

function nameToId(s) {
    return _.kebabCase(s)
}

function stampRelationshipId(r) {
    return {
        ...r,
        id: [r.start, r.type, r.end].join('__')
    }
}

function nameToNode(name, labels = []) {
    return {
        id: nameToId(name),
        labels: labels,
        data: {
            name: name
        }
    }
}

function nameToLabelId(name) {
    return name.replace(/\s/g, '')
}

function createNodeLabel({ id, name }) {
    assert(id || name, 'A name or id must be provided to create a Node Label.')

    return {
        id: id || nameToLabelId(name),
        name: name || id,
        pageDescription: 'Find out more about {name} and where you can find them.',
        properties: {}
    }
}

module.exports = {
    nameToId,
    nameToNode,
    stampRelationshipId,
    nameToLabelId,
    createNodeLabel
}