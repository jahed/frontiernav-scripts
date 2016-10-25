const fs = require('fs')
const file = require('file')
const path = require('path')
const assert = require('assert')
const _ = require('lodash')
const toml = require('toml')

const graphPath = './graph'
const parsers = {
    '.toml': toml.parse,
    '.json': JSON.parse
}

const nodeLabels = readGraphObjects('nodeLabels')
const nodes = readGraphObjects('nodes')
const relationships = readGraphObjects('relationships')
const relationshipTypes = readGraphObjects('relationshipTypes')

function readGraphObjects(type) {
    let result = []
    file.walkSync(path.resolve(graphPath, type), (dirPath, dirs, filePaths) => {
        result = result.concat(
            filePaths
                .filter(filePath => !!parsers[path.extname(filePath)])
                .map(filePath => {
                    const absoluteFilePath =  path.resolve(dirPath, filePath)
                    const fileContent = fs.readFileSync(absoluteFilePath, { encoding: 'utf8' })

                    const parser = parsers[path.extname(filePath)]
                    const content = parser(fileContent)

                    return {
                        absoluteFilePath,
                        content
                    }
                })
        )
    })
    return result
}

describe(`Graph (${nodeLabels.length} nodeLabels, ${nodes.length} nodes, ${relationships.length} relationships, ${relationshipTypes.length} relationshipTypes)`, () => {

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
            node.content.labels.forEach(label => {
                const labelExists = nodeLabels.some(nodeLabel => nodeLabel.content.id === label)
                assert.ok(labelExists, `Node(${node.content.id}) has unknown Label(${label})`)
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
