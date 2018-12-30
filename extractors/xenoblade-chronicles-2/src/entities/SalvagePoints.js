const _ = require('lodash')
const path = require('path')
const log = require('@frontiernav/logger').get(__filename)
const { getAllRaw, getAllRawByName } = require('../util/gimmicks')
const getName = require('../util/getName')
const RadialButtonChallenges = require('./internal/RadialButtonChallenges')

/*
 * It's best if all of these relationships are squashed into a single type but it's too complicated. First ste,
 * keep it as-is.
 *
 * A SalvagePoint uses a SalvageTable based on the Cylinder used.
 * A SalvageTable has a chance to use 1 of 3 drop tables for Collectibles and Treasure (up to 3 times, implicit?).
 * A SalvageTable has a chance to use 1 of 3 encounter tables for Enemies up to 3 times (explicit).
 * A drop table drops a certain amount of gold, a certain amount of times.
 * A drop table drops a certain amount of items, a certain amount of times, each with a certain chance.
 * An encounter table spawns a single enemy of 3 with a certain chance.
 *
 * INPUT:
 * SalvagePoint --> SalvageTable[1-4 +1] (Different tables for each Cylinder, +1 for special case Booster Cylinder)
 * SalvageTable --> SalvageItemSet[1-3] (Collectible)
 * SalvageTable --> SalvageItemSet[1-3] (Treasure)
 * SalvageTable --> SalvageEnemySet[1-3]
 * SalvageEnemySet --> Enemy[1-3]
 * SalvageItemSet --> CollectionList[1-8] (Collectible)
 * SalvageItemSet --> TreasureList[1-8] (Treasure)
 */

const absoluteNameFile = path.resolve(__dirname, '../../data/database/common_ms', 'fld_salvagepoint.json')

const toSalvagePoint = _.memoize(async raw => {
  const challenges = await Promise.all(
    [raw.BtnChallenge0, raw.BtnChallenge1, raw.BtnChallenge2]
      .map(id => RadialButtonChallenges.getById({ id }))
  )

  return {
    name: raw.name,
    display_name: await getName({
      id: raw.SalvagePointName,
      file: absoluteNameFile
    }),
    challenges: challenges.map(rbc => ({
      button: rbc.button,
      speed: rbc.speed
    }))
  }
}, raw => raw.name)

exports.getByName = async ({ name }) => {
  const allRawByName = await getAllRawByName({ type: 'FLD_SalvagePointList' })
  const raw = allRawByName[`${name}`]
  if (!raw) {
    throw new Error(`SalvagePoint[${name}] not found`)
  }
  return toSalvagePoint(raw)
}

exports.getAll = async () => {
  const allRaw = await getAllRaw('FLD_SalvagePointList')
  return Promise
    .all(
      allRaw.map(raw => (
        toSalvagePoint(raw)
          .catch(e => {
            log.warn(e.message)
            return null
          })
      ))
    )
    .then(results => results.filter(r => r))
}
