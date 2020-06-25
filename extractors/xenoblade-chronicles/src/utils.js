const { promises: fs } = require('fs')
const L = require('./leaflet')
const _ = require('lodash')

const capDecimals = n => Math.trunc(n * 100000) / 100000

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

const getMapCoordinates = ({ coords, map }) => {
  return getCoordinates({
    x: coords.posX,
    y: coords.posZ,
    width: map.mapimage_size_x,
    height: map.mapimage_size_y,
    xoffset: -map.minimap_lt_x,
    yoffset: -map.minimap_lt_z
  })
}

const findMinimap = ({ minimaplist, coords }) => {
  return _(minimaplist)
    .filter(minimap => coords.posY <= minimap.height)
    .orderBy(['height', 'asc'])
    .head()
}

const toRates = (...pers) => {
  const rates = pers
    .filter(rate => !!rate)
    .map(rate => ({ rate }))
  return JSON.stringify(rates)
}

const timeToText = {
  0: 'All Day',
  1: '5am to 6am',
  2: '6am to 5pm',
  3: '5pm to 7pm',
  4: '7pm to 5am'
}

const enemyNameOverrides = {
  Skyray: 'Skyray (Enemy)',
  Yado: 'Yado (Enemy)',
  Dragon: 'Dragon (Enemy)',
  Behemoth: 'Behemoth (Enemy)',
  'Apocrypha Generator': 'Apocrypha Generator (Enemy)',
  'Offensive Scout': 'Offensive Scout (Enemy)'
}

const getEnemyName = ({ enemy, enelistMs }) => {
  const name = enelistMs[enemy.name - 1].name
  return enemyNameOverrides[name] || name
}

const readJSON = async (...args) => JSON.parse(await fs.readFile(...args))

const customAreaNames = { ma1202: 'Prison Island (End-Game)' }
const getAreaName = ({ map, fldMapListMs }) => customAreaNames[map.id_name] || fldMapListMs[map.name - 1].name
const getMinimapName = ({ minimap, minimaplistMs }) => minimaplistMs[minimap.floorname - 1].name
const getMapName = ({ map, fldMapListMs, minimap, minimaplistMs }) => {
  return [
    getAreaName({ map, fldMapListMs }),
    getMinimapName({ minimap, minimaplistMs })
  ].filter(v => v !== 'Entire Area').join(' - ') + ' (Map)'
}

const ignoredMaps = {
  ma0000: true, // no name
  ma0102: true, // no name
  ma0801: true, // no name
  ma1602: true, // no name
  ma1801: true, // no name
  ma2501: true, // future connected
  ma2601: true, // future connected
  ma2701: true, // no name
  ma2801: true, // no name
  ma2901: true, // no name
  ma5001: true, // no name
  ma5101: true, // no name
  ma5201: true, // no name
  ma5301: true, // no name
  ma5401: true, // no name
  ma5501: true, // no name
  ma5601: true, // no name
  ma5701: true, // no name
  ma5801: true, // no name
  ma5901: true, // no name
  ma6001: true, // no name
  ma9990: true // no name
}
const isIgnoredMap = map => ignoredMaps[map.id_name]

const itemTypeMapping = [
  undefined,
  undefined,
  'Weapon',
  'Gem',
  'HeadArmor',
  'BodyArmor',
  'ArmArmor',
  'LegArmor',
  'FootArmor',
  'Crystal',
  'Collectable',
  'Material',
  'KeyItem',
  'ArtBook'
]

module.exports = {
  readJSON,
  getAreaName,
  getMapName,
  isIgnoredMap,
  getMapCoordinates,
  timeToText,
  toRates,
  findMinimap,
  getEnemyName,
  itemTypeMapping
}
