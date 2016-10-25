const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const readGraph = require('../helpers/readGraph')
const countGraph = require('../helpers/countGraph')

const graph = readGraph('./graph')
const { nodeLabels, nodes, relationships, relationshipTypes } = graph

describe(`Graph (${countGraph(graph)})`, () => {

    it('filenames should match assigned IDs', () => {
        const assertIdsMatch = graphObject => {
            assert.strictEqual(
                graphObject.content.id,
                path.basename(graphObject.absoluteFilePath, path.extname(graphObject.absoluteFilePath))
            )
        }

        nodeLabels.forEach(assertIdsMatch)
        nodes.forEach(assertIdsMatch)
        relationships.forEach(assertIdsMatch)
        relationshipTypes.forEach(assertIdsMatch)
    })

    it('IDs should be unique', () => {
        const dupes = _(nodes)
            .groupBy('content.id')
            .mapValues(group => group.length)
            .pickBy(length => length > 1)
            .keys()
            .value()

        assert.deepStrictEqual(dupes, [])
    })

    it('labels assigned to nodes should be defined', () => {
        nodes.forEach(node => {
            node.content.labels.forEach(labelId => {
                const labelExists = nodeLabels.some(nodeLabel => nodeLabel.content.id === labelId)
                assert.ok(labelExists, `Node(${node.content.id}) has unknown Label(${labelId})`)
            })
        })
    })

    it('nodes assigned to relationships should be defined', () => {
        relationships.forEach(relationship => {
            const nodesExist = _(nodes)
                .map(node => node.content.id)
                .includes(relationship.content.start, relationship.content.end)

            assert.ok(nodesExist, `Relationship(${relationship.content.id}) has unknown nodes`)
        })
    })
})
