const createType = require('../util/createType')

const duplicatedNames = {
  'Strange Mineral': true,
  'Perfect Range Sensor': true,
  'Ether Cylinder': true,
  ゴミ: true,
  'Control Room Key': true,
  Serenade: true
}

module.exports = createType({
  type: 'KeyItem',
  dataFile: 'ITM_PreciousList.json',
  nameFile: 'itm_precious.json',
  getProperties: async ({ raw, name }) => {
    const safeName = `${duplicatedNames[name] ? `${name} #${raw.id}` : name} (Key Item)`
    return {
      name: safeName,
      price: raw.Price
    }
  }
})
