const fs = require('fs')
const promisify = require('./promisify')

module.exports = promisify(fs, 'writeFile')
