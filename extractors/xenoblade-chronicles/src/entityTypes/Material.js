const path = require('path')
const { readJSON, itemTypeMapping } = require('../utils')
const _ = require('lodash')

const validItemType = {
  Material: true
}

const ignoredNames = {
  'Orthlus\' Liver': true
}

const overrideNames = {
}

const rarity = ['Common', 'Rare']

const getRows = async ({ bdat }) => {
  const [itemlist, materiallist, materiallistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_itemlist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_materiallist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'ITM_materiallist_ms.json'))
  ]
  let rows = await Promise.all(itemlist.map(async item => {
    try {
      if (!validItemType[itemTypeMapping[item.itemType]]) {
        return null
      }

      const material = materiallist[item.itemID - 1]
      if (material.name === 0) {
        return null
      }
      const name = materiallistMs[material.name - 1].name
      if (!name || ignoredNames[name]) {
        return null
      }

      return {
        name: overrideNames[name] || name,
        material_id: material.id,
        item_id: item.id,
        rarity: rarity[material.rare],
        value: material.money * 10
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
