const path = require('path')
const util = require('util')
const mkdirp = require('mkdirp')
const fs = require('fs')
const { readObjects, readFile } = require('@frontiernav/filesystem')
const { mapMappings, tileMappings } = require('./mappings')
const csv = require('csv')
const parseCSV = util.promisify(csv.parse)
const _ = require('lodash')
const jsdom = require('jsdom')
const { JSDOM } = jsdom

const dom = new JSDOM('<body></body>')
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator

const L = require('leaflet')
const inputPath = path.resolve(__dirname, '../data/mapinfo')

console.log('Reading files', inputPath)
const result = readObjects(
  inputPath,
  i => i,
  {
    '.csv': content => parseCSV(content, { columns: true, objname: 'Name', auto_parse: true })
  }
)

function toTiles ({ content }) {
  return _(content)
    .mapValues(row => {
      const mapping = _.find(tileMappings, mapping => mapping.game_id === row.Name)
      return {
        ...row,
        mapping
      }
    })
    .value()
}

function withinBox ({ point: { x, y, z }, box: { minX, maxX, minY, maxY, minZ, maxZ } }) {
  return (x > minX && y > minY && z > minZ) && (x < maxX && y < maxY && z < maxZ)
}

function toMarkers ({ type, region, content }) {
  return _(content)
    .mapValues(row => {
      const tile = _(region.tiles)
        .filter(tile => {
          return withinBox({
            point: {
              x: row.X,
              y: row.Y,
              z: row.Z
            },
            box: {
              minX: tile.LowerX,
              maxX: tile.UpperX,
              minY: tile.LowerY,
              maxY: tile.UpperY,
              minZ: tile.LowerZ,
              maxZ: tile.UpperZ
            }
          })
        })
        .orderBy('Priority')
        .head()

      const widthBigger = tile.Width > tile.Height

      const pixel = L.point(row.X, row.Z)
        .add(
          // Relative to the map it's on
          L.point(-tile.LowerX, -tile.LowerZ)
        )
        .multiplyBy(2) // Game coords are scaled down for some reason.
        .add(
          // Adjust to squared tiles
          widthBigger
            ? L.point(0, (tile.Width - tile.Height) / 2) // Move down
            : L.point((tile.Height - tile.Width) / 2, 0) // Move right
        )

      const zoom = L.CRS.EPSG3857.zoom(widthBigger ? tile.Width : tile.Height)
      const latLng = L.CRS.EPSG3857.pointToLatLng(pixel, zoom)

      return {
        name: row.Name,
        game_id: row.Name,
        map: tile.mapping.map_name,
        target: 'Pyra',
        geometry: JSON.stringify({
          type: 'Point',
          'coordinates': [
            latLng.lng,
            latLng.lat
          ]
        }),
        notes: ''
      }
    })
    .value()
}

function toRegion ({ absoluteFilePath, content }) {
  const gameId = path.basename(absoluteFilePath, '.csv')
  const mapping = _.find(mapMappings, mapping => mapping.game_id === gameId)
  return {
    absoluteFilePath,
    gameId,
    mapping,
    tiles: toTiles({ absoluteFilePath, content })
  }
}

function getMarkersForRegion ({ type, region }) {
  return readFile(path.resolve(__dirname, '../data/', type + '-gimmick', region.gameId + '-' + type + '.csv'))
    .then(
      content => {
        return parseCSV(content, { columns: true, objname: 'Name', auto_parse: true })
          .then(content => toMarkers({ type, region, content }))
      },
      () => ({})
    )
}

function getMarkers ({ absoluteFilePath, content }) {
  return Promise.resolve(content)
    .then(content => toRegion({ absoluteFilePath, content }))
    .then(region => {
      return getMarkersForRegion({ region, type: 'collection' })
    })
}

function toTSV({ objects }) {
  return _(objects)
    .values()
    .map(row => _(row)
      .values()
      .map(v => v.replace(/"/g, '""'))
      .map(v => `"${v}"`)
      .join('\t')
    )
    .join('\n')
}

Promise
  .all(
    result.map(({ absoluteFilePath, content: contentPromise }) => {
      return contentPromise
        .then(content => getMarkers({ absoluteFilePath, content }))
        .catch(error => {
          console.error(absoluteFilePath, error)
        })
    })
  )
  .then(results => results.reduce((acc, next) => {
    return {
      ...acc,
      ...next
    }
  }, {}))
  .then(markers => toTSV({ objects: markers }))
  .then(result => {
    const outputPath = path.resolve(__dirname, '../out')
    mkdirp.sync(outputPath)

    const tsvPath = path.resolve(outputPath, 'collection-markers.tsv')

    console.log('Writing', tsvPath)
    fs.writeFileSync(tsvPath, result)
  })

console.log('Done.')

/*
 * 1. Read all mapinfo files
 * 2. For each file, read coords
 * 3. Find which tile(s) each coord maps to
 * 4. Flatten coords to X, Y
 * 5. Remap coords to Lat, Lng
 * 6. Create GeoJSON
 * 7. Create MapMarker
 * 8. Export to TSV
 *
 * TODO
 * - Map MapMarkers to Collectible Groups
 */
