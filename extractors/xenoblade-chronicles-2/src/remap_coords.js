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
const Collectibles = require('./entities/Collectibles')
const CollectibleGroups = require('./entities/CollectibleGroups')

const dom = new JSDOM('<body></body>')
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator

const L = require('leaflet')

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
  return Promise.all(_(content)
    .filter(row => !!row.Name)
    .map(row => {
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
        name: `${row.Name} (Map Feature)`,
        game_id: row.Name,
        map: tile.mapping.map_name,
        target: '',
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
    .map(marker => {
      return CollectibleGroups.getByName({ name: marker.game_id })
        .then(group => {
          marker.target = group.name
          return marker
        })
        .catch(e => {
          console.log(e)
          return marker
        })
    })
    .value()
  )
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
      () => ([])
    )
}

function getMarkers ({ absoluteFilePath, content }) {
  return Promise.resolve(content)
    .then(content => toRegion({ absoluteFilePath, content }))
    .then(region => {
      return getMarkersForRegion({ region, type: 'collection' })
    })
}

function toTSV ({ objects }) {
  return _(objects)
    .map(row => _(row)
      .map(v => typeof v === 'object' ? JSON.stringify(v) : `${v}`)
      .map(v => v.replace(/"/g, '""'))
      .map(v => `"${v}"`)
      .join('\t')
    )
    .join('\n')
}

function writeOut ({ filename, content }) {
  const outputPath = path.resolve(__dirname, '../out')
  mkdirp.sync(outputPath)

  const filePath = path.resolve(outputPath, filename)
  console.log('Writing', filePath)
  fs.writeFileSync(filePath, content)
}

CollectibleGroups.getAll()
  .then(result => toTSV({ objects: result }))
  .then(result => writeOut({ filename: 'CollectibleGroups.tsv', content: result }))

Collectibles.getAll()
  .then(result => toTSV({ objects: result }))
  .then(result => writeOut({ filename: 'Collectibles.tsv', content: result }))

const inputPath = path.resolve(__dirname, '../data/mapinfo')
console.log('Reading files', inputPath)
const result = readObjects(
  inputPath,
  i => i,
  {
    '.csv': content => parseCSV(content, { columns: true, objname: 'Name', auto_parse: true })
  }
)

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
    return acc.concat(next)
  }, []))
  .then(markers => toTSV({ objects: markers }))
  .then(result => {
    writeOut({ filename: 'collection-markers.tsv', content: result })
  })
