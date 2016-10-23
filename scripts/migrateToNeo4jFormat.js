const _ = require('lodash')
const transformAll = require('./lib/transformAll')

transformAll('./graph', '.json', node => {
    const metadata = {}
    if(node.id) metadata.id = node.id
    if(node.type) metadata.type = node.type
    if(node.labels) metadata.labels = Object.keys(node.labels)

    return _({ metadata })
        .merge(node)
        .omit(['id', 'labels', 'type'])
        .value()
})
