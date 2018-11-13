const logOrphans = (graph, gameLog) => {
  const orphanNodes = Object.keys(graph.nodes)
    .filter(id => !graph.nodes[id].relationships)

  if (orphanNodes.length > 0) {
    gameLog.warn(`Found ${orphanNodes.length} orphan nodes.`)
  }
}

exports.logOrphans = logOrphans
