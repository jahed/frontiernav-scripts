const { getGoogleSpreadsheet } = require('@frontiernav/spreadsheets')
const { stampRelationshipId } = require('@frontiernav/graph')
const XLSX = require('xlsx')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const _ = require('lodash')
const {
  sessionId,
  withIdFromName,
  parseLatLng,
  addNodeAction,
  addRelationshipAction,
  addNodeLabelAction,
  addPropertyAction,
  addRelationshipTypeAction,
  addNodeLabelRelationshipAction
} = require('./utils')

const writeFile = promisify(fs.writeFile)

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
  .then(xlsxSheet => ({
    xlsxSheet,
    sheet: XLSX.utils.sheet_to_json(xlsxSheet)
  }))
  .then(({ xlsxSheet, sheet }) => sheet
    .map((row, i) => _(row)
      .set('rowNumber', i + 2) // index starts at 1 and include heading
      .mapKeys((value, key) => key.trim())
      .value()
    )
    .filter(row => !!row['Mira Map Coordinates'])
    .map(row => {
      if (row['Mira Map Coordinates'] === 'YX') {
        row['Mira Map Coordinates'] = '-84.093401, -30.805664'
      }
      return row
    })
    .map((row, i) => {
      const number = i + 1

      // downloadScreenshot({
      //   id: `treasure-${number}`,
      //   xlsxSheet,
      //   row,
      //   columnLetter: 'J'
      // })

      return ({
        mapMarker: withIdFromName({
          labels: { MapMarker: true },
          data: {
            name: `Treasure #${number} (Map Marker)`,
            latLng: parseLatLng(row['Mira Map Coordinates'])
          }
        }),
        treasure: withIdFromName({
          labels: { FieldTreasure: true },
          data: {
            name: `Treasure #${number}`,
            image: `treasures/treasure-${number}.jpg`,
            experience_points: row['EXP'],
            credits: row['Credits'],
            battle_points: row['BP']
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
    addRelationshipTypeAction({
      id: 'FIELD_TREASURE_CONTAINER',
      name: 'Field Treasure Container',
      startLabels: [],
      endLabels: [],
      properties: {}
    }),
    addRelationshipTypeAction({
      id: 'FIELD_SKILL',
      name: 'Field Skill',
      startLabels: [],
      endLabels: [],
      properties: {
        field_skill_level: {
          required: true
        }
      }
    }),
    addNodeLabelAction({
      id: 'FieldTreasureContainer',
      name: 'Field Treasure Container',
      properties: {
        name: { required: true }
      },
      relationshipTypes: {}
    }),
    addNodeLabelAction({
      id: 'FieldSkill',
      name: 'Field Skill',
      properties: {
        name: { required: true }
      },
      relationshipTypes: {}
    }),
    addNodeLabelAction({
      id: 'Item',
      name: 'Item',
      properties: {
        name: { required: true }
      },
      relationshipTypes: {}
    }),
    addNodeLabelAction({
      id: 'FieldTreasure',
      name: 'Field Treasure',
      properties: {
        name: { required: true },
        image: {},
        experience_points: {},
        credits: {},
        battle_points: {}
      },
      relationshipTypes: {
        FIELD_TREASURE_CONTAINER: {
          endLabels: {
            FieldTreasureContainer: true
          }
        },
        FIELD_SKILL: {
          endLabels: {
            FieldSkill: true
          }
        },
        DROPS: {
          endLabels: {
            FNSiteProbe: true,
            Item: true
          }
        }
      }
    }),
    addNodeLabelRelationshipAction({
      relationshipType: {
        id: 'MAP_LINK'
      },
      startLabel: {
        id: 'MapMarker'
      },
      endLabel: {
        id: 'FieldTreasure'
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
