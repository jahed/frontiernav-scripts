import fs from 'node:fs/promises'

const mapInitialsConfig = {
  'S': {
    id: 'sky',
    name: 'Sky'
  },
  'G': {
    id: 'ground',
    name: 'Ground'
  },
  'U': {
    id: 'underground',
    name: 'Underground'
  }
}

const commands = []

const rawTileNames = (await fs.readdir('./totk-maps-800x800')).sort()

const tileGroups = {}
for (const rawTileName of rawTileNames) {
  const nameParts = /^((U|G|S)_(\d\d)-(\d\d))_01.*\.png$/.exec(rawTileName)
  if (!nameParts) {
    console.warn(`Unknown raw tile name format: ${rawTileName}`)
    continue;
  }
  console.log('Raw tile name parsed:', JSON.stringify({ nameParts }))

  const groupKey = nameParts[1]
  const mapInitial = nameParts[2]
  const x = Number(nameParts[3])
  const y = Number(nameParts[4])

  tileGroups[groupKey] = tileGroups[groupKey] || {
    mapInitial,
    x,
    y,
    files: []
  }
  tileGroups[groupKey].files.push(`./totk-maps-800x800/${rawTileName}`)
}

// Choose the last tile to represent the group in map.
// This is typically the most final and complete tile. Ignore other variants.
const mapTiles = {}
for (const key in tileGroups) {
  const { mapInitial, y, x, files } = tileGroups[key]
  mapTiles[mapInitial] = mapTiles[mapInitial] || []
  mapTiles[mapInitial][y] = mapTiles[mapInitial][y] || []

  mapTiles[mapInitial][y][x] = files[files.length - 1]
}

for (const key in mapTiles) {
  const config = mapInitialsConfig[key]
  const mapGrid = mapTiles[key]

  const tw = Math.max(...mapGrid.map(v => v.length))
  const th = mapGrid.length
  const files = mapGrid.flat()

  console.log(`${tw}x${th}`)
  for (let i = 0; i < th; i++) {
    let row = ''
    for (let j = 0; j < tw; j++) {
      row += mapGrid[i][j] ? 'x' : '_'
    }
    console.log(row)
  }

  commands.push([
    'montage',
    ...files,
    '-mode concatenate',
    `-tile ${tw}x${th}`,
    '-background transparent',
    `maps/${config.id}.png`
  ].join(' '))
}

fs.writeFile('./genmaps.sh', commands.join('\n'))
