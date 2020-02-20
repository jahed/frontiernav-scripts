const { getGoogleSpreadsheet } = require('@frontiernav/spreadsheets')
const XLSX = require('xlsx')
const _ = require('lodash')
const { downloadScreenshot } = require('./downloadScreenshot')
const { nameToId } = require('@frontiernav/graph')

getGoogleSpreadsheet('1-KQPenpgNtZMKWp9FGM6VtTvyyrTJwjTzNM2gTfsKNM')
  .then(content => XLSX.read(content))
  .then(workbook => workbook.Sheets['Base Camps'])
  .then(xlsxSheet => ({
    xlsxSheet,
    sheet: XLSX.utils.sheet_to_json(xlsxSheet)
  }))
  .then(({ xlsxSheet, sheet }) => sheet
    .map((row, i) => _(row)
      .set('rowNumber', i + 2) // index starts at 1 and include heading
      .mapKeys((value, key) => key.trim())
      .value()
    )
    .filter(row => !!row['Mira Map Coordinates'])
    .map((row, i) => {
      downloadScreenshot({
        id: nameToId(row['Name']),
        xlsxSheet,
        row,
        columnLetter: 'F'
      })
    })
  )
