const path = require('path')
const { readJSON } = require('../utils')

const UNBEATABLE_NPC_ONLY = 97

const getRows = async ({ bdat }) => {
  const [skilllist, skilllistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'BTL_skilllist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'BTL_skilllist_ms.json'))
  ]

  let rows = await Promise.all(skilllist.map(async skill => {
    try {
      if (skill.id === UNBEATABLE_NPC_ONLY) {
        return null
      }
      if (skill.name === 0) {
        return null
      }
      const name = skilllistMs[skill.name - 1].name
      if (!name) {
        return null
      }

      return {
        name,
        sell_price: skill.money,
        skill_id: skill.id
      }
    } catch (error) {
      console.warn('failed', { skill, error })
    }
  }))

  rows = rows.filter(v => !!v)

  return rows
}

module.exports = { getRows }
