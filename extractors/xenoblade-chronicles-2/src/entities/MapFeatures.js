const path = require('path')
const util = require('util')
const { readObjects, readFile } = require('@frontiernav/filesystem')
const { mapMappings, tileMappings } = require('../util/mappings')
const parseCSV = util.promisify(require('csv-parse'))
const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const CollectionPoints = require('./CollectionPoints')
const Locations = require('./Locations')
const SalvagePoints = require('./SalvagePoints')
const EnemySpawnPoints = require('./EnemySpawnPoints')
const TreasurePoints = require('./TreasurePoints')
const KeyItemPoints = require('./KeyItemPoints')
const NPCPoints = require('./NPCPoints')
const Shops = require('./Shops')
const { nameToId, stampRelationshipId, stampEntityId } = require('@frontiernav/graph')

const dom = new JSDOM('<body></body>')
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator

const L = require('leaflet')

const dataPath = path.resolve(__dirname, '../../data')
const allMarkersPath = path.resolve(dataPath, 'all.csv')
const mapInfoPath = path.resolve(dataPath, 'mapinfo')

function toTiles ({ mapInfo }) {
  return _(mapInfo)
    .mapValues(rawTile => {
      const mapping = _.find(tileMappings, mapping => mapping.game_id === rawTile.Name)
      if (!mapping) {
        log.warn(`Mapping not found for ${rawTile.Name}`)
      }
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

function createTargetRelationship ({ marker, Target }) {
  return Target.getByName({ name: marker.data.game_id })
    .then(target => {
      return stampRelationshipId({
        type: 'MAP_TARGET',
        start: marker.id,
        end: target.entity.id,
        data: {}
      })
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

function createMarker ({ coords, latLng }) {
  return stampEntityId({
    type: 'MapFeature',
    data: {
      name: `${coords.Name} #${coords.Id} (Map Feature)`,
      geometry: {
        type: 'Point',
        coordinates: [
          latLng.lng,
          latLng.lat
        ]
      },
      shape: 'image',
      game_id: coords.Name
    }
  })
}

function toMarkers ({ region, markers, Target }) {
  return Promise
    .all(
      markers
        .filter(coords => !!coords.Name)
        .map(coords => (
          getLatLng({ region, coords })
            .then(async ({ coords, latLng, tile }) => {
              const marker = createMarker({ coords, latLng })
              const mapRelationship = stampRelationshipId({
                type: 'MAP',
                start: marker.id,
                end: nameToId(tile.mapping.map_name),
                data: {}
              })
              const targetRelationship = await createTargetRelationship({ Target, marker })
              return {
                entity: marker,
                relationships: [mapRelationship, targetRelationship]
              }
            })
            .catch(e => {
              log.warn(e.message)
              return null
            })
        ))
    )
    .then(results => _(results)
      .filter(result => !!result)
      .value()
    )
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

const getAllRawMarkerTables = () => {
  return readFile(allMarkersPath)
    .then(content => parseCSV(content, { columns: true, cast: true }))
    .then(markers => _.groupBy(markers, m => `${m.Filename}_${m.GmkType}_${m.Map}`))
}

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
        // getMarkersForRegion({ region, filename: 'collection', type: 'GmkCollection', Target: CollectionPoints }),
        // getMarkersForRegion({ region, filename: 'landmark', type: 'GmkLandmark', Target: Locations }),
        // getMarkersForRegion({ region, filename: 'salvage', type: 'GmkSalvage', Target: SalvagePoints }),
        // getMarkersForRegion({ region, filename: 'enemy', type: 'GmkEnemy', Target: EnemySpawnPoints }),
        // getMarkersForRegion({ region, filename: 'enemy', type: 'GmkRoutedEnemy', Target: EnemySpawnPoints }),
        // getMarkersForRegion({ region, filename: 'tbox', type: 'GmkTbox', Target: TreasurePoints }),
        // getMarkersForRegion({ region, filename: 'precious', type: 'GmkPrecious', Target: KeyItemPoints }),
        getMarkersForRegion({ region, filename: 'npc', type: 'GmkNpc', Target: NPCPoints })
      ])
    ))
    .then(featuresPerType => _.flatten(featuresPerType))
}

exports.getAll = () => {
  const mapInfos = readObjects(
    mapInfoPath,
    ({ absoluteFilePath, content: contentPromise }) => {
      return contentPromise
        .then(mapInfo => parseMapFeatures({ absoluteFilePath, mapInfo }))
        .catch(error => {
          log.warn({ absoluteFilePath, error }, 'failed to parse region')
          return null
        })
    },
    {
      '.csv': content => parseCSV(content, { columns: true, objname: 'Name', cast: true })
    }
  )

  return Promise
    .all(mapInfos)
    .then(results => results.filter(result => !!result))
    .then(results => _.flatten(results))
}

exports.schema = {
  relationships: [
    {
      relationshipType: { id: 'MapFeature-MAP_TARGET' },
      startEntityType: { id: 'MapFeature' },
      endEntityType: { id: 'Shop' }
    }
  ]
}
