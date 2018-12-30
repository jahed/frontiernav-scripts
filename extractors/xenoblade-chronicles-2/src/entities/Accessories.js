const createType = require('../util/createType')
const { getRarity } = require('../util/getRarity')

module.exports = createType({
  type: 'Accessory',
  dataFile: 'ITM_PcEquip.json',
  nameFile: 'itm_pcequip.json',
  getProperties: async ({ raw, name }) => {
    const rarity = await getRarity(raw.Rarity)
    return {
      name: `${name} (${rarity})`,
      display_name: name,
      rarity
    }
  }
})
