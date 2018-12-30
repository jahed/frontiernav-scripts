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
      rate: dropTable.DropProb1
    },
    {
      id: dropTable.ItemID2,
      rate: dropTable.DropProb2
    },
    {
      id: dropTable.ItemID3,
      rate: dropTable.DropProb3
    },
    {
      id: dropTable.ItemID4,
      rate: dropTable.DropProb4
    },
    {
      id: dropTable.ItemID5,
      rate: dropTable.DropProb5
    },
    {
      id: dropTable.ItemID6,
      rate: dropTable.DropProb6
    },
    {
      id: dropTable.ItemID7,
      rate: dropTable.DropProb7
    },
    {
      id: dropTable.ItemID8,
      rate: dropTable.DropProb8
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
            rate: drop.rate
          }))
          .catch(() => null)
      })
    )
    .then(drops => drops
      .filter(d => d)
      .reduce((acc, next) => {
        const existing = acc[next.id]
        const nextRate = { rate: next.rate }
        if (existing) {
          existing.rates.push(nextRate)
        } else {
          acc[next.id] = {
            id: next.id,
            rates: [nextRate]
          }
        }
        return acc
      }, {})
    )
    .then(dict => _.values(dict))
}

const toEntity = _.memoize(async raw => {
  const drops = await getDrops(raw)

  return {
    name: `Enemy Drop Table #${raw.id}`,
    drops
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
