const createType = require('../util/createType')

const unsafeNames = {
  'Kountess Search Brief': true
}

module.exports = createType({
  type: 'InfoItem',
  dataFile: 'ITM_InfoList.json',
  nameFile: 'itm_info.json',
  getProperties: async ({ raw, name }) => {
    const safeName = `${unsafeNames[name] ? `${name} #${raw.id}` : name} (Info Item)`
    return {
      name: safeName,
      display_name: name,
      price: raw.Price
    }
  }
})
