const path = require('path')
const { readJSON, itemTypeMapping } = require('../utils')
const _ = require('lodash')

const validItemType = {
  Weapon: true
}

const ignoredNames = {
}

const overrideNames = {
  'Monado Replica EX+': 'Monado Replica EX+ (Weapon)'
}

const getRows = async ({ bdat }) => {
  const [itemlist, wpnlist, wpnlistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_itemlist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_wpnlist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'ITM_wpnlist_ms.json'))
  ]

  let rows = await Promise.all(itemlist.map(async item => {
    try {
      if (!validItemType[itemTypeMapping[item.itemType]]) {
        return null
      }

      const weapon = wpnlist[item.itemID - 1]
      if (weapon.name === 0) {
        return null
      }
      const name = wpnlistMs[weapon.name - 1].name
      if (!name || ignoredNames[name]) {
        return null
      }

      return {
        name: overrideNames[name] || name,
        weapon_id: weapon.id,
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
