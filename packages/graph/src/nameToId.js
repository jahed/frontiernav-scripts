const _ = require('lodash')

function nameToId (s) {
  return _.kebabCase(s)
}

module.exports = nameToId
