const _ = require('lodash')
const transformAll = require('../helpers/transformAll')
const readGraph = require('../../tests/helpers/readGraph')
const path = require('path')
const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))

const graph = readGraph('./graph', r => r.content)
const nodes = _.keyBy(graph.nodes, 'id')

function writeObjects(dir, objects) {
    const absoluteDir = path.resolve(`./graph/`, dir)

    return Promise.all(
        _(objects)
            .map(obj => {
                return fs.writeFileAsync(
                    path.resolve(absoluteDir, `${obj.id}.json`),
                    JSON.stringify(obj, undefined, 2),
                    'utf-8'
                )
            })
            .value()
    )
}

transformAll('./graph/relationships', '.json', relationship => {
    const startNode = nodes[relationship.start]
    const endNode = nodes[relationship.end]

    if(startNode.labels.indexOf('MapLayer') !== -1 && endNode.labels.indexOf('SegmentGrid') !== -1) {
        const mapLayer = startNode
        const segmentGrid = endNode

        const newRelationships = _(graph.relationships)
            .filter(r => r.start === segmentGrid.id && r.type === 'HAS')
            .map(r => {
                const segment = nodes[r.end]
                return {
                    id: `${mapLayer.id}__MARKED_WITH__${segment.id}`,
                    type: 'MARKED_WITH',
                    start: mapLayer.id,
                    end: segment.id
                }
            })
            .value()
        writeObjects('./relationships/xenoblade-x/segment-markers', newRelationships)


        return Object.assign({}, relationship, {
            type: 'DELETE_THIS'
        })
    }

    return relationship
})
