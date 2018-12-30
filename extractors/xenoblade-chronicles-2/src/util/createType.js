const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const getName = require('./getName')
const log = require('@frontiernav/logger').get(__filename)

function createType ({
  type,
  dataFile,
  nameFile,
  getNameId = ({ raw }) => raw.Name,
  getProperties = () => ({})
}) {
  const absoluteDataFile = path.resolve(__dirname, '../../data/database/common', dataFile)
  const absoluteNameFile = path.resolve(__dirname, '../../data/database/common_ms', nameFile)

  const getAllRaw = _.memoize(async () => {
    const content = await readFile(absoluteDataFile)
    return JSON.parse(content)
  })

  const getAllRawByName = _.memoize(async () => {
    return _(await getAllRaw()).keyBy('Name').value()
  })

  const getAllRawById = _.memoize(async () => {
    return _(await getAllRaw()).keyBy('id').value()
  })

  const toEntity = _.memoize(async raw => {
    const name = await getName({
      id: getNameId({ raw }),
      file: absoluteNameFile
    })

    const {
      name: nameProp,
      ...additionalProps
    } = await getProperties({ raw, name })

    return {
      name: nameProp || name,
      game_id: raw.id,
      ...additionalProps
    }
  }, raw => raw.id)

  return {
    getByName: async name => {
      const allByName = await getAllRawByName()
      const raw = allByName[`${name}`]
      if (!raw) {
        throw new Error(`Failed to find ${type}[${name}]`)
      }
      return toEntity(raw)
    },

    getById: async id => {
      const allById = await getAllRawById()
      const raw = allById[`${id}`]
      if (!raw) {
        throw new Error(`Failed to find ${type}[${id}]`)
      }
      return toEntity(raw)
    },

    getAll: async () => {
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
        .then(results => results.filter(r => !!r))
    }
  }
}

module.exports = createType
