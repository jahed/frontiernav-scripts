const path = require('path')
const pino = require('pino')

const logger = pino({
  prettyPrint: true,
  serializers: {
    error: pino.stdSerializers.err
  }
})

exports.get = filename => logger.child({ name: path.basename(filename, '.js') })
