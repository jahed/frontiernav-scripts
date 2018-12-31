const path = require('path')
const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const getAllRaw = require('../util/getAllRaw')
const getRaw = require('../util/getRaw')
const { findItem } = require('../util/findItem')
const { nameToId } = require('@frontiernav/graph')

const rawFile = path.resolve(__dirname, '../../data/database/common/BTL_EnDropItem.json')

const getDrops = async dropTable => {
  const data = [
    {
      id: dropTable.ItemID1,
      rate: dropTable.DropProb1,
      first_unique_kill_drop: dropTable.FirstNamed1 === 1
    },
    {
      id: dropTable.ItemID2,
      rate: dropTable.DropProb2,
      first_unique_kill_drop: dropTable.FirstNamed2 === 1
    },
    {
      id: dropTable.ItemID3,
      rate: dropTable.DropProb3,
      first_unique_kill_drop: dropTable.FirstNamed3 === 1
    },
    {
      id: dropTable.ItemID4,
      rate: dropTable.DropProb4,
      first_unique_kill_drop: dropTable.FirstNamed4 === 1
    },
    {
      id: dropTable.ItemID5,
      rate: dropTable.DropProb5,
      first_unique_kill_drop: dropTable.FirstNamed5 === 1
    },
    {
      id: dropTable.ItemID6,
      rate: dropTable.DropProb6,
      first_unique_kill_drop: dropTable.FirstNamed6 === 1
    },
    {
      id: dropTable.ItemID7,
      rate: dropTable.DropProb7,
      first_unique_kill_drop: dropTable.FirstNamed7 === 1
    },
    {
      id: dropTable.ItemID8,
      rate: dropTable.DropProb8,
      first_unique_kill_drop: dropTable.FirstNamed8 === 1
    }
  ]

  return Promise
    .all(
      data.map(drop => {
        return findItem(drop.id)
          .then(item => item.name)
          .then(name => nameToId(name))
          .then(id => ({
            id,
            rate: drop.rate,
            first_unique_kill_drop: drop.first_unique_kill_drop
          }))
          .catch(() => null)
      })
    )
    .then(drops => drops
      .filter(d => d)
      .reduce((acc, next) => {
        if (next.first_unique_kill_drop) {
          const existing = acc.first_unique_kill_drops[next.id]
          const nextRate = { rate: 1000 }
          if (existing) {
            existing.rates.push(nextRate)
          } else {
            acc.first_unique_kill_drops[next.id] = {
              id: next.id,
              rates: [nextRate]
            }
          }
        }

        if (next.rate === 0) {
          return acc
        }

        const existing = acc.drops[next.id]
        const nextRate = { rate: next.rate }
        if (existing) {
          existing.rates.push(nextRate)
        } else {
          acc.drops[next.id] = {
            id: next.id,
            rates: [nextRate]
          }
        }
        return acc
      }, {
        drops: {},
        first_unique_kill_drops: {}
      })
    )
    .then(dict => ({
      drops: _.values(dict.drops),
      first_unique_kill_drops: _.values(dict.first_unique_kill_drops)
    }))
}

const toEntity = _.memoize(async raw => {
  const { drops, first_unique_kill_drops } = await getDrops(raw)
  return {
    name: `Enemy Drop Table #${raw.id}`,
    drops,
    first_unique_kill_drops
  }
}, raw => raw.id)

exports.getById = async id => {
  return toEntity(await getRaw({ id, file: rawFile }))
}

exports.getAll = async () => {
  const allRaw = await getAllRaw({
    file: rawFile
  })
  return Promise
    .all(
      allRaw.map(raw => (
        toEntity(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => !!r))
}
