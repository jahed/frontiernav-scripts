const logger = require('@frontiernav/logger')
const { readFile, writeFile } = require('@frontiernav/filesystem')
const { getHash } = require('./getHash')

const log = logger.get(__filename)

const writeAndLogFile = (filePath, newContent) => {
  return readFile(filePath)
    .then(
      existingContent => Promise.resolve(existingContent.toString())
        .then(existingContent => getHash(existingContent))
        .then(existingHash => {
          if (existingHash === getHash(newContent)) {
            log.info('File with same content already exists.', filePath)
            return Promise.resolve()
          }
          log.info('Overwriting file.', filePath)
          return writeFile(filePath, newContent)
        }),
      () => {
        log.info('Creating file.', filePath)
        return writeFile(filePath, newContent)
      }
    )
}

exports.writeAndLogFile = writeAndLogFile
