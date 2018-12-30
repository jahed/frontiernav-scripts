const createType = require('../util/createType')

module.exports = createType({
  type: 'PouchItem',
  dataFile: 'MNU_MsgFavoriteType.json',
  nameFile: 'menu_favorite_category.json',
  getNameId: ({ raw }) => raw.name - 4
})
