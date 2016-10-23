const _ = require('lodash')
const fs = require('fs')
const file = require('file')
const path = require('path')

module.exports = function transformAll(rootDir, extension, mapFunction) {
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
                const node = JSON.parse(fileContent)
                const newNode = mapFunction(node)

                fs.writeFileSync(filePath, JSON.stringify(newNode, undefined, 2) + '\n', { encoding: 'utf8' })
                console.log(`[OK] Wrote new node in ${filePath}`)
            })
    })
}
