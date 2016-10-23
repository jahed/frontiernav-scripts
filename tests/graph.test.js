const fs = require('fs')
const file = require('file')
const path = require('path')
const assert = require('assert')

const graphPath = './graph'

let graphObjects
file.walkSync(path.resolve(graphPath), (dirPath, dirs, filePaths) => {
    graphObjects = filePaths
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
})

describe(`Graph (${graphObjects.length} objects)`, () => {

    it('object filenames should match assigned IDs', () => {
        graphObjects.forEach(graphObject => {
            assert.strictEqual(graphObject.content.metadata.id, path.basename(graphObject.absoluteFilePath, '.json'))
        })
    })

    it('labels assigned to nodes should be defined', () => {
        graphObjects.forEach(graphObject => {
            if(graphObject.content.metadata.labels) {
                graphObject.content.metadata.labels.forEach(label => {
                    assert.doesNotThrow(
                        () => {
                            fs.accessSync(
                                path.resolve(graphPath, 'nodeLabels', `${label}.json`),
                                fs.constants.F_OK
                            )
                        },
                        `Node(${graphObject.content.metadata.id}) has unknown Label(${label})`
                    )
                })
            }
        })
    })
})
