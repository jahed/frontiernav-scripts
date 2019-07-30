const { getGoogleSpreadsheet } = require('@frontiernav/spreadsheets')
const { nameToId, stampRelationshipId } = require('@frontiernav/graph')
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const _ = require('lodash')

const writeFile = promisify(fs.writeFile)

const parseLatLng = str => {
  const array = str.split(', ').map(n => Number(n))
  return {
    lat: array[0],
    lng: array[1]
  }
}

const getDrops = row => {
  const drops = []

  if (row['Probes']) {
    drops.push(withIdFromName({
      labels: { FNSiteProbe: true },
      data: {
        name: row['Probes']
      }
    }))
  }

  if (row['Other Items']) {
    row['Other Items']
      .split('\n')
      .map(item => withIdFromName({
        labels: { Item: true },
        data: {
          name: item
        }
      }))
      .forEach(item => drops.push(item))
  }

  return drops
}

const withIdFromName = node => ({
  id: nameToId(node.data.name),
  ...node
})

let now = Date.now()
const sessionId = `${now}`
const worldSlug = 'xenoblade-chronicles-x'

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

const addRelationshipTypeEndLabelAction = ({ relationshipType, nodeLabel }) => ({
  type: '@frontiernav/graph/ADD_RELATIONSHIP_TYPE_END_LABEL',
  payload: {
    sessionId,
    worldSlug,
    relationshipType,
    nodeLabel
  },
  meta: { createdAt: now++ }
})

const addRelationshipTypeStartLabelAction = ({ relationshipType, nodeLabel }) => ({
  type: '@frontiernav/graph/ADD_RELATIONSHIP_TYPE_START_LABEL',
  payload: {
    sessionId,
    worldSlug,
    relationshipType,
    nodeLabel
  },
  meta: { createdAt: now++ }
})

const mapLayer = withIdFromName({
  labels: { MapLayer: true },
  data: {
    name: 'Treasures',
    description: 'Treasures in Mira'
  }
})

getGoogleSpreadsheet('1LZorqJvXeT6cZUbgRDc8ZprYhBFASKksRkBV0a6fyJE')
  .then(content => XLSX.read(content))
  .then(workbook => workbook.Sheets['Field Treasures'])
  .then(sheet => XLSX.utils.sheet_to_json(sheet))
  .then(sheet => sheet
    .map((row, i) => _.mapKeys(row, (value, key) => key.trim()))
    .filter(row => !!row['Mira Map Coordinates'] && row['Mira Map Coordinates'] !== 'YX')
    .map((row, i) => {
      return ({
        mapMarker: withIdFromName({
          labels: { MapMarker: true },
          data: {
            name: `Treasure #${i} (Map Marker)`,
            latLng: parseLatLng(row['Mira Map Coordinates'])
          }
        }),
        treasure: withIdFromName({
          labels: { FieldTreasure: true },
          data: {
            name: `Treasure #${i}`,
            experience_points: row['EXP'],
            credits: row['Credits'],
            battle_points: row['BP'],
            notes: row['Special Info'] ? row['Special Info'] : undefined
          }
        }),
        container: withIdFromName({
          labels: { FieldTreasureContainer: true },
          data: {
            name: row['Field Treasure Container']
          }
        }),
        fieldSkill: withIdFromName({
          labels: { FieldSkill: true },
          data: {
            name: row['Field Skill']
          }
        }),
        drops: getDrops(row),
        hasSegment: !!row['Segment Recon Complete'],
        fieldSkillLevel: row['Level']
      })
    })
    .map(nodes => ({
      nodes,
      relationships: {
        markedWith: stampRelationshipId({
          type: 'MARKED_WITH',
          start: mapLayer.id,
          end: nodes.mapMarker.id
        }),
        mapLink: stampRelationshipId({
          type: 'MAP_LINK',
          start: nodes.mapMarker.id,
          end: nodes.treasure.id
        }),
        container: stampRelationshipId({
          type: 'FIELD_TREASURE_CONTAINER',
          start: nodes.treasure.id,
          end: nodes.container.id
        }),
        fieldSkill: stampRelationshipId({
          type: 'FIELD_SKILL',
          start: nodes.treasure.id,
          end: nodes.fieldSkill.id,
          data: {
            field_skill_level: nodes.fieldSkillLevel
          }
        }),
        drops: nodes.drops.map(drop => stampRelationshipId({
          type: 'DROPS',
          start: nodes.treasure.id,
          end: drop.id
        }))
      }
    }))
    .reduce((acc, { nodes, relationships }) => {
      acc.nodes[nodes.mapMarker.id] = nodes.mapMarker
      acc.nodes[nodes.treasure.id] = nodes.treasure
      acc.nodes[nodes.container.id] = nodes.container
      acc.nodes[nodes.fieldSkill.id] = nodes.fieldSkill
      nodes.drops.map(drop => {
        acc.nodes[drop.id] = drop
      })

      acc.relationships[relationships.markedWith.id] = relationships.markedWith
      acc.relationships[relationships.mapLink.id] = relationships.mapLink
      acc.relationships[relationships.container.id] = relationships.container
      acc.relationships[relationships.fieldSkill.id] = relationships.fieldSkill
      relationships.drops.map(drop => {
        acc.relationships[drop.id] = drop
      })

      return acc
    }, { nodes: {}, relationships: {} })
  )
  .then(({ nodes, relationships }) => [
    addPropertyAction({
      id: 'experience_points',
      name: 'Experience Points (EXP)',
      type: 'number'
    }),
    addPropertyAction({
      id: 'credits',
      name: 'Credits',
      type: 'number'
    }),
    addPropertyAction({
      id: 'battle_points',
      name: 'Battle Points (BP)',
      type: 'number'
    }),
    addPropertyAction({
      id: 'field_skill_level',
      name: 'Field Skill Level',
      type: 'number'
    }),
    addNodeLabelAction({
      id: 'FieldTreasure',
      name: 'Field Treasure',
      properties: {
        name: { required: true },
        experience_points: {},
        credits: {},
        battle_points: {},
        notes: {}
      }
    }),
    addNodeLabelAction({
      id: 'FieldTreasureContainer',
      name: 'Field Treasure Container',
      properties: {
        name: { required: true }
      }
    }),
    addNodeLabelAction({
      id: 'FieldSkill',
      name: 'Field Skill',
      properties: {
        name: { required: true }
      }
    }),
    addNodeLabelAction({
      id: 'Item',
      name: 'Item',
      properties: {
        name: { required: true }
      }
    }),
    addRelationshipTypeAction({
      id: 'FIELD_TREASURE_CONTAINER',
      name: 'Field Treasure Container',
      startLabels: ['FieldTreasure'],
      endLabels: ['FieldTreasureContainer'],
      properties: {}
    }),
    addRelationshipTypeAction({
      id: 'FIELD_SKILL',
      name: 'Field Skill',
      startLabels: ['FieldTreasure'],
      endLabels: ['FieldSkill'],
      properties: {
        field_skill_level: {
          required: true
        }
      }
    }),
    addRelationshipTypeEndLabelAction({
      relationshipType: {
        id: 'MAP_LINK'
      },
      nodeLabel: {
        id: 'FieldTreasure'
      }
    }),
    addRelationshipTypeStartLabelAction({
      relationshipType: {
        id: 'DROPS'
      },
      nodeLabel: {
        id: 'FieldTreasure'
      }
    }),
    addRelationshipTypeEndLabelAction({
      relationshipType: {
        id: 'DROPS'
      },
      nodeLabel: {
        id: 'FNSiteProbe'
      }
    }),
    addRelationshipTypeEndLabelAction({
      relationshipType: {
        id: 'DROPS'
      },
      nodeLabel: {
        id: 'Item'
      }
    }),
    addNodeAction(mapLayer),
    addRelationshipAction(stampRelationshipId({
      type: 'HAS',
      start: 'map0',
      end: mapLayer.id,
      data: {
        order: 5
      }
    })),
    ...Object.values(nodes).map(node => addNodeAction(node)),
    ...Object.values(relationships).map(relationship => addRelationshipAction(relationship))
  ])
  .then(result => writeFile(
    path.resolve(`.tmp/changes-${sessionId}.json`),
    JSON.stringify(result, null, 2)
  ))
