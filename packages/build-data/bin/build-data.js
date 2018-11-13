#!/usr/bin/env node
const logger = require('@frontiernav/logger')
const minimist = require('minimist')
const { buildData } = require('../src/buildData')

const log = logger.get(__filename)

Promise.resolve()
  .then(() => minimist(process.argv.slice(2)))
  .then(args => {
    log.info('Building app data...')
    return buildData(args)
  })
  .then(() => {
    log.info('Done.')
  })
