const { nameToId } = require('@frontiernav/graph')

const tileMappings = [
  { map_name: 'Lasaria Region (Map)', game_id: 'dlc3_ma40a_f01', name: 'Lasaria Region (Map Tile)' },
  { map_name: 'Aletta Region (Map)', game_id: 'dlc3_ma40a_f02', name: 'Aletta Region (Map Tile)' },
  { map_name: 'Dannagh Region (Map)', game_id: 'dlc3_ma40a_f03', name: 'Dannagh Region (Map Tile)' },
  { map_name: 'Auresco (Map)', game_id: 'dlc3_ma40a_c01', name: 'Auresco (Map Tile)' },
  { map_name: 'Tornan Titan Interior - Balaur, Dark Zone #1 (Map)', game_id: 'dlc3_ma40a_d01', name: 'Tornan Titan Interior - Balaur, Dark Zone #1 (Map Tile)' },
  { map_name: 'Tornan Titan Interior - Fernyiges, Dark Zone #2 (Map)', game_id: 'dlc3_ma40a_d02', name: 'Tornan Titan Interior - Fernyiges, Dark Zone #2 (Map Tile)' },
  { map_name: 'Tornan Titan Interior - Skygate Entrance, Zirnitra, Dark Zone #3 (Map)', game_id: 'dlc3_ma40a_d03', name: 'Tornan Titan Interior - Skygate Entrance, Zirnitra, Dark Zone #3 (Map Tile)' },
  { map_name: 'Tornan Titan Interior - The Soaring Rostrum, Pedestal of Stargazing (Map)', game_id: 'dlc3_ma40a_d04', name: 'Tornan Titan Interior - The Soaring Rostrum, Pedestal of Stargazing (Map Tile)' },
  { map_name: 'Gormott (Map)', game_id: 'dlc3_ma41a_f01', name: 'Gormott (Map Tile)' },
  { map_name: 'Gormott (Map)', game_id: 'dlc3_ma41a_f01_shipoff', name: 'Gormott (No Ship) (Map Tile)' }
]
  .map(v => {
    v.id = nameToId(v.name)
    v.map_id = nameToId(v.map_name)
    return v
  })

const mapMappings = [
  { name: 'Kingdom of Torna', game_id: 'ma40a' },
  { name: 'Gormott', game_id: 'ma41a' },
].map(v => {
  v.id = nameToId(v.name)
  return v
})

module.exports = {
  tileMappings,
  mapMappings
}
