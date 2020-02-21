const nameToId = require('./nameToId')

const stampEntityId = entity => ({
  id: nameToId(entity.data.name),
  ...entity
})

module.exports = stampEntityId
