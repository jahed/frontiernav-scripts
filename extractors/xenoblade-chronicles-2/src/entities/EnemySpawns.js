const path = require('path')
const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const getName = require('../util/getName')
const getAllRaw = require('../util/getAllRaw')
const getRaw = require('../util/getRaw')
const Enemies = require('./Enemies')
const EnemyDropTables = require('./EnemyDropTables')
const { nameToId } = require('@frontiernav/graph')

const rawFile = path.resolve(__dirname, '../../data/database/common/CHR_EnArrange.json')
const nameFile = path.resolve(__dirname, '../../data/database/common_ms/fld_enemyname.json')

const getDropTables = async raw => {
  const tableIds = [
    raw.DropTableID, // Drops
    // raw.DropTableID2, // Quest Drops, maps to EnDropQuest instead with conditions.
    raw.DropTableID3 // Core Crystals
  ]

  return Promise
    .all(
      tableIds.map(tableId => (
        EnemyDropTables
          .getById(tableId)
          .then(dropTable => nameToId(dropTable.name))
          .catch(() => null)
      ))
    )
    .then(drops => drops
      .filter(d => d)
      .map(id => ({ id }))
    )
}

const toEntity = _.memoize(async raw => {
  const enemy = await Enemies.toEntity(raw)

  const name = await getName({
    id: raw.Name,
    file: nameFile
  })

  const dropTables = await getDropTables(raw)

  return {
    name: `${name} #${raw.id}`,
    enemy: enemy.name,
    level: raw.Lv,
    dropTables
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
