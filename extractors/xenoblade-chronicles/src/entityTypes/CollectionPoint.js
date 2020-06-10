const path = require('path')
const { getMapName, readJSON, isIgnoredMap } = require('../utils')
const L = require('../leaflet')
const _ = require('lodash')

const capDecimals = n => Math.trunc(n * 10000) / 10000

const getCoordinates = ({ x, y, width, height, xoffset, yoffset }) => {
  const widthBigger = width > height
  const pixel = L.point(x, y)
    .add(L.point(xoffset, yoffset))
    .add(widthBigger
      ? L.point(0, (width - height) / 2)
      : L.point((height - width) / 2, 0)
    )
  const zoom = L.CRS.EPSG3857.zoom(widthBigger ? width : height)
  const latLng = L.CRS.EPSG3857.pointToLatLng(pixel, zoom)
  return [capDecimals(latLng.lng), capDecimals(latLng.lat)]
}

const toRates = per => per ? JSON.stringify([{ rate: per }]) : '[]'

const timeToText = {
  0: 'All Day',
  1: '5am to 6am',
  2: '6am to 5pm',
  3: '5pm to 7pm',
  4: '7pm to 5am'
}

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

      const [minimaplist, minimaplistMs] = await Promise.all([
        readJSON(path.resolve(bdat, 'bdat_common', `minimaplist${map.id_name.replace('ma', '')}.json`)),
        readJSON(path.resolve(bdat, 'bdat_common_ms', `minimaplist${map.id_name.replace('ma', '')}_ms.json`))
      ])

      const idN = map.id_name.replace('ma', '')
      const [itemlist] = await Promise.all([
        readJSON(path.resolve(bdat, `bdat_${map.id_name}`, `Litemlist${idN}.json`))
      ])
      return itemlist.map(item => {
        const minimap = _(minimaplist)
          .filter(minimap => item.posY <= minimap.height)
          .orderBy(['height', 'asc'])
          .head()

        if (!minimap) {
          console.log('failed', { item: `Collection Point #${idN}${item.id}` })
          return {}
        }

        return {
          name: `Collection Point #${idN}${item.id}`,
          map: getMapName({ map, fldMapListMs, minimap, minimaplistMs }),
          geometry: JSON.stringify({
            type: 'Point',
            coordinates: getCoordinates({
              x: item.posX,
              y: item.posZ,
              width: map.mapimage_size_x,
              height: map.mapimage_size_y,
              xoffset: -map.minimap_lt_x,
              yoffset: -map.minimap_lt_z
            })
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
