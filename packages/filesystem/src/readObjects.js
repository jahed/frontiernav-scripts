const fs = require('fs')
const file = require('file')
const path = require('path')

const parsers = {
  '.json': JSON.parse
}

function readObjects (objectsPath, mapResult = i => i) {
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
