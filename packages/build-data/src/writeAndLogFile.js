const fs = require('fs')
const logger = require('@frontiernav/logger')

const log = logger.get(__filename)

const writeAndLogFile = (filePath, object, overwrite = true) => {
  try {
    try {
      fs.accessSync(filePath)

      if (!overwrite) {
        log.debug('Object with current hash exists, ignoring.', filePath)
        return Promise.resolve()
      }
    } catch (e) {
      log.debug('Object with current hash does not exist, creating.', filePath)
    }

    log.info('Writing object.', filePath)
    fs.writeFileSync(filePath, JSON.stringify(object))
    return Promise.resolve()
  } catch (e) {
    return Promise.reject(e)
  }
}

exports.writeAndLogFile = writeAndLogFile
