const _ = require('lodash')

module.exports = function countGraph(graph) {
    return _(graph)
        .mapValues(objects => _.size(objects))
        .toPairs()
        .map(p => _(p).reverse().join(' '))
        .join(', ')
}
