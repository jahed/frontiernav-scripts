const path = require('path')
const { readJSON, isIgnoredMap, getEnemyName, toRates } = require('../utils')
const _ = require('lodash')

const getChests = ({ stats }) => {
  const result = {}
  result.chest1ID = stats.drop_nml_per === 0 ? null : 'nml'
  result.chest1Per = toRates(stats.drop_nml_per)
  // get from nmllist
  result.chest2ID = stats.drop_rar_per === 0 ? null : 'rar'
  result.chest2Per = toRates(stats.drop_rar_per)
  // get from rarlist
  result.chest3ID = stats.drop_spr_per === 0 ? null : 'spr'
  result.chest3Per = toRates(stats.drop_spr_per)
  // get from sprlist
  return result
}

const getRows = async ({ bdat }) => {
  const [fldMapList] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'FLD_maplist.json'))
  ]

  const [enelist, enelistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'BTL_enelist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'BTL_enelist_ms.json'))
  ]

  let rows = await Promise.all(fldMapList.map(async map => {
    try {
      if (isIgnoredMap(map)) {
        return []
      }

      const idN = map.id_name.replace('ma', '')

      const [enelistStats] = await Promise.all([
        readJSON(path.resolve(bdat, `bdat_${map.id_name}`, `BTL_enelist${idN}.json`))
      ])

      return enelistStats.map(stats => {
        const enemy = enelist[stats.id - 1]
        if (enemy.name === 0) {
          return null
        }

        return {
          id: stats.id,
          name: getEnemyName({ enemy, enelistMs }),
          enemy_name: getEnemyName({ enemy, enelistMs }),
          level: stats.lv,
          hp: stats.hp,
          strength: stats.str,
          agility: stats.agi,
          ether: stats.ether,
          exp: stats.exp,
          spike_damage: stats.spike_dmg ? stats.spike_dmg : null,
          ...getChests({ stats })
        }
      })
    } catch (error) {
      console.warn('failed', { map: map.id_name, error })
    }
  }))

  rows = rows.flat().filter(v => !!v)

  const nameCounts = _.countBy(rows, 'name')
  rows.forEach(row => {
    if (nameCounts[row.name] > 1) {
      row.name = `${row.name.replace(' (Enemy)', '')} #${row.id}`
    }
  })

  return rows
}

module.exports = {
  getRows
}
