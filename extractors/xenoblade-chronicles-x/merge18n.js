const _ = require('lodash')
const transformAll = require('./helpers/transformAll')
const germanNodes = require('../../frontiernav-i18n/locales/graph/nodes.de.json')
const italianNodes = require('../../frontiernav-i18n/locales/graph/nodes.it.json')

transformAll('./graph', '.json', node => {
    addLocale('de', node, germanNodes)
    addLocale('it', node, italianNodes)
    return node
})

function addLocale(locale, node, localeNodes) {
    if(localeNodes[node.id]) {
        const localeNode = localeNodes[node.id]
        if(localeNode.data.name !== node.data.name) {
            node.locale = Object.assign({}, node.locale, {
                [locale]: localeNode.data
            })
        }
    }
}
