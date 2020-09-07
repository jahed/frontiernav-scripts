const bluebird = require('bluebird')
const path = require('path')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const _ = require('lodash')

// const columns = [ 'id', 'identifier', 'species_id', 'height', 'weight', 'base_experience', 'order', 'is_default' ]

const locationsPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/locations.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

const regionsPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/regions.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

Promise
    .all([
        locationsPromise,
        regionsPromise
    ])
    .then(results => {
        const locationById = results[0]
        const regionById = results[1]

        const writePromises = _(locationById)
            .filter(location => !!location.region_id) // Some locations are hacks (real-world event locations)
            .map(location => {
                const region = regionById[location.region_id]
                return {
                    id: `${region.identifier}__CONTAINS__${location.identifier}`,
                    start: region.identifier,
                    end: location.identifier,
                    type: 'CONTAINS'
                }
            })
            .map(node => {
                return fs.writeFileAsync(
                    path.resolve(`./graph/relationships/pokemon/region-locations/${node.id}.json`),
                    JSON.stringify(node, undefined, 2),
                    'utf-8'
                )
            })
            .value()

        return Promise.all(writePromises)
    })
