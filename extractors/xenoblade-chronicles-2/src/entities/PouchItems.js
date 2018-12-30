const createType = require('../util/createType')
const { getRarity } = require('../util/getRarity')
const PouchItemCategories = require('./PouchItemCategories')

module.exports = createType({
  type: 'PouchItem',
  dataFile: 'ITM_FavoriteList.json',
  nameFile: 'itm_favorite.json',
  getProperties: async ({ raw }) => {
    const category = await PouchItemCategories.getById(raw.Category - 11)
    return ({
      category: category.name,
      rarity: await getRarity(raw.Rarity),
      price: raw.Price
    })
  }
})
