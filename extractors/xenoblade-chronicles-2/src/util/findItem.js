const { orderedItemTypes } = require('./orderedItemTypes')

const findItem = async rawId => {
  const id = typeof rawId === 'number' ? rawId : parseInt(rawId)

  const type = orderedItemTypes.find(type => id < type.max)

  if (!type) {
    throw new Error(`Item[${rawId}] not found.`)
  }

  return type.module.getById(`${id}`)
}

module.exports = {
  findItem
}
