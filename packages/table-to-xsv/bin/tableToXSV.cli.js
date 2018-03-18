#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const tableToXSV = require('../src/tableToXSV')
const argv = require('minimist')(process.argv.slice(2))

const {
  _: [input],
  output,
  separator = '\t',
  help
} = argv

if (help || !input) {
  console.log()
  console.log('TABLE TO XSV')
  console.log('  Converts a HTML <table> to a X-separated value string.')
  console.log()
  console.log('USAGE')
  console.log(`  node ${path.relative(process.cwd(), __filename)} [options] <path to html>`)
  console.log()
  console.log('OPTIONS')
  console.log('  --separator <string>  : The separator to use. (default: \\t)')
  console.log('  --output <path>       : Output file. (default: stdout)')
  console.log()
  process.exit(help ? 0 : 1)
}

const html = fs.readFileSync(path.resolve(input))

const result = tableToXSV({ separator })(html)

if (output) {
  const resolvedOutput = path.resolve(argv.output)
  console.log(`Writing to ${resolvedOutput}`)
  fs.writeFileSync(resolvedOutput, result)
} else {
  console.log(result)
}
