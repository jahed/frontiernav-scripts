const { promises: fs } = require('fs')

const readJSON = async (...args) => JSON.parse(await fs.readFile(...args))

const customAreaNames = { ma1202: 'Prison Island (End-Game)' }
const getAreaName = ({ map, fldMapListMs }) => customAreaNames[map.id_name] || fldMapListMs[map.name - 1].name
const getMinimapName = ({ minimap, minimaplistMs }) => minimaplistMs[minimap.floorname - 1].name
const getMapName = ({ map, fldMapListMs, minimap, minimaplistMs }) => {
  return [
    getAreaName({ map, fldMapListMs }),
    getMinimapName({ minimap, minimaplistMs })
  ].filter(v => v !== 'Entire Area').join(' - ')
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

module.exports = {
  readJSON,
  getAreaName,
  getMapName,
  isIgnoredMap
}
