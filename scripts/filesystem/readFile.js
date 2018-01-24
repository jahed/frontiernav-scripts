const fs = require('fs')
const promisify = require('../utils/promisify')

module.exports = promisify(fs, 'readFile')