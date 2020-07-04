const path = require('path')
const { getMapName, readJSON, isIgnoredMap, getMapCoordinates, toRates, timeToText, findMinimap } = require('../utils')

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

      const [itemlist] = await Promise.all([
        readJSON(path.resolve(bdat, `bdat_${map.id_name}`, `Litemlist${idN}.json`))
      ])

      return itemlist.map(item => {
        const minimap = findMinimap({ minimaplist, coords: item })

        if (!minimap) {
          console.log('no minimap found', { item: `Collection Point #${idN}${item.id}` })
          return null
        }

        return {
          name: `Collection Point #${idN}${item.id}`,
          map: getMapName({ map, fldMapListMs, minimap, minimaplistMs }),
          count: item.popNum,
          geometry: JSON.stringify({
            type: 'Point',
            coordinates: getMapCoordinates({ map, coords: item })
          }),
          time: timeToText[`${item.popTime}`],
          itm1ID: item.itm1ID ? `${item.itm1ID}` : null,
          itm1Per: toRates(item.itm1Per),
          itm2ID: item.itm2ID ? `${item.itm2ID}` : null,
          itm2Per: toRates(item.itm2Per),
          itm3ID: item.itm3ID ? `${item.itm3ID}` : null,
          itm3Per: toRates(item.itm3Per),
          itm4ID: item.itm4ID ? `${item.itm4ID}` : null,
          itm4Per: toRates(item.itm4Per),
          itm5ID: item.itm5ID ? `${item.itm5ID}` : null,
          itm5Per: toRates(item.itm5Per),
          itm6ID: item.itm6ID ? `${item.itm6ID}` : null,
          itm6Per: toRates(item.itm6Per),
          itm7ID: item.itm7ID ? `${item.itm7ID}` : null,
          itm7Per: toRates(item.itm7Per),
          itm8ID: item.itm8ID ? `${item.itm8ID}` : null,
          itm8Per: toRates(item.itm8Per)
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
