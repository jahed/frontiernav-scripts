const _ = require('lodash')
const fs = require('fs')
const file = require('file')
const path = require('path')

module.exports = function transformAll(rootDir, extension, mapFunction, argsFunction = ({ object }) => object) {
    file.walk(rootDir, (err, dirPath, dirs, filePaths) => {
        if(err) {
            console.error(err)
            return
        }

        _(filePaths)
            .filter(filePath => path.extname(filePath) === extension)
            .forEach(filePath => {
                // Synchronous to avoid hitting OS-level file access limits
                const fileContent = fs.readFileSync(filePath, { encoding: 'utf8' })
                const object = fileContent ? JSON.parse(fileContent) : undefined
                const newObject = mapFunction(argsFunction({ object, fileContent, filePath }))

                if(!_.isEqual(newObject, object)) {
                    fs.writeFileSync(filePath, JSON.stringify(newObject, undefined, 2) + '\n', { encoding: 'utf8' })
                    console.log(`[OK] Wrote new object in ${filePath}`)
                }
            })
    })
}
