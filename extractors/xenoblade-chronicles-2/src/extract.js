const path = require('path')
const fs = require('fs')
const {
  addEntityAction,
  addRelationshipAction,
  addEntityTypeRelationship,
  addEntityTypeAction,
  addRelationshipTypeProperty
} = require('./actions')
const _ = require('lodash')

const entityTypeModules = {
  // Accessory: require('./entities/Accessories.js'),
  // AuxCore: require('./entities/AuxCores.js'),
  // Booster: require('./entities/Boosters.js'),
  // Collectible: require('./entities/Collectibles.js'),
  // CollectionPoint: require('./entities/CollectionPoints.js'),
  // CoreChip: require('./entities/CoreChips.js'),
  // CoreCrystal: require('./entities/CoreCrystals.js'),
  // Cylinder: require('./entities/Cylinders.js'),
  // Enemy: require('./entities/Enemies.js'),
  // EnemyDropTable: require('./entities/EnemyDropTables.js'),
  // EnemySpawnPoint: require('./entities/EnemySpawnPoints.js'),
  // EnemySpawn: require('./entities/EnemySpawns.js'),
  // FieldSkill: require('./entities/FieldSkills.js'),
  // InfoItem: require('./entities/InfoItems.js'),
  // KeyItem: require('./entities/KeyItems.js'),
  // Location: require('./entities/Locations.js'),
  // MapFeature: require('./entities/MapFeatures.js'),
  // PouchItemCategory: require('./entities/PouchItemCategories.js'),
  // PouchItem: require('./entities/PouchItems.js'),
  // SalvagePoint: require('./entities/SalvagePoints.js'),
  // Treasure: require('./entities/Treasure.js'),
  // UnrefinedAuxCore: require('./entities/UnrefinedAuxCores.js'),
  TreasurePoint: require('./entities/TreasurePoints.js')
  // Weapon: require('./entities/Weapons.js')
}

Promise
  .all(
    _(entityTypeModules)
      .map(entityTypeModule => entityTypeModule.getAll()
        .then(result => {
          return [
            addEntityTypeAction(entityTypeModule.schema.entityType),
            ...entityTypeModule.schema.relationships.map(r => addEntityTypeRelationship(r)),
            ...entityTypeModule.schema.relationshipProperties.map(r => addRelationshipTypeProperty(r)),
            ...result.flatMap(({ entity, relationships }) => {
              return [
                addEntityAction(entity),
                ...relationships.map(r => addRelationshipAction(r))
              ]
            })
          ]
        })
      )
      .value()
  )
  .then(result => _(result)
    .flatten()
    .keyBy(action => action.meta.createdAt)
    .value()
  )
  .then(result => {
    return fs.promises.writeFile(
      // path.resolve(`/tmp/changes-${sessionId}.json`),
      path.resolve('/tmp/frontiernav-changes.json'),
      JSON.stringify(result, null, 2)
    )
  })
