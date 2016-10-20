const fs = require('fs')
const file = require('file')
const path = require('path')
const assert = require('assert')

describe('Graph', () => {
    it('should match node filenames with IDs', () => {
        file.walkSync(path.resolve('./graph'), (dirPath, dirs, filePaths) => {
            filePaths
                .filter(filePath => path.extname(filePath) === '.json')
                .forEach(filePath => {
                    const fileContent = fs.readFileSync(path.resolve(dirPath, filePath), { encoding: 'utf8' })
                    const node = JSON.parse(fileContent)

                    assert.strictEqual(node.metadata.id, path.basename(filePath, '.json'))
                })

        })
    })
})
