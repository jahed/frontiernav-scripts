const path = require('path')
const { getMapName, readJSON, isIgnoredMap, getMapCoordinates, findMinimap } = require('../utils')
const _ = require('lodash')

const poptimeToText = {
  0: 'Any',
  16: 'Thunderstorm',
  23: 'Day (Heatwave)',
  32: 'Thunderstorm',
  40: 'Night (Shooting Stars)',
  47: 'Rain',
  48: 'Rain, Thunderstorm',
  55: 'Day',
  56: 'Night',
  63: 'Rain, Thunderstorm',
  64: 'Clear',
  71: 'Day (Sunny)',
  72: 'Night',
  79: 'Before Mechonis Core',
  80: 'No Fog',
  88: 'Night (Clear, Snowy)',
  95: 'No Fog',
  96: 'Clear',
  98: 'Day (Not Heatwave)',
  103: 'Day',
  111: 'Clear, Shooting Stars',
  113: 'Dawn',
  116: 'Evening',
  119: 'Day',
  120: 'Night'
}

const getRates = ({ spawnpoint }) => {
  const rates = _([
    {
      id: spawnpoint.ene1ID ? `${spawnpoint.ene1ID}` : null,
      per: spawnpoint.ene1Per
    },
    {
      id: spawnpoint.ene2ID ? `${spawnpoint.ene2ID}` : null,
      per: spawnpoint.ene2Per
    },
    {
      id: spawnpoint.ene3ID ? `${spawnpoint.ene3ID}` : null,
      per: spawnpoint.ene3Per
    },
    {
      id: spawnpoint.ene4ID ? `${spawnpoint.ene4ID}` : null,
      per: spawnpoint.ene4Per
    },
    {
      id: spawnpoint.ene5ID ? `${spawnpoint.ene5ID}` : null,
      per: spawnpoint.ene5Per
    }
  ])
    .filter(v => !!v.id)
    .groupBy('id')
    .map((rates, id) => ({
      id,
      rates: rates.map(rate => ({ rates: rate.per }))
    }))
    .value()

  const result = {}
  for (let i = 0; i < 5; i++) {
    const rate = rates[i]
    result[`ene${i + 1}ID`] = rate ? rate.id : null
    result[`ene${i + 1}Rates`] = rate ? JSON.stringify(rate.rates) : '[]'
  }
  return result
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

      const idN = map.id_name.replace('ma', '')

      const [minimaplist, minimaplistMs] = await Promise.all([
        readJSON(path.resolve(bdat, 'bdat_common', `minimaplist${map.id_name.replace('ma', '')}.json`)),
        readJSON(path.resolve(bdat, 'bdat_common_ms', `minimaplist${map.id_name.replace('ma', '')}_ms.json`))
      ])

      const [poplist] = await Promise.all([
        readJSON(path.resolve(bdat, `bdat_${map.id_name}`, `poplist${idN}.json`))
      ])

      return poplist.map(spawnpoint => {
        const minimap = findMinimap({ minimaplist, coords: spawnpoint })

        if (!minimap) {
          console.log('no minimap found', { spawnpoint: `Enemy Spawn Point #${idN}${spawnpoint.id}` })
          return null
        }

        const time = poptimeToText[`${spawnpoint.POP_TIME}`]
        if (!time) {
          throw new Error(`POP_TIME[${spawnpoint.POP_TIME}] not found.`)
        }

        return {
          name: `Enemy Spawn Point #${idN}${spawnpoint.id}`,
          map: getMapName({ map, fldMapListMs, minimap, minimaplistMs }),
          geometry: JSON.stringify({
            type: 'Point',
            coordinates: getMapCoordinates({ map, coords: spawnpoint })
          }),
          time,
          ...getRates({ spawnpoint })
        }
      })
    } catch (error) {
      console.warn('failed', { map: map.id_name, error })
    }
  }))

  return rows.flat().filter(v => !!v)
}

// Collection Point #130154
// needs to be lower level

module.exports = {
  getRows
}
