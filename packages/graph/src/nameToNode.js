const nameToId = require('./nameToId')

function nameToNode (name, labels = []) {
  return {
    id: nameToId(name),
    labels: labels,
    data: {
      name: name
    }
  }
}
module.exports = nameToNode
