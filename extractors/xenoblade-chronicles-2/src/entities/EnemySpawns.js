const path = require('path')
const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const getName = require('../util/getName')
const getAllRaw = require('../util/getAllRaw')
const getRaw = require('../util/getRaw')
const Enemies = require('./Enemies')

const rawFile = path.resolve(__dirname, '../../data/database/common/CHR_EnArrange.json')
const nameFile = path.resolve(__dirname, '../../data/database/common_ms/fld_enemyname.json')

const toEntity = _.memoize(async raw => {
  const enemy = await Enemies.toEntity(raw)

  const name = await getName({
    id: raw.Name,
    file: nameFile
  })

  return {
    name: `${name} #${raw.id}`,
    enemy: enemy.name,
    level: raw.Lv
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
