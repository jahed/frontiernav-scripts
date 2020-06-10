const path = require('path')
const { readJSON, getMapName, isIgnoredMap } = require('../utils')

const tileSize = 256
const getMaxNativeZoom = ({ width, height }) => {
  const maxSize = Math.max(width, height)
  for (let zoom = 0; ; zoom++) {
    const grid = Math.pow(2, zoom)
    const size = grid * tileSize
    if (size >= maxSize) {
      return zoom
    }
  }
}

const getRows = async ({ bdat }) => {
  const [fldMapList, fldMapListMs, sysFileList] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'FLD_maplist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'FLD_maplist_ms.json')),
    await readJSON(path.resolve(bdat, 'bdat_common', 'SYS_filelist.json'))
  ]
  const rows = await Promise.all(fldMapList.map(async map => {
    try {
      if (isIgnoredMap(map)) {
        return []
      }

      const maxNativeZoom = getMaxNativeZoom({
        width: map.mapimage_size_x,
        height: map.mapimage_size_y
      })

      const [minimaplist, minimaplistMs] = await Promise.all([
        readJSON(path.resolve(bdat, 'bdat_common', `minimaplist${map.id_name.replace('ma', '')}.json`)),
        readJSON(path.resolve(bdat, 'bdat_common_ms', `minimaplist${map.id_name.replace('ma', '')}_ms.json`))
      ])

      return minimaplist.map(minimap => {
        return {
          name: getMapName({ map, fldMapListMs, minimap, minimaplistMs }),
          path: `${sysFileList[minimap.mapimg - 1].filename}_0`,
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
