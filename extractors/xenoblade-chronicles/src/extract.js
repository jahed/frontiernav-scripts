const { promises: fs } = require('fs')
const path = require('path')

require('./entityTypes/MapTile').getRows()
  .then(result => fs.writeFile(path.resolve('./out/MapTile.json'), JSON.stringify(result, null, 2)))
  .then(() => console.log('Done.'))
  .catch(error => console.error(error))
