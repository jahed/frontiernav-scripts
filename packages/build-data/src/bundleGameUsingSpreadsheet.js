const path = require('path')
const { validateGraph } = require('@frontiernav/graph')
const { transformSpreadsheets } = require('@frontiernav/spreadsheets')
const logger = require('@frontiernav/logger')
const fetch = require('isomorphic-fetch')
const { addRelationshipReferences } = require('./addRelationshipReferences')
const { emptyGraph } = require('./emptyGraph')
const { logOrphans } = require('./logOrphans')

const log = logger.get(__filename)

function bundleGameUsingSpreadsheet (gameRoot, game, offline) {
  const gameLog = log.child({ name: game.id })

  function getSpreadsheet (game) {
    if (offline) {
      const spreadsheetPath = path.resolve(__dirname, '../spreadsheets', `${game.id}.xlsx`)
      gameLog.info('Using local spreadsheet.', spreadsheetPath)
      return Promise.resolve(spreadsheetPath)
    }

    const gid = game.data.googleSpreadsheetId

    gameLog.info('Downloading spreadsheet.', `https://docs.google.com/spreadsheets/d/${gid}/`)

    return fetch(`https://docs.google.com/spreadsheets/d/${gid}/export?format=xlsx&id=${gid}`)
      .then(response => {
        if (response.status >= 400) {
          return Promise.reject(
            new Error(`Google Spreadsheets responded with "${response.status}" for "${gid}"`)
          )
        }

        return response.buffer()
      })
  }

  function generateGraph (game) {
    if (!game.data.googleSpreadsheetId) {
      gameLog.info('No spreadsheet found, using empty graph')
      return Promise.resolve(emptyGraph(game))
    }

    gameLog.info('Building spreadsheet graph.', gameRoot)
    return getSpreadsheet(game)
      .then(content => transformSpreadsheets(gameRoot, content))
      .then(graph => validateGraph(graph)
        .then(failures => {
          if (failures.length > 0) {
            gameLog.error({ failures }, 'Graph validation failures.')
            return Promise.reject(new Error('Graph validation failed.'))
          }
          return graph
        })
      )
      .then(graph => {
        gameLog.info('adding back references to incoming relationships')
        return addRelationshipReferences(graph)
      })
      .then(graph => {
        gameLog.info('finding orphan nodes')
        logOrphans(graph, gameLog)
        return graph
      })
  }

  return generateGraph(game)
}

exports.bundleGameUsingSpreadsheet = bundleGameUsingSpreadsheet
