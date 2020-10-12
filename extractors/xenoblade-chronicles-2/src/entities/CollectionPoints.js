const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const Collectibles = require('./Collectibles')
const FieldSkills = require('./FieldSkills')
const { getAllRaw, getAllRawByName } = require('../util/gimmicks')
const { stampRelationshipId, stampEntityId } = require('@frontiernav/graph')
const path = require('path')
const { readFile } = require('@frontiernav/filesystem')

const getCollectionTable = _.memoize(async () => {
  const filePath = path.resolve(__dirname, '../../data/database/common/FLD_CollectionTable.json')
  const content = await readFile(filePath)
  return JSON.parse(content)
})

const getDrops = async (point, table) => {
  const data = [
    {
      id: table.itm1ID,
      rate: table.itm1Per
    },
    {
      id: table.itm2ID,
      rate: table.itm2Per
    },
    {
      id: table.itm3ID,
      rate: table.itm3Per
    },
    {
      id: table.itm4ID,
      rate: table.itm4Per
    }
  ]

  return Promise
    .all(
      data.map(drop => {
        return Collectibles.getById(drop.id)
          .then(collectible => ({
            target: collectible.entity,
            rate: drop.rate
          }))
          .catch(() => null)
      })
    )
    .then(drops => drops
      .filter(d => d)
      .reduce((acc, next) => {
        const nextRate = { rate: next.rate }
        const existing = acc[next.target.id]
        if (existing) {
          existing.data.rates.push(nextRate)
        } else {
          acc[next.target.id] = stampRelationshipId({
            type: 'CollectionPoint-DROPS',
            start: point.id,
            end: next.target.id,
            data: {
              rates: [nextRate]
            }
          })
        }
        return acc
      }, {})
    )
    .then(dict => _.values(dict))
}

const toCollectionPoint = _.memoize(async raw => {
  if (!raw.name) {
    throw new Error(`CollectionPoint[${raw.id}] has no name`)
  }
  const table = raw.CollectionTable
    ? (await getCollectionTable()).find(row => row.id === raw.CollectionTable)
    : raw

  const entity = {
    id: raw.name,
    type: 'CollectionPoint',
    data: {
      name: `Collection Point #${raw.id}`,
      game_id: raw.name,
      min_drop: table.randitmPopMin,
      max_drop: table.randitmPopMax
    }
  }

  const drops = await getDrops(entity, table)
  // const fieldSkill = await FieldSkills.getById(table.FSID)

  return {
    entity,
    relationships: [
      // stampRelationshipId({
      //   type: 'CollectionPoint-FIELD_SKILL',
      //   start: entity.id,
      //   end: nameToId(fieldSkill.name),
      //   data: {}
      // }),
      ...drops
    ]
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
      rawCollectionPoints.map(raw => (
        toCollectionPoint(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => r))
}

exports.schema = {
  entityType: {
    id: 'CollectionPoint',
    name: 'Collection Point',
    hue: 70,
    properties: {
      name: {
        id: 'name',
        name: 'Name',
        type: 'string',
        required: true
      },
      game_id: {
        id: 'game_id',
        name: 'Game ID',
        type: 'string',
        hidden: true
      },
      min_drop: {
        id: 'min_drop',
        name: 'Minimum Drops',
        type: 'number'
      },
      max_drop: {
        id: 'max_drop',
        name: 'Maximum Drops',
        type: 'number'
      }
    }
  },
  relationships: [
    {
      relationshipType: { id: 'CollectionPoint-DROPS' },
      startEntityType: { id: 'CollectionPoint' },
      endEntityType: { id: 'Collectible' }
    }
  ],
  relationshipProperties: [
    {
      relationshipType: { id: 'CollectionPoint-DROPS' },
      property: {
        id: 'rates',
        name: 'Rates',
        type: 'object'
      }
    }
  ]
}
