const path = require('path')
const _ = require('lodash')
const XLSX = require('xlsx')
const { readFile } = require('@frontiernav/filesystem')
const createTransformer = require('./createTransformer')

const log = (...args) => console.log(`[${path.basename(__filename)}]`, ...args)

function readSpreadsheet (filePath) {
  log(`Reading ${filePath}`)
  return readFile(filePath)
}

function transformSpreadsheets (rootPath, contentOrPath) {
  const spreadsheetsPath = path.resolve(rootPath, 'spreadsheets')

  log('Transforming sheets.', spreadsheetsPath)

  const config = require(spreadsheetsPath)
  const transformer = createTransformer(config)

  const getContent = () => {
    return typeof contentOrPath === 'string'
      ? readSpreadsheet(contentOrPath)
      : Promise.resolve(contentOrPath)
  }

  return getContent()
    .then(content => XLSX.read(content))
    .then(workbook => {
      return _(workbook.SheetNames)
        .filter(name => config.schema[name])
        .map(name => ({
          name: name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name])
        }))
        .keyBy('name')
    })
    .then(sheets => {
      return transformer.transform(sheets)
    })
}

module.exports = transformSpreadsheets
