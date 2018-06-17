const path = require('path')
const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const getName = require('../util/getName')
const getAllRaw = require('../util/getAllRaw')
const getRaw = require('../util/getRaw')

/*
 * Enemies are calculated by taking all spawns and removing spawns with the same Enemy name.
 */

const rawFile = path.resolve(__dirname, '../../data/database/common/CHR_EnArrange.json')
const nameFile = path.resolve(__dirname, '../../data/database/common_ms/fld_enemyname.json')

const toEntity = _.memoize(async raw => {
  const name = await getName({
    id: raw.Name,
    file: nameFile
  })

  return {
    name: `${name} (Enemy)`,
    display_name: name,
    category: raw.Named ? 'Unique' : (raw.mBoss ? 'Boss' : 'Normal')
  }
}, raw => raw.id)

exports.toEntity = toEntity

exports.getById = async id => {
  return toEntity(await getRaw({ id, file: rawFile }))
}

exports.getAll = async () => {
  const allRaw = await getAllRaw({ file: rawFile })
  return Promise
    .all(
      _(allRaw).map(raw => (
        toEntity(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => _(results)
      .filter(r => !!r)
      .uniqBy('name')
      .value()
    )
}
