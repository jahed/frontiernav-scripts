const kebabCase = require('lodash/kebabCase')

function nameToId (name) {
  return kebabCase(name)
}

module.exports = nameToId
