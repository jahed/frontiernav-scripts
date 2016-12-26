const bluebird = require('bluebird')
const path = require('path')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const _ = require('lodash')

// const columns = [ 'id', 'identifier', 'species_id', 'height', 'weight', 'base_experience', 'order', 'is_default' ]

const itemsPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/items.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

const itemNamesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/item_names.csv'))
    .then(data => csv.parseAsync(data, { columns: true, auto_parse: true }))

const itemDescriptionsPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/item_prose.csv'))
    .then(data => csv.parseAsync(data, { columns: true, auto_parse: true }))

const languagesPromise = fs.readFileAsync(path.resolve('../pokedex/pokedex/data/csv/languages.csv'))
    .then(data => csv.parseAsync(data, { columns: true, objname: 'id', auto_parse: true }))

Promise
    .all([
        itemsPromise,
        languagesPromise,
        itemNamesPromise,
        itemDescriptionsPromise
    ])
    .then(results => {
        const itemById = results[0]
        const languageById = results[1]
        const itemNames = results[2]
        const itemDescriptions = results[3]

        const writePromises = _(itemById)
            .map(item => {
                const nameLocalesByIso = _(itemNames)
                    .filter(itemNameRow => {
                        return itemNameRow.item_id === item.id
                    })
                    .filter(itemNameRow => {
                        // Remove romanji/kanji "translations", they're hacks
                        return itemNameRow.local_language_id !== 2 && itemNameRow.local_language_id !== 11
                    })
                    .keyBy(itemNameRow => languageById[`${itemNameRow.local_language_id}`].iso639)
                    .mapValues(l => _.pick(l, ['name']))
                    .value()

                const descriptionLocalesByIso = _(itemDescriptions)
                    .filter(row => {
                        return row.item_id === item.id
                    })
                    .filter(row => {
                        // Remove romanji/kanji "translations", they're hacks
                        return row.local_language_id !== 2 && row.local_language_id !== 11
                    })
                    .keyBy(row => languageById[`${row.local_language_id}`].iso639)
                    .mapValues(l => ({
                        summary: l.short_effect && l.short_effect.replace(/\[([^\]]+)\]\{[^\]+]+\}/g, '$1'),
                        description: l.effect && l.effect.replace(/\[([^\]]+)\]\{[^\]+]+\}/g, '$1')
                    }))
                    .value()

                const data = Object.assign({}, nameLocalesByIso['en'], descriptionLocalesByIso['en'])
                const locale = Object.assign({}, _.omit(nameLocalesByIso, ['en']), _.omit(descriptionLocalesByIso, ['en']))

                const node = {
                    id: item.identifier,
                    labels: ['Item'],
                    data: Object.assign(
                        {},
                        _(item)
                            .pick(['cost'])
                            .value(),
                        data
                    )
                }

                if(!_.isEmpty(locale)) {
                    node.locale = locale
                }

                return node
            })
            .map(item => {
                return fs.writeFileAsync(
                    path.resolve(`./games/pokemon-sun-moon/graph/nodes/item/${item.id}.json`),
                    JSON.stringify(item, undefined, 2),
                    'utf-8'
                )
            })

        return Promise.all(writePromises)
    })
