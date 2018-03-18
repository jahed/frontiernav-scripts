const { JSDOM } = require('jsdom')
const XLSX = require('xlsx')

function tablesToWorkbook () {
  return htmlMap => {
    return Object.keys(htmlMap).reduce(
      (book, sheetName) => {
        const html = htmlMap[sheetName]
        const dom = new JSDOM(html)
        const table = dom.window.document.getElementsByTagName('table')[0]
        const sheet = XLSX.utils.table_to_sheet(table)

        book.SheetNames.push(sheetName)
        book.Sheets[sheetName] = sheet
        return book
      },
      XLSX.utils.book_new()
    )
  }
}

module.exports = tablesToWorkbook
