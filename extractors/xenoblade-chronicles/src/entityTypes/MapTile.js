const { promises: fs } = require('fs')
const path = require('path')
const minimist = require('minimist')
const _ = require('lodash')

const args = minimist(process.argv.slice(2))

const readJSON = async (...args) => JSON.parse(await fs.readFile(...args))

const ignoredMaps = { ma2501: true, ma2601: true }
const customNames = { ma1202: 'Prison Island (End-Game)' }

const getRows = async () => {
  const [fldMapList, fldMapListMs] = [
    await readJSON(path.resolve(args.bdat, 'bdat_common', 'FLD_maplist.json')),
    await readJSON(path.resolve(args.bdat, 'bdat_common_ms', 'FLD_maplist_ms.json'))
  ]
  const tiles = await Promise.all(fldMapList.map(async map => {
    try {
      if (ignoredMaps[map.id_name]) {
        return []
      }

      const mapName = customNames[map.id_name] || fldMapListMs[map.name - 1].name
      const maxNativeZoom = Math.ceil(Math.max(map.mapimage_size_x, map.mapimage_size_y) / 256)

      const [minimaplist, minimaplistMs] = await Promise.all([
        readJSON(path.resolve(args.bdat, 'bdat_common', `minimaplist${map.id_name.replace('ma', '')}.json`)),
        readJSON(path.resolve(args.bdat, 'bdat_common_ms', `minimaplist${map.id_name.replace('ma', '')}_ms.json`))
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

  return tiles.flat().filter(v => !!v)
}

module.exports = {
  getRows
}
