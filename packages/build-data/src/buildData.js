const path = require('path')
const { readObjects } = require('@frontiernav/filesystem')
const logger = require('@frontiernav/logger')
const { omit, some } = require('lodash')
const mkdirp = require('mkdirp')
const { withVersion } = require('./withVersion')
const { writeAndLogFile } = require('./writeAndLogFile')
const { bundleGames } = require('./bundleGames')

const log = logger.get(__filename)

const buildData = args => {
  const config = require(path.resolve(process.cwd(), args.config || 'frontiernav-data.config.json'))
  const outputPath = path.resolve(process.cwd(), args.outputPath || 'build/data')
  const dataRoot = path.resolve(__dirname, '../../..')

  return Promise
    .all(bundleGames({
      config: config,
      gamesPath: path.resolve(dataRoot, 'games'),
      only: args.only,
      offline: args.offline
    }))
    .then(games => {
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
}

exports.buildData = buildData
