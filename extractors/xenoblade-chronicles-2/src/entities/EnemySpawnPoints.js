const _ = require('lodash')
const log = require('@frontiernav/logger').get(__filename)
const { getAllRaw, getAllRawByName } = require('../util/gimmicks')
const EnemySpawns = require('./EnemySpawns')
const { nameToId } = require('@frontiernav/graph')

const getSpawns = async raw => {
  const data = [
    {
      id: raw.ene1ID,
      rate: raw.ene1Per,
      count: raw.ene1num,
      level: raw.ene1Lv
    },
    {
      id: raw.ene2ID,
      rate: raw.ene2Per,
      count: raw.ene2num,
      level: raw.ene2Lv
    },
    {
      id: raw.ene3ID,
      rate: raw.ene3Per,
      count: raw.ene3num,
      level: raw.ene3Lv
    },
    {
      id: raw.ene4ID,
      rate: raw.ene4Per,
      count: raw.ene4num,
      level: raw.ene4Lv
    }
  ]

  return Promise
    .all(
      data
        .filter(spawn => spawn.id > 0)
        .map(spawn => {
          return EnemySpawns.getById(spawn.id)
            .then(spawn => spawn.name)
            .then(name => nameToId(name))
            .then(id => ({
              id,
              rate: spawn.rate,
              count: spawn.count
            }))
            .catch(e => {
              log.warn(e.message)
              return null
            })
        })
    )
    .then(drops => drops
      .filter(d => d)
      .reduce((acc, next) => {
        const existing = acc[next.id]
        const nextRate = { rate: next.rate, count: next.count }
        if (existing) {
          existing.rates.push(nextRate)
        } else {
          acc[next.id] = {
            id: next.id,
            rates: [nextRate]
          }
        }
        return acc
      }, {})
    )
    .then(dict => _.values(dict))
}

const toEntity = _.memoize(async raw => {
  const spawns = await getSpawns(raw)

  if (spawns.length === 0) {
    throw new Error(`EnemySpawnPoint[${raw.id}] has no enemies.`)
  }

  return {
    name: `Enemy Spawn Point #${raw.id}`,
    quest: (
      raw.QuestFlag > 0 ||
      raw.QuestFlagMin > 0 ||
      raw.QuestFlagMax > 0 ||
      raw.ScenarioFlagMin > 0 ||
      raw.ScenarioFlagMax > 0
    ),
    // time: raw.POP_TIME,
    // weather: raw.popWeather,
    spawns
  }
}, raw => raw.id)

exports.getByName = async ({ name }) => {
  const allRawByName = await getAllRawByName({ type: 'FLD_EnemyPop' })
  const raw = allRawByName[`${name}`]
  if (!raw) {
    throw new Error(`EnemySpawnPoint[${name}] not found`)
  }
  return toEntity(raw)
}

exports.getAll = async () => {
  const allRaw = await getAllRaw('FLD_EnemyPop')
  return Promise
    .all(
      allRaw.map(raw => (
        toEntity(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => !!r))
}
