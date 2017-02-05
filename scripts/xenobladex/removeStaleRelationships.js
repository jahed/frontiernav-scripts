const _ = require('lodash')
const readGraph = require('../../tests/helpers/readGraph')
const fs = require('fs')

const graph = readGraph('./graph')
const nodes = _.keyBy(graph.nodes, 'content.id')

const deleted = _(graph.relationships)
    .filter(r => !nodes[r.content.start] || !nodes[r.content.end])
    .map(r => {
        fs.writeFileSync(
            r.absoluteFilePath,
            "DELETE THIS",
            'utf-8'
        )
    })
    .size()

console.log(`Deleted ${deleted} relationships`)
