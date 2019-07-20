const path = require('path')
const { bundleGames } = require('./bundleGames')
const { writeAndLogFile } = require('./writeAndLogFile')

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
    .then(games => Promise.all(
      games.map(graph => writeAndLogFile(
        path.resolve(process.cwd(), 'games', `game-${graph.id}`, `graph.json`),
        JSON.stringify(graph)
      ))
    ))
}

exports.buildData = buildData
