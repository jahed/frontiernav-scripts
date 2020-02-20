let now = Date.now()
const sessionId = `${now}`
const worldSlug = 'xenoblade-chronicles-x'
const { nameToId } = require('@frontiernav/graph')

const withIdFromName = node => ({
  id: nameToId(node.data.name),
  ...node
})

const parseLatLng = str => {
  const array = str.split(', ').map(n => Number(n))
  return {
    lat: array[0],
    lng: array[1]
  }
}

const addNodeAction = node => ({
  type: '@frontiernav/graph/ADD_NODE',
  payload: {
    sessionId,
    worldSlug,
    node: {
      id: node.id,
      labels: node.labels,
      data: node.data || {},
      relationships: {}
    }
  },
  meta: { createdAt: now++ }
})

const addRelationshipAction = relationship => ({
  type: '@frontiernav/graph/ADD_RELATIONSHIP',
  payload: {
    sessionId,
    worldSlug,
    relationship: {
      id: relationship.id,
      type: relationship.type,
      start: relationship.start,
      end: relationship.end,
      data: relationship.data || {}
    }
  },
  meta: { createdAt: now++ }
})

const addNodeLabelAction = nodeLabel => ({
  type: '@frontiernav/graph/ADD_NODE_LABEL',
  payload: {
    sessionId,
    worldSlug,
    nodeLabel
  },
  meta: { createdAt: now++ }
})

const addPropertyAction = property => ({
  type: '@frontiernav/graph/ADD_PROPERTY',
  payload: {
    sessionId,
    worldSlug,
    property
  },
  meta: { createdAt: now++ }
})

const addRelationshipTypeAction = relationshipType => ({
  type: '@frontiernav/graph/ADD_RELATIONSHIP_TYPE',
  payload: {
    sessionId,
    worldSlug,
    relationshipType
  },
  meta: { createdAt: now++ }
})

const addNodeLabelRelationshipAction = ({ relationshipType, startLabel, endLabel }) => ({
  type: '@frontiernav/graph/ADD_NODE_LABEL_RELATIONSHIP',
  payload: {
    sessionId,
    worldSlug,
    relationshipType,
    startLabel,
    endLabel
  },
  meta: { createdAt: now++ }
})

module.exports = {
  sessionId,
  worldSlug,
  withIdFromName,
  parseLatLng,
  addNodeAction,
  addRelationshipAction,
  addNodeLabelAction,
  addPropertyAction,
  addRelationshipTypeAction,
  addNodeLabelRelationshipAction
}
