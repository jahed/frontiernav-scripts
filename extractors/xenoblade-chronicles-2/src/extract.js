const path = require('path')
const toTSV = require('./util/toTSV')
const writeOut = require('./util/writeOut')

const entities = {
  Accessories: require('./entities/Accessories.js'),
  AuxCores: require('./entities/AuxCores.js'),
  Boosters: require('./entities/Boosters.js'),
  Collectibles: require('./entities/Collectibles.js'),
  CollectionPoints: require('./entities/CollectionPoints.js'),
  CoreChips: require('./entities/CoreChips.js'),
  CoreCrystals: require('./entities/CoreCrystals.js'),
  Cylinders: require('./entities/Cylinders.js'),
  Enemies: require('./entities/Enemies.js'),
  EnemyDropTables: require('./entities/EnemyDropTables.js'),
  EnemySpawnPoints: require('./entities/EnemySpawnPoints.js'),
  EnemySpawns: require('./entities/EnemySpawns.js'),
  FieldSkills: require('./entities/FieldSkills.js'),
  InfoItems: require('./entities/InfoItems.js'),
  KeyItems: require('./entities/KeyItems.js'),
  Locations: require('./entities/Locations.js'),
  MapFeatures: require('./entities/MapFeatures.js'),
  PouchItemCategories: require('./entities/PouchItemCategories.js'),
  PouchItems: require('./entities/PouchItems.js'),
  SalvagePoints: require('./entities/SalvagePoints.js'),
  Treasure: require('./entities/Treasure.js'),
  UnrefinedAuxCores: require('./entities/UnrefinedAuxCores.js'),
  Weapons: require('./entities/Weapons.js')
}

Object
  .keys(entities)
  .map(name => {
    entities[name].getAll()
      .then(result => toTSV({ objects: result }))
      .then(result => writeOut({
        filename: `${name}.tsv`,
        content: result,
        destination: path.resolve(__dirname, '../out')
      }))
  })
