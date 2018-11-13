const path = require('path')
const { validateGraph } = require('@frontiernav/graph')
const { transformSpreadsheets } = require('@frontiernav/spreadsheets')
const logger = require('@frontiernav/logger')
const fetch = require('isomorphic-fetch')
const { pick } = require('lodash')
const { addRelationshipReferences } = require('./addRelationshipReferences')
const { withVersion } = require('./withVersion')
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

    const gid = game.googleSpreadsheetId

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
    if (!game.googleSpreadsheetId) {
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
      // .then(graph => {
      //   gameLog.info('bundling locales')
      //   return bundleLocales(graph)
      // })
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

  function buildGameBundle (game, graph) {
    gameLog.info('building bundle')
    return withVersion({
      ...pick(game, ['id', 'data']),
      labels: {
        Game: true
      },
      graph
    })
  }

  return generateGraph(game)
    .then(graph => buildGameBundle(game, graph))
}

exports.bundleGameUsingSpreadsheet = bundleGameUsingSpreadsheet
