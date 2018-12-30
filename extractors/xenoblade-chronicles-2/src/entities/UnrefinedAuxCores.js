const createType = require('../util/createType')

/**
 * These are the "unrefined" aux cores. They need to be refined first.
 * See ITM_OrbEquip for refined data.
 * TODO: Merge with ITM_OrbEquip
 */
module.exports = createType({
  type: 'UnrefinedAuxCore',
  dataFile: 'ITM_Orb.json',
  nameFile: 'itm_orb.json'
})
