const _ = require('lodash')
const path = require('path')
const { readFile } = require('@frontiernav/filesystem')
const Collectibles = require('../Collectibles')
const Accessories = require('../Accessories')
const CoreChips = require('../CoreChips')
const KeyItems = require('../KeyItems')
const UnrefinedAuxCores = require('../UnrefinedAuxCores')
const CoreCrystals = require('../CoreCrystals')
const Boosters = require('../Boosters')
const PouchItems = require('../PouchItems')
const Cylinders = require('../Cylinders')
const InfoItems = require('../InfoItems')
const Treasures = require('../Treasure')

const ItemTypes = [Collectibles, Accessories, CoreCrystals, UnrefinedAuxCores, CoreChips, KeyItems, Boosters, PouchItems, Cylinders, InfoItems, Treasures]

const getItemById = (shopId, itemId) => {
  return ItemTypes
    .reduce((chain, type) => {
      return chain
        .catch(() => type.getById(itemId))
    }, Promise.reject(new Error('No types to search through.')))
    .catch(error => {
      console.error(`Shop[${shopId}] Item[${itemId}] not found.`, error)
      process.exit(1)
    })
}

const getAllRaw = _.memoize(async () => {
  const content = await readFile(path.resolve(__dirname, '../../../data/database/common/MNU_ShopNormal.json'))
  return JSON.parse(content)
})

const getAllRawById = _.memoize(async () => {
  return _(await getAllRaw()).keyBy('id').value()
})

exports.getShopItems = async shopId => {
  const allRawById = await getAllRawById()
  const raw = allRawById[`${shopId}`]
  if (!raw) {
    throw new Error(`Shop[${shopId}] not found`)
  }

  const itemIds = [
    raw.DefItem1,
    raw.DefItem2,
    raw.DefItem3,
    raw.DefItem4,
    raw.DefItem5,
    raw.DefItem6,
    raw.DefItem7,
    raw.DefItem8,
    raw.DefItem9,
    raw.DefItem10,
    raw.Addtem1,
    raw.Addtem2,
    raw.Addtem3,
    raw.Addtem4,
    raw.Addtem5,
    raw.PrivilegeItem
  ].filter(id => id)

  return Promise.all(itemIds.map(itemId => getItemById(shopId, itemId)))
}
