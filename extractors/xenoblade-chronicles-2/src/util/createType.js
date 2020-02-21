const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const getName = require('./getName')
const log = require('@frontiernav/logger').get(__filename)
const { stampEntityId } = require('@frontiernav/graph')

function createType ({
  type,
  dataFile,
  nameFile,
  preprocess = all => all,
  getNameId = ({ raw }) => raw.Name,
  getProperties = () => ({}),
  getRelationships = async () => ([])
}) {
  const absoluteDataFile = path.resolve(__dirname, '../../data/database/common', dataFile)
  const absoluteNameFile = path.resolve(__dirname, '../../data/database/common_ms', nameFile)

  const getAllRaw = _.memoize(async () => {
    const content = await readFile(absoluteDataFile)
    return preprocess(JSON.parse(content))
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

    const entity = stampEntityId({
      type,
      data: {
        name: nameProp || name,
        game_id: raw.id,
        ...additionalProps
      }
    })

    const relationships = await getRelationships({ entity, raw })

    return {
      entity,
      relationships
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
