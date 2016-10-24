const _ = require('lodash')
const transformAll = require('./lib/transformAll')

transformAll('./graph', '.json', node => {
    return _(node.metadata)
        .merge(node)
        .omit(['metadata'])
        .value()
})
