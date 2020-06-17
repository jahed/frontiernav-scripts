const path = require('path')
const { readJSON } = require('../utils')
const _ = require('lodash')

const nameOverrides = {
  Bug: 'Bug (Enemy Type)',
  Saturn: 'Saturn (Enemy Type)',
  Mars: 'Mars (Enemy Type)',
  Jupiter: 'Jupiter (Enemy Type)',
  Mercury: 'Mercury (Enemy Type)',
  Venus: 'Venus (Enemy Type)'
}

const getRows = async ({ bdat }) => {
  const [crystalnamelist, crystalnamelistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'BTL_crystalnamelist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'BTL_crystalnamelist_ms.json'))
  ]

  let rows = await Promise.all(crystalnamelist.map(async type => {
    if (type.name === 0) {
      return null
    }

    let name = crystalnamelistMs[type.name - 1].name
    name = nameOverrides[name] || name

    return {
      id: type.id,
      name
    }
  }))

  rows = rows.filter(v => !!v)
  rows = _.uniqBy(rows, 'name')
  return rows
}

module.exports = { getRows }
