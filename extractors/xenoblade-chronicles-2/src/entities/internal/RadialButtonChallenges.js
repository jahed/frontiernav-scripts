const _ = require('lodash')
const path = require('path')
const log = require('@frontiernav/logger').get(__filename)
const { readFile } = require('@frontiernav/filesystem')

const getAllRaw = _.memoize(async () => {
  const content = await readFile(path.resolve(__dirname, '../../../data/database/common/MNU_BtnChallenge2.json'))
  return JSON.parse(content)
})

const getAllRawById = _.memoize(async () => {
  return _(await getAllRaw()).keyBy('id').value()
})

const buttonMap = {
  1: 'A',
  2: 'B',
  3: 'X',
  4: 'Y',
  5: 'Random'
}

const toEntity = _.memoize(async raw => {
  return {
    name: `Radial Button Challenge #${raw.id}`,
    button: buttonMap[raw.BtnType1],
    speed: raw.Speed
  }
}, raw => raw.id)

exports.getById = async ({ id }) => {
  const allRawById = await getAllRawById()
  const raw = allRawById[`${id}`]
  if (!raw) {
    throw new Error(`RadialButtonChallenge[${id}] not found`)
  }
  return toEntity(raw)
}

exports.getAll = async () => {
  const allRaw = await getAllRaw()
  return Promise
    .all(
      allRaw.map(raw => (
        toEntity(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => r))
}
