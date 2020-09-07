const bluebird = require('bluebird')
const path = require('path')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const _ = require('lodash')

// const columns = [ 'id', 'identifier', 'species_id', 'height', 'weight', 'base_experience', 'order', 'is_default' ]

const pokemonPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/pokemon.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

const pokemonNamesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/pokemon_species_names.csv'))
    .then(data => csv.parseAsync(data, { columns: true, auto_parse: true }))

const languagesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/languages.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

Promise
    .all([
        pokemonPromise,
        languagesPromise,
        pokemonNamesPromise
    ])
    .then(results => {
        const pokemonById = results[0]
        const languageById = results[1]
        const pokemonNames = results[2]

        const writePromises = _(pokemonById)
            .filter(pokemon => pokemon.is_default === 1) //Remove forms
            .map(pokemon => {
                const localesByIso = _(pokemonNames)
                    .filter(row => {
                        return row.pokemon_species_id === pokemon.species_id
                    })
                    .filter(row => {
                        // Remove romanji/kanji "translations", they're hacks
                        return row.local_language_id !== 2 && row.local_language_id !== 11
                    })
                    .keyBy(row => languageById[`${row.local_language_id}`].iso639)
                    .mapValues(l => _.pick(l, ['name', 'genus']))
                    .value()

                const data = localesByIso['en']
                const locale = _.omit(localesByIso, ['en'])

                const node = {
                    id: pokemon.identifier,
                    labels: ['Pokemon', 'PokemonSeries'],
                    data: Object.assign(
                        {},
                        _(pokemon)
                            .pick(['species_id', 'height', 'weight', 'base_experience'])
                            .value(),
                        data
                    )
                }

                if(!_.isEmpty(locale)) {
                    node.locale = locale
                }

                return node
            })
            .map(pokemon => {
                return fs.writeFileAsync(
                    path.resolve(`./graph/nodes/pokemon/pokemon/${pokemon.id}.json`),
                    JSON.stringify(pokemon, undefined, 2),
                    'utf-8'
                )
            })

        return Promise.all(writePromises)
    })
