const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')
const log = require('@frontiernav/logger').get(__filename)

const sessionId = `${new Date().toISOString().replace(/:/g, '-')}`

function writeOut ({ filename, content, destination }) {
  const outputPath = path.resolve(destination, sessionId)
  mkdirp.sync(outputPath)

  const filePath = path.resolve(outputPath, filename)
  log.info('Writing', filePath)
  fs.writeFileSync(filePath, content)
}

module.exports = writeOut
