const path = require('path')
const { readJSON, getMapName, isIgnoredMap } = require('../utils')
const _ = require('lodash')

const getRows = async ({ bdat }) => {
  const [fldMapList, fldMapListMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'FLD_maplist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'FLD_maplist_ms.json'))
  ]
  const rows = await Promise.all(fldMapList.map(async map => {
    try {
      if (isIgnoredMap(map)) {
        return []
      }

      const mapName = getMapName({ map, fldMapListMs })
      const maxNativeZoom = Math.ceil(Math.max(map.mapimage_size_x, map.mapimage_size_y) / 256)

      const [minimaplist, minimaplistMs] = await Promise.all([
        readJSON(path.resolve(bdat, 'bdat_common', `minimaplist${map.id_name.replace('ma', '')}.json`)),
        readJSON(path.resolve(bdat, 'bdat_common_ms', `minimaplist${map.id_name.replace('ma', '')}_ms.json`))
      ])

      return minimaplist.map(minimap => {
        const minimapName = minimaplistMs[minimap.floorname - 1].name
        const fullName = [mapName, minimapName].filter(v => v !== 'Entire Area').join(' - ')
        return {
          name: fullName,
          path: `mf03_map01_${map.id_name}_f${_.padStart(`${minimap.id}`, 2, '0')}_map_0`,
          extension: 'png',
          maxNativeZoom
        }
      })
    } catch (error) {
      console.warn('failed to process map', { map: map.id_name, error })
    }
  }))

  return rows.flat().filter(v => !!v)
}

module.exports = {
  getRows
}
