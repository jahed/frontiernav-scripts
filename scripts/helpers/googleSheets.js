const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const path = require('path')
const request = bluebird.promisifyAll(require('request'))

function getExportUrl(fileKey, sheetName) {
    return `https://docs.google.com/spreadsheets/d/${fileKey}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
}

function getSheet(fileKey, sheetName) {
    const url = getExportUrl(fileKey, sheetName)
    console.log('Downloading ' + url)
    // return request.getAsync({ url })
    //     .then(response => {
    //         if (response.statusCode !== 200) {
    //             throw new Error(`Request failed with ${response.statusCode}`)
    //         }
    //         return response.body
    //     })

    return fs.readFileAsync(path.resolve('./tmp/data.csv'))
}


module.exports = {
    getSheet
}
