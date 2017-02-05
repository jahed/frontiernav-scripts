const bluebird = require('bluebird')
const path = require('path')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const _ = require('lodash')
const googleSheets = require('../helpers/googleSheets')
const nameToId = require('../helpers/nameToId')

const zygardeCoreId = 'zygarde-core'

googleSheets.getSheet('1hwBrlBbnQQ1YgJGYKPjZ8Fm3iRLSzBmho8Wwg8byzcc', 'Zygarde Cores')
    .then(data => csv.parseAsync(data, { columns: true, auto_parse: true }))
    .then(results => {
        const nodes = {}
        const relationships = {}

        function pushNode(dir, node) {
            nodes[`${dir}/${node.id}`] = node
        }

        function pushRelationship(r) {
            relationships[r.id] = r
        }

        results.map((result, i) => {
            const currentNumber = i+1
            const encounter = {
                id: `encounter-${zygardeCoreId}-${currentNumber}`,
                labels: ['Encounter'],
                data: {
                    name: `Zygarde Core #${currentNumber}`
                }
            }
            const encounterRelationship = {
                id: `${zygardeCoreId}__ENCOUNTERED_AT__${encounter.id}`,
                start: zygardeCoreId,
                type: 'ENCOUNTERED_AT',
                end: encounter.id
            }
            pushNode('encounter/zygarde-core', encounter)
            pushRelationship(encounterRelationship)

            const location = {
                id: nameToId(result.AT_LOCATION),
                labels: ['Location'],
                data: {
                    name: result.AT_LOCATION
                }
            }
            const locationRelationship = {
                id: `${encounter.id}__AT_LOCATION__${location.id}`,
                start: encounter.id,
                type: 'AT_LOCATION',
                end: location.id
            }
            pushNode('location', location)
            pushRelationship(locationRelationship)

            const move = {
                id: nameToId(result.MOVE_LEARNT),
                labels: ['Move'],
                data: {
                    name: result.MOVE_LEARNT
                }
            }
            const moveRelationship = {
                id: `${encounter.id}__MOVE_LEARNT__${move.id}`,
                start: encounter.id,
                type: 'MOVE_LEARNT',
                end: move.id
            }
            pushNode('move', move)
            pushRelationship(moveRelationship)
        })

        const nodeWrites = _.map(nodes, (node, base) => fs.writeFileAsync(
            path.resolve(`./games/pokemon-sun-moon/graph/nodes/${base}.json`),
            JSON.stringify(node, undefined, 2)
        ))

        const relationshipWrites = _.map(relationships, r => fs.writeFileAsync(
            path.resolve(`./games/pokemon-sun-moon/graph/relationships/encounter/zygarde-core/${r.id}.json`),
            JSON.stringify(r, undefined, 2)
        ))

        console.log(`Writing ${nodeWrites.length} nodes, ${relationshipWrites.length} relationships`)
        return Promise.all(nodeWrites.concat(relationshipWrites))
    })
