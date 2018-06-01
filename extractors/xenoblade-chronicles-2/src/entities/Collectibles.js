const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')

const getAllRaw = _.memoize(async () => {
  const content = await readFile(path.resolve(__dirname, '../../data/database/common/ITM_CollectionList.json'))
  return JSON.parse(content)
})

const getAllRawByName = _.memoize(async () => {
  return _(await getAllRaw()).keyBy('Name').value()
})

const getAllRawById = _.memoize(async () => {
  return _(await getAllRaw()).keyBy('id').value()
})

const getAllRawNamesById = _.memoize(async () => {
  const content = await readFile(path.resolve(__dirname, '../../data/database/common_ms/itm_collection.json'))
  return _(JSON.parse(content)).keyBy('id').value()
})

const toCollectible = _.memoize(async collectible => {
  const collectibleNames = await getAllRawNamesById()
  const collectibleName = collectibleNames[collectible.Name]

  return {
    name: collectibleName ? collectibleName.name : `unknown-${collectible.Name}`,
    game_id: collectible.id
  }
}, collectible => collectible.id)

exports.getByName = async name => {
  const collectibles = await getAllRawByName()
  const collectible = collectibles[`${name}`]
  if (!collectible) {
    throw new Error(`Failed to find Collectible[${name}]`)
  }
  return toCollectible(collectible)
}

exports.getById = async id => {
  const collectibles = await getAllRawById()
  const collectible = collectibles[`${id}`]
  if (!collectible) {
    throw new Error(`Failed to find Collectible[${id}]`)
  }
  return toCollectible(collectible)
}

exports.getAll = async () => {
  const all = await getAllRaw()
  return Promise.all(
    all.map(one => toCollectible(one))
  )
}
