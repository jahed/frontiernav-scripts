const path = require('path')
const fs = require('fs')
const logger = require('@frontiernav/logger')
const { bundleGameUsingSpreadsheet } = require('./bundleGameUsingSpreadsheet')
const { bundleGameUsingGraph } = require('./bundleGameUsingGraph')

const log = logger.get(__filename)

function bundleGames ({ config, gamesPath, only, offline }) {
  log.info('Bundling games...', { gamesPath })

  const graphPromises = fs.readdirSync(gamesPath)
    .filter(gameId => (only ? only === gameId : true))
    .map(gameId => {
      const gameRoot = path.resolve(gamesPath, gameId)
      return bundleGameUsingGraph(gameRoot, gameId)
    })

  const spreadsheetPromises = config.games
    .map(moduleName => {
      const modulePath = require.resolve(
        path.join(moduleName, 'game'),
        { paths: [process.cwd()] }
      )
      return {
        root: path.dirname(modulePath),
        game: require(modulePath).game
      }
    })
    .filter(({ game }) => (only ? only === game.id : true))
    .map(({ root, game }) => bundleGameUsingSpreadsheet(root, game, offline))

  return Promise.all([
    ...graphPromises,
    ...spreadsheetPromises
  ])
}

exports.bundleGames = bundleGames
