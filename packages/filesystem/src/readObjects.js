const fs = require('fs')
const file = require('file')
const path = require('path')

const defaultParsers = {
  '.json': JSON.parse
}

function readObjects (objectsPath, mapResult = i => i, parsers = defaultParsers) {
  let result = []

  if (fs.existsSync(objectsPath)) {
    file.walkSync(objectsPath, (dirPath, dirs, filePaths) => {
      result = result.concat(
        filePaths
          .filter(filePath => !!parsers[path.extname(filePath)])
          .map(filePath => {
            const absoluteFilePath = path.resolve(dirPath, filePath)
            const fileContent = fs.readFileSync(absoluteFilePath, { encoding: 'utf8' })

            const parser = parsers[path.extname(filePath)]
            const content = parser(fileContent)

            // Hack to filter out unused locale data from JSON nodes
            delete content.locale

            return mapResult({
              absoluteFilePath,
              content
            })
          })
      )
    })
  }

  return result
}

module.exports = readObjects
