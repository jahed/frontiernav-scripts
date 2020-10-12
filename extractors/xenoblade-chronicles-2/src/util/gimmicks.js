const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const { mapMappings } = require('./mappings-xb2ttgc')

const readGimmicks = async ({ map, type }) => {
  try {
    const filePath = map
      ? path.resolve(__dirname, '../../data/database/common_gmk', `${map}_${type}.json`)
      : path.resolve(__dirname, '../../data/database/common_gmk', `${type}.json`)
    const content = await readFile(filePath)
    return JSON.parse(content)
  } catch (e) {
    return []
  }
}

const getAllRaw = _.memoize(async type => {
  const contents = await Promise.all([
    readGimmicks({ type }),
    ...mapMappings.map(mapping => readGimmicks({ map: mapping.game_id, type }))
  ])

  return _.flatten(contents)
})

const getAllRawByName = _.memoize(async ({ type }) => {
  return _(await getAllRaw(type)).keyBy('name').value()
})

module.exports = {
  getAllRaw,
  getAllRawByName
}
