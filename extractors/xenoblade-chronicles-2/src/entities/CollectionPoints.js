const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const { mapMappings } = require('../mappings')
const Collectibles = require('./Collectibles')
const FieldSkills = require('./FieldSkills')
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

const getDrops = async (rawCollectionPoint) => {
  const data = [
    {
      id: rawCollectionPoint.itm1ID,
      rate: rawCollectionPoint.itm1Per
    },
    {
      id: rawCollectionPoint.itm2ID,
      rate: rawCollectionPoint.itm2Per
    },
    {
      id: rawCollectionPoint.itm3ID,
      rate: rawCollectionPoint.itm3Per
    },
    {
      id: rawCollectionPoint.itm4ID,
      rate: rawCollectionPoint.itm4Per
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
    .then(drops => drops
      .filter(d => d)
      .reduce((acc, next) => {
        const current = acc[next.id]
        acc[next.id] = current
          ? {
            id: current.id,
            rate: current.rate + next.rate
          }
          : next
        return acc
      }, {})
    )
    .then(dict => _.values(dict))
}

const toCollectionPoint = _.memoize(async raw => {
  const drops = await getDrops(raw)
  const fieldSkill = await FieldSkills.getById(raw.FSID)
  return {
    name: `Collection Point #${raw.id}`,
    field_skill: fieldSkill.name,
    min_drop: raw.randitmPopMin,
    max_drop: raw.randitmPopMax,
    drops
  }
}, raw => raw.name)

exports.getByName = async ({ name }) => {
  const rawCollectionPoints = await getAllRawByName({ type: 'FLD_CollectionPopList' })
  const rawCollectionPoint = rawCollectionPoints[`${name}`]
  if (!rawCollectionPoint) {
    throw new Error(`CollectionPoint[${name}] not found`)
  }
  return toCollectionPoint(rawCollectionPoint)
}

exports.getAll = async () => {
  const rawCollectionPoints = await getAllRaw('FLD_CollectionPopList')
  return Promise
    .all(
      rawCollectionPoints.map(raw => toCollectionPoint(raw).catch(() => null))
    )
    .then(results => results.filter(r => r))
}
