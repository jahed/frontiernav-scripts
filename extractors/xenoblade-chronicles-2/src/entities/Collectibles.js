const createType = require('../util/createType')
const _ = require('lodash')

const TTGC_THRESHOLD = 30340

const Collectibles = createType({
  type: 'Collectible',
  dataFile: 'ITM_CollectionList.json',
  nameFile: 'itm_collection.json',
  preprocess: all => {
    return _(all)
      .filter(entry => {
        return (+entry.id) >= TTGC_THRESHOLD
      })
      .value()
  },
})

Collectibles.schema = {
  entityType: {
    id: 'Collectible',
    name: 'Collectible',
    hue: 50,
    properties: {
      name: {
        id: 'name',
        name: 'Name',
        type: 'string',
        required: true
      },
      game_id: {
        id: 'game_id',
        name: 'Game ID',
        type: 'string',
        hidden: true
      }
    }
  }
}

module.exports = Collectibles
