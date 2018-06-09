const createType = require('../util/createType')

module.exports = createType({
  type: 'Collectible',
  dataFile: 'ITM_CollectionList.json',
  nameFile: 'itm_collection.json'
})
