const fs = require('fs')
const file = require('file')
const path = require('path')
const assert = require('assert')
const _ = require('lodash')

const graphPath = './graph'

const nodeLabels = readGraphObjects('nodeLabels')
const nodes = readGraphObjects('nodes')
const relationships = readGraphObjects('relationships')
const relationshipTypes = readGraphObjects('relationshipTypes')

function readGraphObjects(type) {
    let result = []
    file.walkSync(path.resolve(graphPath, type), (dirPath, dirs, filePaths) => {
        result = result.concat(
            filePaths
                .filter(filePath => path.extname(filePath) === '.json')
                .map(filePath => {
                    const absoluteFilePath =  path.resolve(dirPath, filePath)
                    const fileContent = fs.readFileSync(absoluteFilePath, { encoding: 'utf8' })
                    const content = JSON.parse(fileContent)
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
            assert.strictEqual(graphObject.content.metadata.id, path.basename(graphObject.absoluteFilePath, '.json'))
        }

        nodeLabels.forEach(assertIdsMatch)
        nodes.forEach(assertIdsMatch)
        relationships.forEach(assertIdsMatch)
        relationshipTypes.forEach(assertIdsMatch)
    })

    it('labels assigned to nodes should be defined', () => {
        nodes.forEach(node => {
            node.content.metadata.labels.forEach(label => {
                const labelExists = nodeLabels.some(nodeLabel => nodeLabel.content.metadata.id === label)
                assert.ok(labelExists, `Node(${node.content.metadata.id}) has unknown Label(${label})`)
            })
        })
    })

    it('nodes assigned to relationships should be defined', () => {
        relationships.forEach(relationship => {
            const nodesExist = _(nodes)
                .map(node => node.content.metadata.id)
                .includes(relationship.content.start, relationship.content.end)

            assert.ok(nodesExist, `Relationship(${relationship.content.metadata.id}) has unknown nodes`)
        })
    })
})
