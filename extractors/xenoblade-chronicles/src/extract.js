const { promises: fs } = require('fs')
const path = require('path')

const minimist = require('minimist')
const args = minimist(process.argv.slice(2))

require(`./entityTypes/${args.type}`).getRows(args)
  .then(result => fs.writeFile(path.resolve('out', `${args.type}.json`), JSON.stringify(result, null, 2)))
  .then(() => console.log('Done.'))
  .catch(error => console.error(error))
