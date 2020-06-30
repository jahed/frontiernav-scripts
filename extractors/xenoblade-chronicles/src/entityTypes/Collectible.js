const path = require('path')
const { readJSON } = require('../utils')

const ID_THRESHOLD = 300

const getRows = async ({ bdat }) => {
  const [collectlist, collectlistMs] = [
    await readJSON(path.resolve(bdat, 'bdat_common', 'ITM_collectlist.json')),
    await readJSON(path.resolve(bdat, 'bdat_common_ms', 'ITM_collectlist_ms.json'))
  ]

  let rows = await Promise.all(collectlist.map(async collectible => {
    try {
      if (collectible.id > ID_THRESHOLD) {
        return null
      }
      if (collectible.name === 0) {
        return null
      }
      const ms = collectlistMs[collectible.name - 1]
      const name = ms && ms.name
      if (!name) {
        return null
      }

      return {
        name,
        sell_price: collectible.money,
        collectible_id: collectible.id,
        FSplus1: collectible.FSplus1,
        FSplus2: collectible.FSplus2,
        FSplus3: collectible.FSplus3,
        FSplus4: collectible.FSplus4,
        FSplus5: collectible.FSplus5,
        FSplus6: collectible.FSplus6,
        FSplus7: collectible.FSplus7
      }
    } catch (error) {
      console.warn('failed', { collectible, error })
    }
  }))

  rows = rows.filter(v => !!v)

  return rows
}

module.exports = { getRows }
