const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const { mapMappings } = require('../mappings')
const Collectibles = require('./Collectibles')
const { nameToId } = require('@frontiernav/graph')

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

const getDrops = async (group) => {
  const data = [
    {
      id: group.itm1ID,
      rate: group.itm1Per
    },
    {
      id: group.itm2ID,
      rate: group.itm2Per
    },
    {
      id: group.itm3ID,
      rate: group.itm3Per
    },
    {
      id: group.itm4ID,
      rate: group.itm4Per
    }
  ]

  return Promise
    .all(
      data.map(drop => {
        return Collectibles.getById(drop.id)
          .then(collectible => collectible.name)
          .then(name => nameToId(name))
          .then(id => ({
            id,
            rate: drop.rate
          }))
          .catch(() => null)
      })
    )
    .then(drops => drops.filter(d => d))
}

const toCollectibleGroup = _.memoize(async group => {
  const drops = await getDrops(group)
  return {
    name: group.name,
    drops
  }
}, group => group.name)

exports.getByName = async ({ name }) => {
  const groups = await getAllRawByName({ type: 'FLD_CollectionPopList' })
  const group = groups[`${name}`]
  if (!group) {
    throw new Error(`CollectibleGroup[${name}] not found`)
  }
  return toCollectibleGroup(group)
}

exports.getAll = async () => {
  const groups = await getAllRaw('FLD_CollectionPopList')
  return Promise.all(
    groups.map(group => toCollectibleGroup(group))
  )
}
