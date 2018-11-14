const path = require('path')
const logger = require('@frontiernav/logger')
const { writeAndLogFile } = require('./writeAndLogFile')
const { bundleGames } = require('./bundleGames')

const log = logger.get(__filename)

const buildData = args => {
  const config = require(path.resolve(process.cwd(), args.config || 'frontiernav-data.config.js'))
  const dataRoot = path.resolve(__dirname, '../../..')

  return Promise.resolve()
    .then(() => bundleGames({
      config: config,
      gamesPath: path.resolve(dataRoot, 'games'),
      only: args.only,
      offline: args.offline
    }))
    .then(games => {
      log.info('Writing data.')
      return Promise.all(
        games.map(game => writeAndLogFile(
          path.resolve(process.cwd(), 'games', `game-${game.id}`, `graph.json`),
          game,
          true
        ))
      )
    })
}

exports.buildData = buildData
