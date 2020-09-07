const bluebird = require('bluebird')
const path = require('path')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const _ = require('lodash')

// const columns = [ 'id', 'identifier', 'species_id', 'height', 'weight', 'base_experience', 'order', 'is_default' ]

const locationsPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/locations.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

const locationNamesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/location_names.csv'))
    .then(data => csv.parseAsync(data, { columns: true, auto_parse: true }))

const languagesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/languages.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

Promise
    .all([
        locationsPromise,
        languagesPromise,
        locationNamesPromise
    ])
    .then(results => {
        const locationById = results[0]
        const languageById = results[1]
        const locationNames = results[2]

        const writePromises = _(locationById)
            .filter(location => !!location.region_id) // Some locations are hacks (real-world event locations)
            .map(region => {
                const localesByIso = _(locationNames)
                    .filter(row => {
                        return row.location_id === region.id
                    })
                    .filter(row => {
                        // Remove romanji/kanji "translations", they're hacks
                        return row.local_language_id !== 2 && row.local_language_id !== 11
                    })
                    .keyBy(row => languageById[`${row.local_language_id}`].iso639)
                    .mapValues(l => _.pick(l, ['name']))
                    .value()

                const data = localesByIso['en']
                const locale = _.omit(localesByIso, ['en'])

                const node = {
                    id: region.identifier,
                    labels: ['Location', 'PokemonSeries'],
                    data: Object.assign(
                        {},
                        _(region)
                            .pick([])
                            .value(),
                        data
                    )
                }

                if(!_.isEmpty(locale)) {
                    node.locale = locale
                }

                return node
            })
            .map(node => {
                return fs.writeFileAsync(
                    path.resolve(`./graph/nodes/pokemon/location/${node.id}.json`),
                    JSON.stringify(node, undefined, 2),
                    'utf-8'
                )
            })

        return Promise.all(writePromises)
    })
