const bluebird = require('bluebird')
const path = require('path')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const _ = require('lodash')

// const columns = [ 'id', 'identifier', 'species_id', 'height', 'weight', 'base_experience', 'order', 'is_default' ]

const regionsPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/regions.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

const regionNamesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/region_names.csv'))
    .then(data => csv.parseAsync(data, { columns: true, auto_parse: true }))

const languagesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/languages.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

Promise
    .all([
        regionsPromise,
        languagesPromise,
        regionNamesPromise
    ])
    .then(results => {
        const regionById = results[0]
        const languageById = results[1]
        const regionNames = results[2]

        const writePromises = _(regionById)
            .map(region => {
                const localesByIso = _(regionNames)
                    .filter(row => {
                        return row.region_id === region.id
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
                    labels: ['Region', 'PokemonSeries'],
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
            .map(region => {
                return fs.writeFileAsync(
                    path.resolve(`./graph/nodes/pokemon/region/${region.id}.json`),
                    JSON.stringify(region, undefined, 2),
                    'utf-8'
                )
            })

        return Promise.all(writePromises)
    })
