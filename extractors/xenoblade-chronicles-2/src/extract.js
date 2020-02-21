const path = require('path')
const fs = require('fs')
const {
  addEntityAction,
  addRelationshipAction,
  addEntityTypeRelationship,
  addEntityTypeAction,
  addRelationshipTypeProperty,
  addEntityTypeProperty
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
  // KeyItemPoint: require('./entities/KeyItemPoints.js'),
  // MapFeature: require('./entities/MapFeatures.js'),
  // PouchItemCategory: require('./entities/PouchItemCategories.js'),
  // PouchItem: require('./entities/PouchItems.js'),
  // SalvagePoint: require('./entities/SalvagePoints.js'),
  Treasure: require('./entities/Treasure.js'),
  // UnrefinedAuxCore: require('./entities/UnrefinedAuxCores.js'),
  // TreasurePoint: require('./entities/TreasurePoints.js')
  // Weapon: require('./entities/Weapons.js'),
  Shop: require('./entities/Shops.js')
}

Promise
  .all(
    _(entityTypeModules)
      .map(entityTypeModule => entityTypeModule.getAll()
        .then(result => {
          const schemaActions = []
          if (entityTypeModule.schema) {
            if (entityTypeModule.schema.entityType) {
              schemaActions.push(addEntityTypeAction(entityTypeModule.schema.entityType))
            }
            if (entityTypeModule.schema.properties) {
              entityTypeModule.schema.properties.forEach(p => schemaActions.push(addEntityTypeProperty(p)))
            }
            if (entityTypeModule.schema.relationships) {
              entityTypeModule.schema.relationships.forEach(r => schemaActions.push(addEntityTypeRelationship(r)))
            }
            if (entityTypeModule.schema.relationshipProperties) {
              entityTypeModule.schema.relationshipProperties.forEach(r => schemaActions.push(addRelationshipTypeProperty(r)))
            }
          }
          return [
            ...schemaActions,
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
