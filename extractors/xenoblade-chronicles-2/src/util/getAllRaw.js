const { readFile } = require('@frontiernav/filesystem')
const _ = require('lodash')

const getAllRaw = _.memoize(async ({ file }) => {
  const content = await readFile(file)
  return JSON.parse(content)
}, args => args.file)

module.exports = getAllRaw
