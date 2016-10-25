const fs = require('fs')
const file = require('file')
const path = require('path')
const toml = require('toml')

const parsers = {
    '.toml': toml.parse,
    '.json': JSON.parse
}

function readGraphObjects(objectsPath) {
    let result = []
    file.walkSync(objectsPath, (dirPath, dirs, filePaths) => {
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

module.exports = function readGraph(graphPath) {
    return {
        nodeLabels:        readGraphObjects(path.resolve(graphPath, 'nodeLabels')),
        nodes:             readGraphObjects(path.resolve(graphPath, 'nodes')),
        relationships:     readGraphObjects(path.resolve(graphPath, 'relationships')),
        relationshipTypes: readGraphObjects(path.resolve(graphPath, 'relationshipTypes')),
    }

}
