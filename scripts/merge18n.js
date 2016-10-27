const _ = require('lodash')
const transformAll = require('./helpers/transformAll')
const germanNodes = require('../../frontiernav-i18n/locales/graph/nodes.de.json')

transformAll('./graph', '.json', node => {
    addLocale('de', node, germanNodes)
    return node
})

function addLocale(locale, node, localeNodes) {
    if(localeNodes[node.id]) {
        const localeNode = localeNodes[node.id]
        if(localeNode.data.name !== node.data.name) {
            node.locale = {
                [locale]: localeNode.data
            }
        }
    }
}
