function stampRelationshipId (r, index) {
  const parts = [r.start, r.type, r.end]
  if (typeof index === 'number') {
    parts.push(index)
  }

  return {
    ...r,
    id: parts.join('__')
  }
}

module.exports = stampRelationshipId
