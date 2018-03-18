function stampRelationshipId (r) {
  return {
    ...r,
    id: [r.start, r.type, r.end].join('__')
  }
}

module.exports = stampRelationshipId
