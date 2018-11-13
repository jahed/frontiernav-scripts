const objectify = json => {
  if (Array.isArray(json.labels)) {
    json.labels = json.labels.reduce((acc, label) => {
      acc[label] = true
      return acc
    }, {})
  }
  return json
}

exports.objectify = objectify
