const fs = require('fs')
const path = require('path')
const https = require('https')

let downloadChain = Promise.resolve()
const downloadScreenshot = ({ id, xlsxSheet, row, columnLetter }) => {
  downloadChain = downloadChain
    .then(() => new Promise((resolve, reject) => {
      const cellIndex = `${columnLetter}${row.rowNumber}`
      const screenshotCell = xlsxSheet[cellIndex]
      const url = /HYPERLINK\("([^"]+)"/.exec(screenshotCell.f)[1]

      setTimeout(() => {
        const write = fs.createWriteStream(path.resolve(`./.tmp/${id}.jpg`))
        write.on('finish', () => {
          console.log(`Success: ${url}`)
          resolve()
        })
        write.on('error', e => reject(e))

        console.log(`Downloading: ${url}`)
        const req = https.request(url, response => {
          response.on('error', e => reject(e))
          response.pipe(write)
        })
        req.on('error', e => reject(e))
        req.end()
      }, 1000)
    }))
}

module.exports = { downloadScreenshot }
