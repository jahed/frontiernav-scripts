const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const { mapMappings } = require('../mappings')

const getAllRaw = _.memoize(async type => {
  const contents = await Promise.all(
    mapMappings.map(mapping => {
      const filePath = path.resolve(__dirname, '../../data/database/common_gmk', `${mapping.game_id}_${type}.json`)
      return readFile(filePath)
        .then(content => JSON.parse(content))
        .catch(() => {
          return []
        })
    })
  )

  return contents.reduce((acc, next) => acc.concat(next), [])
})

const getAllRawByName = _.memoize(async ({ type }) => {
  return _(await getAllRaw(type)).keyBy('name').value()
})

module.exports = {
  getAllRaw,
  getAllRawByName
}
