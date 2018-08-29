const path = require('path')
const pino = require('pino')

const logger = pino({
  prettyPrint: {
    translateTime: "yyyy-mm-dd'T'HH:MM:ss'Z'"
  },
  serializers: {
    error: pino.stdSerializers.err
  }
})

exports.get = filename => logger.child({ name: path.basename(filename, '.js') })
