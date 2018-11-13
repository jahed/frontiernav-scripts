const crypto = require('crypto')

const withVersion = (object, versionedObject = object) => Object.assign(
  {
    _version: crypto
      .createHash('md5')
      .update(JSON.stringify(versionedObject))
      .digest('hex')
  },
  object
)

exports.withVersion = withVersion
