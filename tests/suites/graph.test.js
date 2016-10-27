const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const readGraph = require('../helpers/readGraph')
const countGraph = require('../helpers/countGraph')
const locales = require('../data/locales.json')

const graph = readGraph('./graph')
const { nodeLabels, nodes, relationships, relationshipTypes } = graph

describe('Graph', () => {

    it(`read (${countGraph(graph)})`, () => {

    })

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

    describe('locale', () => {

        it('codes should be ISO 639-1 codes', () => {
            _(nodes)
                .map('content')
                .filter('locale')
                .forEach(node => {
                    _.forEach(node.locale, (localeData, code) => {
                        assert.ok(!!locales[code], `Unknown language code "${code}" found in Node(${node.id})`)
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
