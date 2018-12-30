const rarityMap = [
  'Common',
  'Rare',
  'Legendary'
]

const getRarity = raw => {
  const result = rarityMap[typeof raw === 'number' ? raw : Number(raw)]

  if (!result) {
    throw new Error(`Rarity[${raw}] not found`)
  }

  return result
}

module.exports = {
  getRarity
}
