const bluebird = require('bluebird')
const path = require('path')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const _ = require('lodash')
const googleSheets = require('../helpers/googleSheets')
const nameToId = require('../helpers/nameToId')

// const columns = [ 'id', 'identifier', 'species_id', 'height', 'weight', 'base_experience', 'order', 'is_default' ]

const zygardeCellId = 'zygarde-cell'

googleSheets.getSheet('1hwBrlBbnQQ1YgJGYKPjZ8Fm3iRLSzBmho8Wwg8byzcc', 'Zygarde Cells')
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
                id: `encounter-${zygardeCellId}-${currentNumber}`,
                labels: ['Encounter'],
                data: {
                    name: `Zygarde Cell #${currentNumber}`
                }
            }
            const encounterRelationship = {
                id: `${zygardeCellId}__ENCOUNTERED_AT__${encounter.id}`,
                start: zygardeCellId,
                type: 'ENCOUNTERED_AT',
                end: encounter.id
            }
            pushNode('encounter/zygarde-cell', encounter)
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

            if(result.AT_TIME) {
                const time = {
                    id: nameToId(result.AT_TIME),
                    labels: ['Time'],
                    data: {
                        name: result.AT_TIME
                    }
                }
                const timeRelationship = {
                    id: `${encounter.id}__AT_TIME__${time.id}`,
                    start: encounter.id,
                    type: 'AT_TIME',
                    end: time.id
                }
                pushNode('time', time)
                pushRelationship(timeRelationship)
            }
        })

        const nodeWrites = _.map(nodes, (node, base) => fs.writeFileAsync(
            path.resolve(`./games/pokemon-sun-moon/graph/nodes/${base}.json`),
            JSON.stringify(node, undefined, 2)
        ))

        const relationshipWrites = _.map(relationships, r => fs.writeFileAsync(
            path.resolve(`./games/pokemon-sun-moon/graph/relationships/encounter/zygarde-cell/${r.id}.json`),
            JSON.stringify(r, undefined, 2)
        ))

        console.log(`Writing ${nodeWrites.length} nodes, ${relationshipWrites.length} relationships`)
        return Promise.all(nodeWrites.concat(relationshipWrites))
    })
