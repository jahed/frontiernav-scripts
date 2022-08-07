const fs = require('fs/promises')
const path = require('path')

const stitch = async () => {
  const commands = []
  const maps = {}

  const regionDirs = await fs.readdir('.tmp/tiles')
  for (const regionDir of regionDirs) {
    const tileNames = await fs.readdir(path.resolve('.tmp/tiles', regionDir))
    for (const tileName of tileNames) {
      const [, mapName, xPart, yPart] = /(.+)_(\d{2})(\d{2})_0\.png$/.exec(tileName)
      const x = +xPart
      const y = +yPart
      maps[mapName] = maps[mapName] || {
        mapName,
        regionDir,
        tiles: []
      }
      maps[mapName].tiles[y] = maps[mapName].tiles[y] || []
      maps[mapName].tiles[y][x] = tileName
    }
  }

  for (const { mapName, regionDir, tiles } of Object.values(maps)) {
    const th = tiles.length
    let tw = 0
    const inputs = []
    for (const row of tiles) {
      if (row) {
        tw = Math.max(tw, row.length)
      }
    }

    for (let y = 0; y < th; y++) {
      const row = tiles[y] || []
      for (let x = 0; x < tw; x++) {
        const tile = row[x]
        inputs.push(tile
          ? path.join('tiles', regionDir, tile)
          : 'empty.png'
        )
      }
    }

    commands.push([
      'montage',
      ...inputs,
      '-mode concatenate',
      `-tile ${tw}x${th}`,
      '-background transparent',
      `maps/${mapName}.png`
    ].join(' '))
  }

  fs.writeFile('.tmp/genmaps.sh', commands.join('\n'))
}

stitch()
