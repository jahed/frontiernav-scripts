const { mapValues, keyBy, pickBy, forEach, omit, pick, some } = require('lodash')
const path = require('path')
const fs = require('fs')
const mkdirp = require('mkdirp')
const crypto = require('crypto')
const fetch = require('isomorphic-fetch')
const minimist = require('minimist')
const { readGraph, readObjects } = require('@frontiernav/filesystem')
const { validateGraph } = require('@frontiernav/graph')
const { transformSpreadsheets } = require('@frontiernav/spreadsheets')
const logger = require('./scripts/logger')

function objectify (json) {
  if (Array.isArray(json.labels)) {
    json.labels = json.labels.reduce((acc, label) => {
      acc[label] = true
      return acc
    }, {})
  }
  return json
}

function arrayToIdMap (rawGraph) {
  return mapValues(rawGraph, objs => keyBy(objs, 'id'))
}

function addRelationshipReferences (graph) {
  forEach(graph.relationships, r => {
    const startNode = graph.nodes[r.start]
    startNode.relationships = startNode.relationships || {}
    startNode.relationships[r.id] = true

    const endNode = graph.nodes[r.end]
    endNode.relationships = endNode.relationships || {}
    endNode.relationships[r.id] = true
  })

  return graph
}

function bundleLocales (graph) {
  graph.locales = {}

  // Parse locale data
  graph.nodes = mapValues(graph.nodes, (node, nodeId) => {
    // Ensure data exists
    node.data = node.data || {}

    // Move node locale data into locales
    forEach(node.locale, (localeData, localeId) => {
      graph.locales[localeId] = graph.locales[localeId] || {
        nodes: {}
      }

      graph.locales[localeId].nodes[nodeId] = localeData
    })

    // Move node data into 'en' locale as base reference when switching locales
    graph.locales.en = graph.locales.en || {
      nodes: {}
    }

    graph.locales.en.nodes[nodeId] = node.data

    return omit(node, ['locale'])
  })

  // Default to English
  graph.locale = 'en'

  // Remove unused locales
  graph.locales = pickBy(graph.locales, locale => !!locale.nodes)
  return graph
}

function withVersion (object, versionedObject = object) {
  const _version = crypto.createHash('md5').update(JSON.stringify(versionedObject)).digest('hex')
  return Object.assign({ _version }, object)
}

function writeAndLogFile (filePath, object, overwrite = true) {
  try {
    try {
      fs.accessSync(filePath)

      if (!overwrite) {
        log.debug('Object with current hash exists, ignoring.', filePath)
        return Promise.resolve()
      }
    } catch (e) {
      log.debug('Object with current hash does not exist, creating.', filePath)
    }

    log.info('Writing object.', filePath)
    fs.writeFileSync(filePath, JSON.stringify(object))
    return Promise.resolve()
  } catch (e) {
    return Promise.reject(e)
  }
}

function logOrphans (graph, gameLog) {
  const orphanNodes = Object.keys(graph.nodes)
    .filter(id => !graph.nodes[id].relationships)

  if (orphanNodes.length > 0) {
    gameLog.warn(`Found ${orphanNodes.length} orphan nodes.`)
  }
}

function bundleGameUsingGraph (gameRoot, gameId) {
  const gameLog = log.child({ name: gameId })

  gameLog.info('Reading game.', gameRoot)
  const game = JSON.parse(
    fs.readFileSync(
      path.resolve(gameRoot, 'game.json')
    ).toString()
  )

  const gameNode = objectify(
    JSON.parse(
      fs.readFileSync(
        path.resolve(gameRoot, 'graph/nodes', `${game.id}.json`)
      ).toString()
    )
  )

  gameLog.info('Building graph for game.', gameRoot)
  const rawGraph = readGraph(
    path.resolve(gameRoot, 'graph'),
    ({ content }) => objectify(content)
  )
  const graph = arrayToIdMap(rawGraph)
  graph.id = gameId
  bundleLocales(graph)
  addRelationshipReferences(graph)
  logOrphans(graph, gameLog)

  const result = withVersion(Object.assign({}, game, gameNode, { graph }))

  return Promise.resolve(result)
}

function emptyGraph (game) {
  return {
    id: game.id,
    nodes: {},
    relationships: {},
    nodeLabels: {},
    relationshipTypes: {}
  }
}

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

  function generateGraph(game) {
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

/*
 *
 * EXECUTION STARTS HERE
 *
 */

const args = minimist(process.argv.slice(2))
const config = require(path.resolve(process.cwd(), args.config || 'frontiernav-data.config.json'))
const outputPath = path.resolve(process.cwd(), args.outputPath || 'build/data')
const dataRoot = path.resolve(__dirname)

const log = logger.module(__filename)

Promise
  .all(bundleGames({
    config: config,
    gamesPath: path.resolve(dataRoot, 'games'),
    only: args.only,
    offline: args.offline
  }))
  .then(games => {
    log.info('Building app data...')

    const allLocales = readObjects(path.resolve(dataRoot, 'locales'), ({ content }) => content)
    const usedLocales = allLocales
      .filter(locale => (
        locale.id === 'en' ||
        games.some(game => some(
          game.graph.locales,
          (gameLocale, usedLocaleId) => usedLocaleId === locale.id
        ))
      ))
      .reduce((acc, locale) => {
        acc[locale.id] = locale
        return acc
      }, {})

    const app = withVersion({
      id: 'frontiernav',
      name: 'FrontierNav',
      locales: usedLocales,
      games: games.reduce((acc, game) => {
        acc[game.id] = {
          ...omit(game, ['graph', 'visualisations', '_version']),
          url: `/data/games/${game.id}-${game._version}.json`
        }
        return acc
      }, {})
    })

    try {
      mkdirp.sync(path.resolve(outputPath, 'games'))
    } catch (e) {
      log.debug('Assuming games directory exists.')
    }

    log.info('Writing data.', outputPath)
    return Promise.all([
      ...games.map(game => {
        return writeAndLogFile(path.resolve(outputPath, 'games', `${game.id}-${game._version}.json`), game, false)
      }),
      writeAndLogFile(path.resolve(outputPath, 'app.json'), app, true)
    ])
  })
  .then(() => {
    log.info('Done.')
  })
  .catch(error => {
    log.error(error, 'Failed to build data.')
    process.exit(-1)
  })
