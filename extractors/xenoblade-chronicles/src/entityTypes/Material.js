const path = require('path')
const { getAreaName, readJSON, isIgnoredMap } = require('../utils')

const rarity = ['Common', 'Rare']

const getRows = async ({ bdat }) => {
  const [fldMapList, fldMapListMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'FLD_maplist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'FLD_maplist_ms.json'))
  ]

  const [materiallist, materiallistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_materiallist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'ITM_materiallist_ms.json'))
  ]

  let stoneAdded = false
  let rows = await Promise.all(materiallist.map(async material => {
    const map = fldMapList[material.mapID - 1]
    if (isIgnoredMap(map)) {
      return null
    }
    if (material.name === 0) {
      return null
    }

    const name = materiallistMs[material.name - 1].name
    if (name === 'Stone') {
      // Stones are separate records but have the same attributes.
      if (stoneAdded) {
        return null
      }
      stoneAdded = true
    }

    return {
      name,
      region: getAreaName({ map, fldMapListMs }),
      rarity: rarity[material.rare],
      value: material.money
    }
  }))

  rows = rows.filter(v => !!v)

  return rows
}

module.exports = { getRows }
