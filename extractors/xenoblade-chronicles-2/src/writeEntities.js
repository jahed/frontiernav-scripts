const toTSV = require('./util/toTSV')
const writeOut = require('./util/writeOut')

const entities = {
  Collectibles: require('./entities/Collectibles'),
  CollectionPoints: require('./entities/CollectionPoints'),
  Treasure: require('./entities/Treasure'),
  SalvagePoints: require('./entities/SalvagePoints'),
  FieldSkills: require('./entities/FieldSkills'),
  Locations: require('./entities/Locations'),
  Enemies: require('./entities/Enemies'),
  EnemySpawns: require('./entities/EnemySpawns'),
  EnemySpawnPoints: require('./entities/EnemySpawnPoints'),
  MapFeatures: require('./entities/MapFeatures')
}

Object
  .keys(entities)
  .map(name => {
    entities[name].getAll()
      .then(result => toTSV({ objects: result }))
      .then(result => writeOut({ filename: `${name}.tsv`, content: result }))
  })
