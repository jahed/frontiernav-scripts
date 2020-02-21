const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const Collectibles = require('./Collectibles')
const Accessories = require('./Accessories')
const CoreChips = require('./CoreChips')
const KeyItems = require('./KeyItems')
const UnrefinedAuxCores = require('./UnrefinedAuxCores')
const CoreCrystals = require('./CoreCrystals')
const Boosters = require('./Boosters')
const { nameToId, stampEntityId, stampRelationshipId } = require('@frontiernav/graph')
const { getAllRaw, getAllRawByName } = require('../util/gimmicks')

const ItemTypes = [Collectibles, Accessories, CoreCrystals, UnrefinedAuxCores, CoreChips, KeyItems, Boosters]

const getDropRelationships = async (startId, rawTreasurePoint) => {
  const data = [
    {
      id: rawTreasurePoint.itm1ID,
      rate: 100,
      count: rawTreasurePoint.itm1Num
    },
    {
      id: rawTreasurePoint.itm2ID,
      rate: 100,
      count: rawTreasurePoint.itm2Num
    },
    {
      id: rawTreasurePoint.itm3ID,
      rate: 100,
      count: rawTreasurePoint.itm3Num
    },
    {
      id: rawTreasurePoint.itm4ID,
      rate: 100,
      count: rawTreasurePoint.itm4Num
    },
    {
      id: rawTreasurePoint.itm5ID,
      rate: 100,
      count: rawTreasurePoint.itm5Num
    },
    {
      id: rawTreasurePoint.itm6ID,
      rate: 100,
      count: rawTreasurePoint.itm6Num
    },
    {
      id: rawTreasurePoint.itm7ID,
      rate: 100,
      count: rawTreasurePoint.itm7Num
    },
    {
      id: rawTreasurePoint.itm8ID,
      rate: 100,
      count: rawTreasurePoint.itm8Num
    }
  ]

  return Promise
    .all(
      data
        .filter(drop => !!drop.id)
        .map(drop => {
          return ItemTypes
            .reduce((chain, type) => {
              return chain
                .catch(() => type.getById(drop.id))
            }, Promise.reject(new Error('No types to search through.')))
            .catch(error => {
              console.error(`TreasureBox[${rawTreasurePoint.id}] Item[${drop.id}] not found.`, error)
              console.dir(rawTreasurePoint)
              process.exit(1)
            })
            .then(item => item.name)
            .then(name => nameToId(name))
            .then(id => ({
              id,
              rate: drop.rate,
              count: drop.count
            }))
        })
    )
    .then(drops => drops
      .filter(d => d)
      .reduce((acc, next) => {
        const existing = acc[next.id]
        const nextRate = {
          rate: next.rate,
          count: next.count
        }
        if (existing) {
          existing.data.rates.push(nextRate)
        } else {
          acc[next.id] = stampRelationshipId({
            type: 'TreasurePoint-DROPS',
            start: startId,
            end: next.id,
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

/**
 * TODO: Process FSID and FSID2 (FLD_FieldSkillSetting)
 */
const toTreasurePoint = async raw => {
  const treasurePoint = stampEntityId({
    type: 'TreasurePoint',
    data: {
      name: `Treasure Point #${raw.id}`,
      min_gold: raw.goldMin,
      max_gold: raw.goldMax
    }
  })
  const drops = await getDropRelationships(treasurePoint.id, raw)
  return {
    entity: treasurePoint,
    relationships: [...drops]
  }
}

exports.getByName = async ({ name }) => {
  const rawTreasurePoints = await getAllRawByName({ type: 'FLD_TboxPop' })
  const rawTreasurePoint = rawTreasurePoints[`${name}`]
  if (!rawTreasurePoint) {
    throw new Error(`TreasurePoint[${name}] not found`)
  }
  return toTreasurePoint(rawTreasurePoint)
}

exports.getAll = async () => {
  const rawTreasurePoints = await getAllRaw('FLD_TboxPop')
  return Promise
    .all(
      rawTreasurePoints.map(raw => (
        toTreasurePoint(raw)
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
    id: 'TreasurePoint',
    name: 'Treasure Point',
    hue: 60,
    properties: {
      name: {
        id: 'name',
        name: 'Name',
        type: 'string',
        required: true
      },
      min_gold: {
        id: 'min_gold',
        name: 'Min. Gold',
        type: 'number'
      },
      max_gold: {
        id: 'max_gold',
        name: 'Max. Gold',
        type: 'number'
      }
    }
  },
  relationshipProperties: [
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      property: {
        id: 'rates',
        name: 'Rates',
        type: 'object'
      }
    }
  ],
  relationships: [
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      startEntityType: { id: 'TreasurePoint' },
      endEntityType: { id: 'Collectible' }
    },
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      startEntityType: { id: 'TreasurePoint' },
      endEntityType: { id: 'Accessory' }
    },
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      startEntityType: { id: 'TreasurePoint' },
      endEntityType: { id: 'CoreCrystal' }
    },
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      startEntityType: { id: 'TreasurePoint' },
      endEntityType: { id: 'UnrefinedAuxCore' }
    },
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      startEntityType: { id: 'TreasurePoint' },
      endEntityType: { id: 'CoreChip' }
    },
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      startEntityType: { id: 'TreasurePoint' },
      endEntityType: { id: 'KeyItem' }
    },
    {
      relationshipType: { id: 'TreasurePoint-DROPS' },
      startEntityType: { id: 'TreasurePoint' },
      endEntityType: { id: 'Booster' }
    }
  ]
}
