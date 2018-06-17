const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)

const getAllRaw = _.memoize(async () => {
  const content = await readFile(path.resolve(__dirname, '../../data/database/common/FLD_FieldSkillList.json'))
  return JSON.parse(content)
})

const getAllRawById = _.memoize(async () => {
  return _(await getAllRaw()).keyBy('id').value()
})

const getAllRawNamesById = _.memoize(async () => {
  const content = await readFile(path.resolve(__dirname, '../../data/database/common_ms/fld_fieldskilltxt.json'))
  return _(JSON.parse(content)).keyBy('id').value()
})

const categoryMap = {
  '1': 'Collectible',
  '2': 'Elemental',
  '8': 'Unique',
  '4': 'Mercenary'
}

const toFieldSkill = _.memoize(async fieldSkill => {
  const fieldSkillNames = await getAllRawNamesById()
  const fieldSkillName = fieldSkillNames[fieldSkill.Name]
  const fieldSkillDescription = fieldSkillNames[fieldSkill.Caption]

  if (!fieldSkillName) {
    throw new Error(`Failed to find name of FieldSkill[${fieldSkill.id}]`)
  }

  if (!fieldSkillDescription) {
    throw new Error(`Failed to find description of FieldSkill[${fieldSkill.id}]`)
  }

  return {
    name: fieldSkillName.name,
    category: categoryMap[`${fieldSkill.Category}`],
    description: fieldSkillDescription.name.replace(/\n/g, ' '),
    game_id: fieldSkill.id
  }
}, fieldSkill => fieldSkill.id)

exports.getById = async id => {
  const fieldSkills = await getAllRawById()
  const fieldSkill = fieldSkills[`${id}`]
  if (!fieldSkill) {
    throw new Error(`Failed to find FieldSkill[${id}]`)
  }
  return toFieldSkill(fieldSkill)
}

exports.getAll = async () => {
  const allRaw = await getAllRaw()
  return Promise
    .all(
      allRaw.map(raw => (
        toFieldSkill(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => !!r))
}
