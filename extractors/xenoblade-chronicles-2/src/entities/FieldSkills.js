const { readFile } = require('@frontiernav/filesystem')
const path = require('path')
const _ = require('lodash')

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

const toFieldSkill = _.memoize(async fieldSkill => {
  const fieldSkillNames = await getAllRawNamesById()
  const fieldSkillName = fieldSkillNames[fieldSkill.Name]

  return {
    name: fieldSkillName ? fieldSkillName.name : `unknown-${fieldSkill.Name}`,
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
  const all = await getAllRaw()
  return Promise.all(
    all.map(one => toFieldSkill(one))
  )
}
