function idToLabelName (id) {
  return id.replace(/([a-z])([A-Z])/g, '$1 $2')
}

module.exports = idToLabelName
