const createType = require('../util/createType')

module.exports = createType({
  type: 'PouchItem',
  dataFile: 'ITM_FavoriteList.json',
  nameFile: 'itm_favorite.json'
})
