const path = require('path')
const _ = require('lodash')
const XLSX = require('xlsx')
const { readFile } = require('@frontiernav/filesystem')
const createTransformer = require('./createTransformer')
const log = require('@frontiernav/logger').get(__filename)

function readSpreadsheet (filePath) {
  log.info(`reading ${filePath}`)
  return readFile(filePath)
}

function transformSpreadsheets (rootPath, contentOrPath) {
  const spreadsheetsPath = path.resolve(rootPath, 'spreadsheets')

  const config = require(spreadsheetsPath)
  const transformer = createTransformer(config)

  const transformLog = log.child({ name: config.id })

  const getContent = () => {
    return typeof contentOrPath === 'string'
      ? readSpreadsheet(contentOrPath)
      : Promise.resolve(contentOrPath)
  }

  return getContent()
    .then(content => {
      transformLog.info('reading')
      return XLSX.read(content)
    })
    .then(workbook => {
      transformLog.info('parsing')
      return _(workbook.SheetNames)
        .filter(name => config.schema[name])
        .map(name => ({
          name: name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name])
        }))
        .keyBy('name')
        .value()
    })
    .then(sheets => {
      transformLog.info('transforming')
      return transformer.transform(sheets)
    })
}

module.exports = transformSpreadsheets
