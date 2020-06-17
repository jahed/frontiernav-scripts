const path = require('path')
const { readJSON } = require('../utils')
const _ = require('lodash')

const nameOverrides = {
  Skyray: 'Skyray (Enemy)',
  Yado: 'Yado (Enemy)',
  Dragon: 'Dragon (Enemy)',
  Behemoth: 'Behemoth (Enemy)',
  'Apocrypha Generator': 'Apocrypha Generator (Enemy)',
  'Offensive Scout': 'Offensive Scout (Enemy)'
}

const getRows = async ({ bdat }) => {
  const [enelist, enelistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'BTL_enelist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'BTL_enelist_ms.json'))
  ]

  let rows = await Promise.all(enelist.map(async enemy => {
    if (enemy.name === 0) {
      return null
    }

    let name = enelistMs[enemy.name - 1].name
    name = nameOverrides[name] || name

    return {
      id: enemy.id,
      name,
      category: enemy.c_name_id // see EnemyType, crystalnamelist
    }
  }))

  rows = rows.filter(v => !!v)
  rows = _.uniqBy(rows, 'name')
  return rows
}

module.exports = { getRows }
