const log = require('@frontiernav/logger').get(__filename)
const { getAllRaw, getAllRawByName } = require('../util/gimmicks')
const Shops = require('./Shops')

const toEntity = async entry => {
  if (entry.ShopID) {
    return Shops.getById(entry.ShopID)
  }
  return null
}

exports.getByName = async ({ name }) => {
  const entriesByName = await getAllRawByName({ type: 'FLD_NpcPop' })
  const entry = entriesByName[`${name}`]
  if (!entry) {
    throw new Error(`NPCPoint[${name}] not found`)
  }
  return toEntity(entry)
}

exports.getAll = async () => {
  const entries = await getAllRaw('FLD_NpcPop')
  return Promise
    .all(
      entries.map(entry => (
        toEntity(entry)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => r))
}
