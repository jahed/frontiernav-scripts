const path = require('path')
const { readJSON, itemTypeMapping } = require('../utils')
const _ = require('lodash')

const equipmentItemType = {
  HeadArmor: true,
  BodyArmor: true,
  ArmArmor: true,
  LegArmor: true,
  FootArmor: true
}

const ignoredNames = {
  'Not Equipped': true
}

const overrideNames = {
  'Tyrea\'s Mask': 'Tyrea\'s Mask (Armour)'
}

const getRows = async ({ bdat }) => {
  const [itemlist, equiplist, equiplistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_itemlist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_equiplist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'ITM_equiplist_ms.json'))
  ]

  let rows = await Promise.all(itemlist.map(async item => {
    try {
      if (!equipmentItemType[itemTypeMapping[item.itemType]]) {
        return null
      }

      const equipment = equiplist[item.itemID - 1]
      if (equipment.name === 0) {
        return null
      }
      const name = equiplistMs[equipment.name - 1].name
      if (!name || ignoredNames[name]) {
        return null
      }

      return {
        name: overrideNames[name] || name,
        equipment_id: equipment.id,
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
