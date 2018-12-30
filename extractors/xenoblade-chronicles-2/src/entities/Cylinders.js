const createType = require('../util/createType')
const { getRarity } = require('../util/getRarity')

module.exports = createType({
  type: 'Cylinder',
  dataFile: 'ITM_SalvageList.json',
  nameFile: 'itm_salvage.json',
  getProperties: async ({ raw, name }) => {
    const rarity = await getRarity(raw.Rarity)
    const safeName = name.replace('Prov.', raw.id)
    return {
      name: safeName,
      display_name: name,
      rarity,
      price: raw.Price
    }
  }
})
