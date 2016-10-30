const fs = require('fs')
const file = require('file')
const path = require('path')
const toml = require('toml')

const parsers = {
    '.toml': toml.parse,
    '.json': JSON.parse
}

function readGraphObjects(objectsPath, mapResult) {
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

                    return mapResult({
                        absoluteFilePath,
                        content
                    })
                })
        )
    })
    return result
}

module.exports = function readGraph(graphPath, mapResult = i => i) {
    const read = type => readGraphObjects(path.resolve(graphPath, type), mapResult)
    return {
        nodeLabels:        read('nodeLabels'),
        nodes:             read('nodes'),
        relationships:     read('relationships'),
        relationshipTypes: read('relationshipTypes'),
        locales:           read('locales'),
    }

}
