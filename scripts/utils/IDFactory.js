const _ = require('lodash')

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

function createNodeLabel({ id, name }) {
    return {
        id: id,
        name: name || id,
        pageDescription: 'Find out more about {name} and where you can find them.',
        properties: {}
    }
}

module.exports = {
    nameToId,
    nameToNode,
    stampRelationshipId,
    createNodeLabel
}