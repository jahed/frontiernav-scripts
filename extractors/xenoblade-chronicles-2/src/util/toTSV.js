const _ = require('lodash')

function toTSV ({ objects }) {
  return _(objects)
    .map(row => _(row)
      .map(v => typeof v === 'object' ? JSON.stringify(v) : `${v}`)
      .map(v => v.replace(/"/g, '""'))
      .map(v => `"${v}"`)
      .join('\t')
    )
    .join('\n')
}

module.exports = toTSV
