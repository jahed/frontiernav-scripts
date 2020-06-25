const path = require('path')
const { readJSON, itemTypeMapping } = require('../utils')
const _ = require('lodash')

const validItemType = {
  ArtBook: true
}

const ignoredNames = {
}

const overrideNames = {
}

const tierMappings = [
  undefined,
  'Base',
  'Intermediate',
  'Advanced',
  'Master'
]

const getRows = async ({ bdat }) => {
  const [itemlist, artslist, artslistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_itemlist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_artslist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'ITM_artslist_ms.json'))
  ]

  let rows = await Promise.all(itemlist.map(async item => {
    try {
      if (!validItemType[itemTypeMapping[item.itemType]]) {
        return null
      }

      const artbook = artslist[item.itemID - 1]
      if (artbook.name === 0) {
        return null
      }
      const baseName = artslistMs[artbook.name - 1].name
      if (!baseName || ignoredNames[baseName]) {
        return null
      }

      const tier = tierMappings[artbook.memory_type]
      if (!tier) {
        console.warn('unknown tier', { artbook })
        return null
      }

      const name = tier === 'Base' ? baseName : `${baseName} (${tier})`

      return {
        name: overrideNames[name] || name,
        tier,
        artbook_id: artbook.id,
        item_id: item.id
      }
    } catch (error) {
      console.warn('failed', { item, error })
    }
  }))

  rows = rows.filter(v => !!v)

  const nameCounts = _.countBy(rows, 'name')
  rows.forEach(row => {
    if (nameCounts[row.name] > 1) {
      row.name = `${row.name} #${row.item_id}`
    }
  })

  return rows
}

module.exports = { getRows }
