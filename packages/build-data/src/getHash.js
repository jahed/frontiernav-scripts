const crypto = require('crypto')

const getHash = (object) => crypto
  .createHash('md5')
  .update(JSON.stringify(object))
  .digest('hex')

module.exports = { getHash }
