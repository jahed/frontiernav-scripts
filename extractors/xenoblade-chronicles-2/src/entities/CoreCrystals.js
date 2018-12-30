const createType = require('../util/createType')
const { getRarity } = require('../util/getRarity')

const unsafeNames = {
  'Common Core Crystal': true,
  'Unnamed Core Crystal': true
}

module.exports = createType({
  type: 'CoreCrystal',
  dataFile: 'ITM_CrystalList.json',
  nameFile: 'itm_crystal.json',
  getProperties: async ({ raw, name }) => {
    const rarity = await getRarity(raw.Rarity)
    const safeName = unsafeNames[name] ? `${name} (${raw.id})` : name
    return {
      name: safeName,
      display_name: name,
      rarity,
      price: raw.Price
    }
  }
})
