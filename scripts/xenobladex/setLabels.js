const _ = require('lodash')
const transformAll = require('../helpers/transformAll')

transformAll('./graph/nodes/xenoblade-x/tyrant', '.json', node => {
    return Object.assign({}, node, {
        labels: ['Tyrant', 'Enemy', 'XenobladeX']
    })
})
