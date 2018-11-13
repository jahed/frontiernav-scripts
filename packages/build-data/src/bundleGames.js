const path = require('path')
const fs = require('fs')
const logger = require('@frontiernav/logger')
const { bundleGameUsingSpreadsheet } = require('./bundleGameUsingSpreadsheet')
const { bundleGameUsingGraph } = require('./bundleGameUsingGraph')

const log = logger.get(__filename)

function bundleGames ({ config, gamesPath, only, offline }) {
  log.info('Bundling games...', { gamesPath })
  return fs.readdirSync(gamesPath)
    .filter(gameId => (only ? only === gameId : true))
    .map(gameId => {
      const gameRoot = path.resolve(gamesPath, gameId)
      const gameNode = config.games[gameId]

      return gameNode
        ? bundleGameUsingSpreadsheet(gameRoot, gameNode, offline)
        : bundleGameUsingGraph(gameRoot, gameId)
    })
}

exports.bundleGames = bundleGames
