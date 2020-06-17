const path = require('path')
const { readJSON, getEnemyName } = require('../utils')
const _ = require('lodash')

const getRows = async ({ bdat }) => {
  const [enelist, enelistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'BTL_enelist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'BTL_enelist_ms.json'))
  ]

  let rows = await Promise.all(enelist.map(async enemy => {
    if (enemy.name === 0) {
      return null
    }

    return {
      id: enemy.id,
      name: getEnemyName({ enemy, enelistMs }),
      category: enemy.c_name_id // see EnemyType, crystalnamelist
    }
  }))

  rows = rows.filter(v => !!v)
  rows = _.uniqBy(rows, 'name')
  return rows
}

module.exports = { getRows }
