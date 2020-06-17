const path = require('path')
const { getMapName, readJSON, isIgnoredMap, getMapCoordinates, findMinimap } = require('../utils')
const _ = require('lodash')

const overrideNames = {
  'High Entia Tomb': true,
  'Mechonis Core': 'Mechonis Core (Landmark)'
}

const getRows = async ({ bdat }) => {
  const [fldMapList, fldMapListMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'FLD_maplist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'FLD_maplist_ms.json'))
  ]

  const [landmarkList, landmarkListMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'landmarklist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'landmarklist_ms.json'))
  ]

  let rows = await Promise.all(landmarkList.map(async landmark => {
    const map = fldMapList[landmark.mapID - 1]
    if (isIgnoredMap(map)) {
      return null
    }

    const [minimaplist, minimaplistMs] = await Promise.all([
      readJSON(path.resolve(bdat, 'bdat_common', `minimaplist${map.id_name.replace('ma', '')}.json`)),
      readJSON(path.resolve(bdat, 'bdat_common_ms', `minimaplist${map.id_name.replace('ma', '')}_ms.json`))
    ])

    const minimap = findMinimap({ minimaplist, coords: landmark })
    if (!minimap) {
      console.log('failed to find minimap', { landmark: landmark.id })
      return null
    }

    return {
      name: landmarkListMs[landmark.name - 1].name,
      map: getMapName({ map, fldMapListMs, minimap, minimaplistMs }),
      geometry: JSON.stringify({
        type: 'Point',
        coordinates: getMapCoordinates({ map, coords: landmark })
      }),
      exp: landmark.getEXP,
      ap: landmark.getAP,
      pp: landmark.getPP
    }
  }))

  rows = rows.filter(v => !!v)

  const nameCounts = _.countBy(rows, 'name')
  rows.forEach(row => {
    if (nameCounts[row.name] > 1 || overrideNames[row.name]) {
      row.name = typeof overrideNames[row.name] === 'string'
        ? overrideNames[row.name]
        : `${row.name} (${row.map})`
    }
  })

  return rows.filter(v => !!v)
}

module.exports = { getRows }
