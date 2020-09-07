const _ = require('lodash')

function changeNodeID(graph, previousId, newId) {
    const node = Object.assign({}, graph.nodes[previousId], { id: newId })

    return Object.assign({}, graph, {
        nodes: _(graph.nodes)
            .omit(previousId)
            .assign({
                [newId]: node
            })
            .value(),
        relationships: _(graph.relationships)
            .mapValues(r => {
                let newR = r

                if(r.start === previousId) {
                    newR = Object.assign({}, newR, { start: newId })
                }

                if(r.end === previousId) {
                    newR = Object.assign({}, newR, { end: newId })
                }

                if(newR !== r) {
                    newR = Object.assign({}, newR, {
                        id: `${newR.start}__${newR.type}__${newR.end}`,
                    })
                }

                return newR
            })
            .keyBy('id')
            .value()
    })
}

module.exports = changeNodeID
