const path = require('path')
const { getMapName, readJSON, isIgnoredMap, getMapCoordinates, toRates, findMinimap } = require('../utils')

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

      const idN = map.id_name.replace('ma', '')

      const [minimaplist, minimaplistMs] = await Promise.all([
        readJSON(path.resolve(bdat, 'bdat_common', `minimaplist${idN}.json`)),
        readJSON(path.resolve(bdat, 'bdat_common_ms', `minimaplist${idN}_ms.json`))
      ])

      const [minelist] = await Promise.all([
        readJSON(path.resolve(bdat, `bdat_${map.id_name}`, `minelist${idN}.json`))
      ]).catch(() => {
        // not all maps having mining points
        return [[]]
      })

      return minelist.map(mine => {
        const coords = {
          posX: mine.posX / 10000,
          posY: mine.posY / 10000,
          posZ: mine.posZ / 10000
        }

        const minimap = findMinimap({ minimaplist, coords })

        if (!minimap) {
          console.log('no minimap found', { name: `Mining Point #${idN}${mine.id}` })
          return null
        }

        return {
          name: `Mining Point #${idN}${mine.id}`,
          map: getMapName({ map, fldMapListMs, minimap, minimaplistMs }),
          geometry: JSON.stringify({
            type: 'Point',
            coordinates: getMapCoordinates({ map, coords })
          }),
          skill1: mine.skill1 && mine.skill1_per ? `${mine.skill1}` : null,
          skill1_per: toRates(mine.skill1_per),
          skill2: mine.skill2 && mine.skill2_per ? `${mine.skill2}` : null,
          skill2_per: toRates(mine.skill2_per),
          skill3: mine.skill3 && mine.skill3_per ? `${mine.skill3}` : null,
          skill3_per: toRates(mine.skill3_per),
          skill4: mine.skill4 && mine.skill4_per ? `${mine.skill4}` : null,
          skill4_per: toRates(mine.skill4_per)
        }
      })
    } catch (error) {
      console.warn('failed to process item', { map: map.id_name, error })
    }
  }))

  return rows.flat().filter(v => !!v)
}

// Collection Point #130154
// needs to be lower level

module.exports = {
  getRows
}
