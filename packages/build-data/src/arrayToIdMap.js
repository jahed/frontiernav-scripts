const { mapValues, keyBy } = require('lodash')

const arrayToIdMap = rawGraph => mapValues(rawGraph, objs => keyBy(objs, 'id'))

exports.arrayToIdMap = arrayToIdMap
