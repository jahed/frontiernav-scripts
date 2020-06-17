const { promises: fs } = require('fs')
const path = require('path')
const _ = require('lodash')
const minimist = require('minimist')

const validateResult = result => {
  _(result)
    .countBy('name')
    .forEach((count, name) => {
      if (count > 1) {
        console.warn('row with duplicate name found.', { name, count })
      }
    })
}

const extract = async () => {
  const args = minimist(process.argv.slice(2))
  await fs.mkdir('/tmp/frontiernav-scripts/xenoblade-chronicles/', { recursive: true })
  const rows = await require(`./entityTypes/${args.type}`).getRows(args)
  validateResult(rows)
  console.log('Writing file.', { rows: rows.length })
  await fs.writeFile(
    path.resolve('/tmp/frontiernav-scripts/xenoblade-chronicles/', `${args.type}.json`),
    JSON.stringify(rows, null, 2)
  )
}

extract().catch(error => console.error(error))
