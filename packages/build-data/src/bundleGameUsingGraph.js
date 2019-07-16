const path = require('path')
const fs = require('fs')
const { readGraph } = require('@frontiernav/filesystem')
const logger = require('@frontiernav/logger')
const { objectify } = require('./objectify')
const { arrayToIdMap } = require('./arrayToIdMap')
const { addRelationshipReferences } = require('./addRelationshipReferences')
const { withVersion } = require('./withVersion')
const { logOrphans } = require('./logOrphans')
const _ = require('lodash')

const log = logger.get(__filename)

const addRelationshipEndLabels = graph => {
  _(graph.nodeLabels).forEach(nodeLabel => {
    nodeLabel.relationshipTypes = {}
  })

  _(graph.relationshipTypes)
    .forEach(rt => {
      _(rt.startLabels)
        .forEach(startLabelId => {
          graph.nodeLabels[startLabelId].relationshipTypes[rt.id] = { endLabels: {} }
          _(rt.endLabels)
            .forEach(endLabelId => {
              graph.nodeLabels[startLabelId].relationshipTypes[rt.id].endLabels[endLabelId] = true
            })
        })
    })
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
  addRelationshipReferences(graph)
  addRelationshipEndLabels(graph)
  logOrphans(graph, gameLog)

  const result = withVersion(Object.assign({}, game, gameNode, { graph }))

  return Promise.resolve(result)
}

exports.bundleGameUsingGraph = bundleGameUsingGraph
