const createType = require('../util/createType')

const unsafeNames = {
  'Reflect Immunity': true
}

/**
 * These are the "unrefined" aux cores. They need to be refined first.
 * See ITM_OrbEquip for refined data.
 * TODO: Merge with ITM_OrbEquip
 */
module.exports = createType({
  type: 'UnrefinedAuxCore',
  dataFile: 'ITM_Orb.json',
  nameFile: 'itm_orb.json',
  getProperties: async ({ raw, name }) => {
    const safeName = `${unsafeNames[name] ? `${name} #${raw.id}` : name} (Unrefined)`
    return {
      name: safeName,
      display_name: name,
      price: raw.Price
    }
  }
})
