const _ = require('lodash')
const createType = require('../util/createType')
const { getShopItems } = require('./internal/ShopStock')
const shopTypesOrder = ['Normal', 'Exchange', 'Inn', 'AuxCore']
const { stampRelationshipId } = require('@frontiernav/graph')

const badShops = {
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
  6: true,
  7: true,
  8: true,
  9: true,
  10: true
}

const duplicateShops = {
  11: true, // 16
  25: true, // 24
  79: true, // 78
  101: true, // 100
  136: true, // 135
  137: true, // 135
  118: true, // 201
  209: true // 49
}

const Shop = createType({
  type: 'Shop',
  dataFile: 'MNU_ShopList.json',
  nameFile: 'fld_shopname.json',
  preprocess: all => {
    return _(all)
      .filter(entry => {
        return shopTypesOrder[entry.ShopType] === 'Normal' && !duplicateShops[entry.id] && !badShops[entry.id]
      })
      .value()
  },
  getProperties: async ({ raw, name: nameProp }) => {
    const name = nameProp === 'Informant' ? `${nameProp} #${raw.id}` : nameProp
    return {
      name
    }
  },
  getRelationships: async ({ raw, entity }) => {
    const items = await getShopItems(raw.TableID)
    return items.map(({ entity: item }) => {
      return stampRelationshipId({
        type: 'Shop-SELLS',
        start: entity.id,
        end: item.id,
        data: {}
      })
    })
  }
})

Shop.schema = {
  entityType: {
    id: 'Shop',
    name: 'Shop',
    hue: 120,
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
  },
  relationships: [
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'Collectible' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'Accessory' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'CoreCrystal' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'UnrefinedAuxCore' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'CoreChip' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'KeyItem' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'Booster' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'PouchItem' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'Cylinder' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'InfoItem' }
    },
    {
      relationshipType: { id: 'Shop-SELLS' },
      startEntityType: { id: 'Shop' },
      endEntityType: { id: 'Treasure' }
    }
  ]
}

module.exports = Shop
