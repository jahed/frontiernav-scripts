const createType = require('../util/createType')

const unsafeNames = {
  'Strange Mineral': true,
  'Perfect Range Sensor': true,
  'Ether Cylinder': true,
  'ゴミ': true,
  'Control Room Key': true,
  'Serenade': true
}

module.exports = createType({
  type: 'KeyItem',
  dataFile: 'ITM_PreciousList.json',
  nameFile: 'itm_precious.json',
  getProperties: async ({ raw, name }) => {
    const safeName = `${unsafeNames[name] ? `${name} #${raw.id}` : name} (Key Item)`
    return {
      name: safeName,
      display_name: name,
      price: raw.Price
    }
  }
})
