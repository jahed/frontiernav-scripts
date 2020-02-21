let now = Date.now()
const sessionId = `${now}`
const worldSlug = 'xenoblade-chronicles-2'
const { nameToId } = require('@frontiernav/graph')

const withIdFromName = entity => ({
  id: nameToId(entity.data.name),
  ...entity
})

const addEntityAction = entity => ({
  type: '@frontiernav/graph/ADD_ENTITY',
  payload: {
    sessionId,
    worldSlug,
    entity: {
      id: entity.id,
      type: entity.type,
      data: entity.data || {}
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

const addEntityTypeAction = entityType => ({
  type: '@frontiernav/graph/ADD_ENTITY_TYPE',
  payload: {
    sessionId,
    worldSlug,
    entityType
  },
  meta: { createdAt: now++ }
})

const addEntityTypeProperty = ({ entityType, property }) => ({
  type: '@frontiernav/graph/ADD_ENTITY_TYPE_PROPERTY',
  payload: {
    sessionId,
    worldSlug,
    entityType: { id: entityType.id },
    property
  },
  meta: { createdAt: now++ }
})

const addEntityTypeRelationship = ({ relationshipType, startEntityType, endEntityType }) => ({
  type: '@frontiernav/graph/ADD_ENTITY_TYPE_RELATIONSHIP',
  payload: {
    sessionId,
    worldSlug,
    relationshipType: { id: relationshipType.id },
    startEntityType: { id: startEntityType.id },
    endEntityType: { id: endEntityType.id }
  },
  meta: { createdAt: now++ }
})

const addRelationshipTypeProperty = ({ relationshipType, property }) => ({
  type: '@frontiernav/graph/ADD_RELATIONSHIP_TYPE_PROPERTY',
  payload: {
    sessionId,
    worldSlug,
    relationshipType: { id: relationshipType.id },
    property
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
  addEntityAction,
  addRelationshipAction,
  addEntityTypeAction,
  addEntityTypeProperty,
  addEntityTypeRelationship,
  addNodeLabelRelationshipAction,
  addRelationshipTypeProperty
}
