const { mapValues, pickBy, forEach, omit } = require('lodash')

const bundleLocales = graph => {
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

exports.bundleLocales = bundleLocales
