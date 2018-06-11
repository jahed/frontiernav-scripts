const { readFile } = require('@frontiernav/filesystem')
const _ = require('lodash')

const getAllRawNamesById = _.memoize(async (file) => {
  const content = await readFile(file)
  return _(JSON.parse(content)).keyBy('id').value()
})

const getName = async ({ id, file }) => {
  const names = await getAllRawNamesById(file)
  const name = names[id]

  if (!name) {
    throw new Error(`failed to find id ${id} in ${file}`)
  }

  if (!name.name) {
    throw new Error(`name with id ${id} is empty in ${file}`)
  }

  return name.name
}

module.exports = getName
