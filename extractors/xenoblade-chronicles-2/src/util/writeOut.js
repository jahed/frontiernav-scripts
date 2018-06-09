const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')
const pino = require('pino')
const log = pino({ prettyPrint: true }).child({ name: path.basename(__filename, '.js') })

const sessionId = `${new Date().toISOString().replace(/:/g, '-')}`

function writeOut ({ filename, content }) {
  const outputPath = path.resolve(__dirname, '../../out', sessionId)
  mkdirp.sync(outputPath)

  const filePath = path.resolve(outputPath, filename)
  log.info('Writing', filePath)
  fs.writeFileSync(filePath, content)
}

module.exports = writeOut
