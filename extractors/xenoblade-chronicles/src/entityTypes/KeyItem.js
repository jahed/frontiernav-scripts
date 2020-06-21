const path = require('path')
const { readJSON } = require('../utils')
const _ = require('lodash')

const itemTypeMapping = [
  undefined,
  undefined,
  'Weapon',
  'Gem',
  'HeadArmor',
  'BodyArmor',
  'ArmArmor',
  'LegArmor',
  'FootArmor',
  'Crystal',
  'Collectable',
  'Material',
  'KeyItem',
  'ArtBook'
]

const getRows = async ({ bdat }) => {
  const [itemlist, keyitemlist, keyitemlistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_itemlist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_valuablelist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'ITM_valuablelist_ms.json'))
  ]

  let rows = await Promise.all(itemlist.map(async item => {
    try {
      if (itemTypeMapping[item.itemType] !== 'KeyItem') {
        return null
      }

      const keyItem = keyitemlist[item.itemID - 1]
      if (keyItem.name === 0) {
        return null
      }
      const name = keyitemlistMs[keyItem.name - 1].name
      if (!name) {
        return null
      }

      return {
        name,
        key_item_id: keyItem.id,
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
      row.name = `${row.name} #${row.key_item_id}`
    }
  })

  return rows
}

module.exports = { getRows }
