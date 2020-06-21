const path = require('path')
const { getMapName, readJSON, isIgnoredMap, getMapCoordinates, findMinimap } = require('../utils')
const _ = require('lodash')
const KeyItem = require('./KeyItem')

const getRows = async ({ bdat }) => {
  const keyItems = await KeyItem.getRows({ bdat })
  const [fldMapList, fldMapListMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'FLD_maplist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'FLD_maplist_ms.json'))
  ]

  const [valpoplist] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'FLD_valpoplist.json'))
  ]

  let rows = await Promise.all(valpoplist.map(async point => {
    const map = fldMapList[point.mapID - 1]
    if (isIgnoredMap(map)) {
      return null
    }

    const [minimaplist, minimaplistMs] = await Promise.all([
      readJSON(path.resolve(bdat, 'bdat_common', `minimaplist${map.id_name.replace('ma', '')}.json`)),
      readJSON(path.resolve(bdat, 'bdat_common_ms', `minimaplist${map.id_name.replace('ma', '')}_ms.json`))
    ])

    const minimap = findMinimap({ minimaplist, coords: point })
    if (!minimap) {
      console.log('failed to find minimap', { point })
      return null
    }

    const keyItem = keyItems.find(k => k.item_id === point.itm1ID)
    if (!keyItem) {
      console.log('failed to find key item', { point })
      return null
    }

    return {
      id: point.id,
      name: `${keyItem.name} (Map Feature)`,
      map: getMapName({ map, fldMapListMs, minimap, minimaplistMs }),
      item_id: keyItem.item_id,
      geometry: JSON.stringify({
        type: 'Point',
        coordinates: getMapCoordinates({ map, coords: point })
      })
    }
  }))

  rows = rows.filter(v => !!v)

  const nameCounts = _.countBy(rows, 'name')
  rows.forEach(row => {
    if (nameCounts[row.name] > 1) {
      row.name = `${row.name.replace(' (Map Feature)', '')} #${row.id}`
    }
  })

  return rows.filter(v => !!v)
}

module.exports = { getRows }
