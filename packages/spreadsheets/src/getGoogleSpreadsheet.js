const fetch = require('node-fetch')

const getGoogleSpreadsheet = gid => {
  return fetch(`https://docs.google.com/spreadsheets/d/${gid}/export?format=xlsx&id=${gid}`)
    .then(response => {
      if (response.status >= 400) {
        return Promise.reject(
          new Error(`Google Spreadsheets responded with "${response.status}" for "${gid}"`)
        )
      }

      return response.buffer()
    })
}

module.exports = {
  getGoogleSpreadsheet
}
