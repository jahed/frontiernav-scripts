const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const readGraph = require('../helpers/readGraph')
const countGraph = require('../helpers/countGraph')

const graph = readGraph('./graph')
const { nodeLabels, nodes, relationships, relationshipTypes, locales } = graph

describe('Graph', () => {

    it(`read (${countGraph(graph)})`, () => {

    })

    it('filenames should match assigned IDs', () => {
        const assertIdsMatch = (type, graphObject) => {
            const id = graphObject.content.id
            const filenameWithoutExt = path.basename(graphObject.absoluteFilePath, path.extname(graphObject.absoluteFilePath))
            assert.strictEqual(
                id,
                filenameWithoutExt,
                `${type}(${id}) does not match filename "${graphObject.absoluteFilePath}"`
            )
        }

        _.forEach(graph, (objects, type) => {
            objects.forEach(obj => assertIdsMatch(type, obj))
        })
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
        const nodesById = _(nodes).keyBy('content.id').value()
        relationships.forEach(relationship => {
            const nodesExist = nodesById[relationship.content.start] && nodesById[relationship.content.end]
            assert.ok(nodesExist, `Relationship(${relationship.content.id}) has unknown nodes`)
        })
    })

    describe('locale', () => {

        it('codes should match locale defined in graph', () => {
            _(nodes)
                .map('content')
                .filter('locale')
                .forEach(node => {
                    _.forEach(node.locale, (localeData, code) => {
                        assert.ok(
                            locales.some(locale => locale.content.id === code),
                            `Unknown language code "${code}" found in Node(${node.id})`
                        )
                    })
                })
        })

        it('field names should match base data field names', () => {
            _(nodes)
                .map('content')
                .filter('locale')
                .forEach(node => {
                    _.forEach(node.locale, (localeData, code) => {
                        const unknownFieldNames = _(localeData)
                            .keys()
                            .filter(fieldName => !node.data[fieldName])
                            .value()

                        assert.deepStrictEqual(unknownFieldNames, [], `Unknown fields found in Node(${node.id})'s "${code}" locale.`)
                    })
                })
        })
    })
})
