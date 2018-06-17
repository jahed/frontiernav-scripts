const _ = require('lodash')
const getAllRaw = require('./getAllRaw')

const getAllRawById = _.memoize(async ({ file }) => {
  return _(await getAllRaw({ file })).keyBy('id').value()
}, args => args.file)

const getRaw = async ({ id, file }) => {
  const allRawById = await getAllRawById({ file })

  const raw = allRawById[id]

  if (!raw) {
    throw new Error(`failed to find id ${id} in ${file}`)
  }

  return raw
}

module.exports = getRaw
