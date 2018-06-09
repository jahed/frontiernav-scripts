const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const log = require('../util/logger').get(__filename)
const { getAllRaw, getAllRawByName } = require('./gimmicks')

const getAllRawNamesById = _.memoize(async () => {
  const content = await readFile(path.resolve(__dirname, '../../data/database/common_ms/fld_landmark.json'))
  return _(JSON.parse(content)).keyBy('id').value()
})

const categoryMap = {
  0: 'Landmark',
  1: 'Secret Area',
  2: 'Location'
}

const developmentZoneMap = {
  0: 'Argentum',
  1: 'Gormott',
  2: 'Uraya',
  3: 'Mor Ardain',
  4: 'Tantal',
  5: 'Letheria',
  6: 'Indol'
}

const toLandmark = _.memoize(async raw => {
  const rawNamesById = await getAllRawNamesById()
  const rawName = rawNamesById[raw.MSGID]

  if (!rawName || !rawName.name) {
    throw new Error(`Landmark[${raw.name}] has no name.`)
  }

  const name = rawName.name
  const devZone = raw.get_DPT ? developmentZoneMap[raw.developZone] : ''
  const category = categoryMap[raw.category]

  return {
    name: `${name} (${devZone || category})`,
    display_name: name,
    category: category, // TODO: map to location category
    exp: raw.getEXP,
    sp: raw.getSP,
    dp: raw.get_DPT
  }
}, raw => raw.name)

exports.getByName = async ({ name }) => {
  const allRawByName = await getAllRawByName({ type: 'FLD_LandmarkPop' })
  const raw = allRawByName[`${name}`]
  if (!raw) {
    throw new Error(`Landmark[${name}] not found`)
  }
  return toLandmark(raw)
}

exports.getAll = async () => {
  const allRaw = await getAllRaw('FLD_LandmarkPop')
  return Promise
    .all(
      allRaw.map(raw => (
        toLandmark(raw)
          .catch(e => {
            log.warn(e)
            return null
          })
      ))
    )
    .then(results => results.filter(r => !!r))
}
