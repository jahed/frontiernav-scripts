const path = require('path')
const util = require('util')
const mkdirp = require('mkdirp')
const fs = require('fs')
const { readObjects, readFile } = require('@frontiernav/filesystem')
const { mapMappings, tileMappings } = require('./mappings')
const csv = require('csv')
const parseCSV = util.promisify(csv.parse)
const _ = require('lodash')
const pino = require('pino')
const log = pino({
  prettyPrint: true,
  serializers: {
    error: pino.stdSerializers.err
  }
}).child({ name: path.basename(__filename, '.js') })
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const Collectibles = require('./entities/Collectibles')
const CollectionPoints = require('./entities/CollectionPoints')
const FieldSkills = require('./entities/FieldSkills')
const Locations = require('./entities/Locations')

const dom = new JSDOM('<body></body>')
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator

const L = require('leaflet')

function toTiles ({ mapInfo }) {
  return _(mapInfo)
    .mapValues(rawTile => {
      const mapping = _.find(tileMappings, mapping => mapping.game_id === rawTile.Name)
      return {
        ...rawTile,
        mapping
      }
    })
    .value()
}

function withinBox ({ point: { x, y, z }, box: { minX, maxX, minY, maxY, minZ, maxZ } }) {
  return (x > minX && y > minY && z > minZ) && (x < maxX && y < maxY && z < maxZ)
}

function assignTarget ({ marker, Target }) {
  return Target.getByName({ name: marker.game_id })
    .then(target => {
      marker.target = target.name
      return marker
    })
}

function getLatLng ({ region, coords }) {
  /*
   * Y is altitude
   */
  const tile = _(region.tiles)
    .filter(tile => {
      return withinBox({
        point: {
          x: coords.PosX,
          y: coords.PosY,
          z: coords.PosZ
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

  if (!tile) {
    return Promise.reject(new Error(`MapTile not found for Coords[${coords.Name}] in Region[${region.gameId}]`))
  }

  const widthBigger = tile.Width > tile.Height

  const pixel = L.point(coords.PosX, coords.PosZ)
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
  return Promise.resolve({
    coords,
    tile,
    latLng: L.CRS.EPSG3857.pointToLatLng(pixel, zoom)
  })
}

function createMarker ({ coords, tile, latLng }) {
  return {
    name: `${coords.Name} (Map Feature)`,
    game_id: coords.Name,
    map: tile.mapping.map_name,
    target: '',
    geometry: JSON.stringify({
      type: 'Point',
      'coordinates': [
        latLng.lng,
        latLng.lat
      ]
    }),
    shape: 'image',
    notes: ''
  }
}

function toMarkers ({ region, markers, Target }) {
  return Promise
    .all(
      markers
        .filter(coords => !!coords.Name)
        .map(coords => (
          getLatLng({ region, coords })
            .then(({ coords, latLng, tile }) => createMarker({ coords, latLng, tile }))
            .then(marker => assignTarget({ Target, marker }))
            .catch(e => {
              log.warn(e)
              return null
            })
        ))
    )
    .then(markers => markers.filter(marker => !!marker))
}

function toRegion ({ absoluteFilePath, mapInfo }) {
  const gameId = path.basename(absoluteFilePath, '.csv')
  const mapping = _.find(mapMappings, mapping => mapping.game_id === gameId)
  return {
    absoluteFilePath,
    gameId,
    mapping,
    tiles: toTiles({ absoluteFilePath, mapInfo })
  }
}

const getAllRawMarkerTables = _.memoize(() => {
  return readFile(path.resolve(__dirname, '../data/all.csv'))
    .then(content => parseCSV(content, { columns: true, auto_parse: true }))
    .then(markers => _.groupBy(markers, m => `${m.Filename}_${m.GmkType}_${m.Map}`))
})

function getTableName ({ filename, type, region }) {
  return `${filename}_${type}_${region.gameId}`
}

function getMarkersForRegion ({ region, filename, type, Target }) {
  return getAllRawMarkerTables()
    .then(markerTables => markerTables[getTableName({ filename, type, region })] || [])
    .then(markers => toMarkers({ Target, region, markers }))
}

function parseMapFeatures ({ absoluteFilePath, mapInfo }) {
  return Promise.resolve(mapInfo)
    .then(mapInfo => toRegion({ absoluteFilePath, mapInfo }))
    .then(region => (
      Promise.all([
        getMarkersForRegion({ region, filename: 'collection', type: 'GmkCollection', Target: CollectionPoints }),
        getMarkersForRegion({ region, filename: 'landmark', type: 'GmkLandmark', Target: Locations })
      ])
    ))
    .then(featuresPerType => _.flatten(featuresPerType))
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
  log.info('Writing', filePath)
  fs.writeFileSync(filePath, content)
}

CollectionPoints.getAll()
  .then(result => toTSV({ objects: result }))
  .then(result => writeOut({ filename: 'CollectionPoints.tsv', content: result }))

Collectibles.getAll()
  .then(result => toTSV({ objects: result }))
  .then(result => writeOut({ filename: 'Collectibles.tsv', content: result }))

FieldSkills.getAll()
  .then(result => toTSV({ objects: result }))
  .then(result => writeOut({ filename: 'FieldSkills.tsv', content: result }))

Locations.getAll()
  .then(result => toTSV({ objects: result }))
  .then(result => writeOut({ filename: 'Locations.tsv', content: result }))

const mapInfos = readObjects(
  path.resolve(__dirname, '../data/mapinfo'),
  ({ absoluteFilePath, content: contentPromise }) => {
    return contentPromise
      .then(mapInfo => parseMapFeatures({ absoluteFilePath, mapInfo }))
      .catch(error => {
        log.warn({ absoluteFilePath, error }, `failed to parse region`)
        return null
      })
  },
  {
    '.csv': content => parseCSV(content, { columns: true, objname: 'Name', auto_parse: true })
  }
)

Promise
  .all(mapInfos)
  .then(results => results.filter(result => !!result))
  .then(results => _.flatten(results))
  .then(result => toTSV({ objects: result }))
  .then(result => writeOut({ filename: 'MapFeatures.tsv', content: result }))
