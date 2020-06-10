const { promises: fs } = require('fs')

const readJSON = async (...args) => JSON.parse(await fs.readFile(...args))

const customMapNames = { ma1202: 'Prison Island (End-Game)' }
const getMapName = ({ map, fldMapListMs }) => customMapNames[map.id_name] || fldMapListMs[map.name - 1].name

const ignoredMaps = {
  ma0000: true,
  ma0102: true,
  ma0801: true,
  ma1602: true,
  ma1801: true,
  ma2501: true, // future connected
  ma2601: true, // future connected
  ma2701: true,
  ma2801: true,
  ma2901: true,
  ma5001: true,
  ma5101: true,
  ma5201: true,
  ma5301: true,
  ma5401: true,
  ma5501: true,
  ma5601: true,
  ma5701: true,
  ma5801: true,
  ma5901: true,
  ma6001: true,
  ma9990: true
}
const isIgnoredMap = map => ignoredMaps[map.id_name]

module.exports = {
  readJSON,
  getMapName,
  isIgnoredMap
}
