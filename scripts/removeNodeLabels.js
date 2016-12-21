const _ = require('lodash')
const path = require('path')
const transformAll = require('./helpers/transformAll')

removeNodeLabels()

function removeNodeLabels() {
    transformAll('./games/', '.json', ({ object, fileContent, filePath }) => {
        if(!Array.isArray(object.labels)) {
            return object
        }

        const remove = ['XenobladeX', 'XenobladeSeries', 'PokemonSunMoon', 'PokemonSeries']
        return Object.assign({}, object, {
            labels: object.labels.filter(l => remove.indexOf(l) === -1)
        })
    }, i => i)
}
