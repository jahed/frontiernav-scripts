const orderedItemTypes = [
  {
    min: 1,
    max: 1000,
    module: require('../entities/Accessories')
  },
  {
    min: 5001,
    max: 7000,
    module: require('../entities/Weapons')
  },
  {
    min: 10001,
    max: 10060,
    module: require('../entities/CoreChips')
  },
  {
    min: 15001,
    max: 15500,
    module: require('../entities/UnrefinedAuxCores')
  },
  {
    min: 17001,
    max: 17500,
    module: require('../entities/AuxCores')
  },
  {
    min: 20001,
    max: 20010,
    module: require('../entities/Cylinders')
  },
  {
    min: 25001,
    max: 25500,
    module: require('../entities/KeyItems')
  },
  // 'ITM_PreciousListIra',
  {
    min: 26001,
    max: 26200,
    module: require('../entities/InfoItems')
  },
  // 'ITM_EventList',
  {
    min: 30001,
    max: 30500,
    module: require('../entities/Collectibles')
  },
  {
    min: 35001,
    max: 35100,
    module: require('../entities/Treasure')
  },
  {
    min: 40001,
    max: 40500,
    module: require('../entities/PouchItems')
  },
  {
    min: 45001,
    max: 45100,
    module: require('../entities/CoreCrystals')
  },
  {
    min: 50001,
    max: 50010,
    module: require('../entities/Boosters')
  }
  // 'ITM_HanaRole',
  // 'ITM_HanaAtr',
  // 'ITM_HanaArtsEnh',
  // 'ITM_HanaNArtsSet',
  // 'ITM_HanaAssist',
  // 'ITM_EtherCrystal'
]

module.exports = {
  orderedItemTypes
}
