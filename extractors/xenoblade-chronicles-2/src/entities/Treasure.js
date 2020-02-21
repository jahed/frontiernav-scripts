const createType = require('../util/createType')
const { getRarity } = require('../util/getRarity')
const { nameToId, stampRelationshipId } = require('@frontiernav/graph')

const Treasure = createType({
  type: 'Treasure',
  dataFile: 'ITM_TresureList.json',
  nameFile: 'itm_tresure.json',
  getProperties: async ({ raw }) => {
    return ({
      price: raw.Price
    })
  },
  getRelationships: async ({ raw, entity }) => {
    const rarityId = nameToId(await getRarity(raw.Rarity))
    return [
      stampRelationshipId({
        type: 'Treasure-RARITY',
        start: entity.id,
        end: rarityId,
        data: {}
      })
    ]
  }
})

Treasure.schema = {
  properties: [
    {
      entityType: { id: 'Treasure' },
      property: {
        id: 'game_id',
        name: 'Game ID',
        type: 'string',
        hidden: true
      }
    },
    {
      entityType: { id: 'Treasure' },
      property: {
        id: 'price',
        name: 'Price',
        type: 'number'
      }
    }
  ],
  relationships: [
    {
      relationshipType: { id: 'Treasure-RARITY' },
      startEntityType: { id: 'Treasure' },
      endEntityType: { id: 'Rarity' }
    }
  ]
}

module.exports = Treasure
