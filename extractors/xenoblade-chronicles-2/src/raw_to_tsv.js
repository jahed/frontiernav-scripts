const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')
const { readObjects } = require('@frontiernav/filesystem')
const { tableToXSV } = require('@frontiernav/table-to-xsv')

const inputPath = path.resolve(__dirname, '../data/raw/html')

console.log('Reading files', inputPath)
const result = readObjects(
  inputPath,
  i => i,
  {
    '.html': tableToXSV({ separator: '\t' })
  }
)

const outputPath = path.resolve(__dirname, '../data/tsv')
console.log('Creating output directory', outputPath)
mkdirp.sync(outputPath)

result.map(({ absoluteFilePath, content }) => {
  const absoluteDirname = path.dirname(absoluteFilePath)
  const filename = path.basename(absoluteFilePath, '.html') + '.tsv'
  const relativeDirname = path.relative(inputPath, absoluteDirname)
  const tsvPath = path.resolve(outputPath, relativeDirname, filename)

  console.log('Writing', tsvPath)
  fs.writeFileSync(tsvPath, content)
})

console.log('Done.')
