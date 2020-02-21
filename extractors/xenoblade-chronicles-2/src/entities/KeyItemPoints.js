const log = require('@frontiernav/logger').get(__filename)
const KeyItems = require('./KeyItems')
const { stampEntityId, stampRelationshipId } = require('@frontiernav/graph')
const { getAllRaw, getAllRawByName } = require('../util/gimmicks')

const debugKeyItems = {
  25067: true,
  25039: true,
  25040: true,
  25049: true,
  25050: true,
  25051: true,
  25075: true,
  25059: true,
  25046: true
}

/**
 * TODO: Process flags.
 */
const toKeyItemPoint = async raw => {
  if (debugKeyItems[raw.itmID]) {
    throw new Error(`KeyItemPoint[${raw.id}] has debug KeyItem[${raw.itmID}]`)
  }
  const entity = stampEntityId({
    type: 'KeyItemPoint',
    data: {
      name: `Key Item Point #${raw.id}`
    }
  })
  const { entity: keyItem } = await KeyItems.getById(raw.itmID)
  const keyItemRel = stampRelationshipId({
    type: 'KeyItemPoint-KEY_ITEM',
    start: entity.id,
    end: keyItem.id,
    data: {}
  })
  return {
    entity,
    relationships: [keyItemRel]
  }
}

exports.getByName = async ({ name }) => {
  const rawEntriesByName = await getAllRawByName({ type: 'FLD_PreciousPopList' })
  const rawEntry = rawEntriesByName[`${name}`]
  if (!rawEntry) {
    throw new Error(`KeyItemPoint[${name}] not found`)
  }
  return toKeyItemPoint(rawEntry)
}

exports.getAll = async () => {
  const rawEntries = await getAllRaw('FLD_PreciousPopList')
  return Promise
    .all(
      rawEntries.map(raw => (
        toKeyItemPoint(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => r))
}

exports.schema = {
  entityType: {
    id: 'KeyItemPoint',
    name: 'Key Item Point',
    hue: 100,
    properties: {
      name: {
        id: 'name',
        name: 'Name',
        type: 'string',
        required: true
      }
    }
  },
  relationships: [
    {
      relationshipType: { id: 'KeyItemPoint-KEY_ITEM' },
      startEntityType: { id: 'KeyItemPoint' },
      endEntityType: { id: 'KeyItem' }
    }
  ]
}
