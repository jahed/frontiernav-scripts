const _ = require('lodash')
const readGraph = require('./readGraph')
const fs = require('fs')
const path = require('path')

function writeGraph(graphRoot, newGraph, options = {}) {
    console.log('\nReading existing graph...')
    // Always read graph to pick up previous changes and any manual changes.
    const rawGraph = readGraph(graphRoot, ({ absoluteFilePath, content }) => ({ absoluteFilePath, content }))

    console.log('Writing graph...')
    const idAlreadyExists = {}
    const updated = {}
    const deleted = {}
    const created = {}
    const ignored = {}

    _(rawGraph).forEach((itemsWithPaths, collectionId) => {
        if(!newGraph[collectionId]) {
            // Ignore unmodifiable items like locales
            return;
        }

        idAlreadyExists[collectionId] = {}
        updated[collectionId] = {}
        deleted[collectionId] = {}
        ignored[collectionId] = {}
        _(itemsWithPaths).forEach(itemWithPath => {
            const itemId = itemWithPath.content.id
            idAlreadyExists[collectionId][itemId] = true

            const newItem = newGraph[collectionId][itemId]
            if(!newItem) {
                console.log(`Deleting object under ${itemWithPath.absoluteFilePath}`)
                if(!options.dryRun) {
                    fs.unlinkSync(itemWithPath.absoluteFilePath)
                }
                deleted[collectionId][itemId] = true
            } else if(!_.isEqual(itemWithPath.content, newItem)) {
                console.log(`Updating object under ${itemWithPath.absoluteFilePath}`)
                if(!options.dryRun) {
                    fs.writeFileSync(itemWithPath.absoluteFilePath, JSON.stringify(newItem, null, 2) + '\n')
                }
                updated[collectionId][itemId] = true
            } else {
                ignored[collectionId][itemId] = true
            }
        })
    })

    _(newGraph).forEach((itemsById, collectionId) => {
        created[collectionId] = {}
        _(itemsById)
            .filter(item => !idAlreadyExists[collectionId][item.id])
            .forEach(item => {
                const absoluteFilePath = path.resolve(graphRoot, `./${collectionId}/${item.id}.json`)
                console.log(`Creating new object under ${absoluteFilePath}`)
                if(!options.dryRun) {
                    fs.writeFileSync(absoluteFilePath, JSON.stringify(item, null, 2) + '\n')
                }
                created[collectionId][item.id] = true
            })
    })

    console.log(statsString({ created, updated, deleted, ignored }) + '\n')
}

function statsString(stats) {
    const columnOrder = ['stat', 'nodeLabels', 'nodes', 'relationshipTypes', 'relationships']
    const rows = _(stats)
        .mapValues(collection => _.mapValues(collection, items => _.size(items)))
        .map((collection, stat) => _.assign({ stat }, collection))
        .map(row => columnOrder.map(column => row[column]).join(',\t'))
        .join('\n')

    return columnOrder.join(', ') + '\n' + rows
}

module.exports = writeGraph
