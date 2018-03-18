/* eslint-env mocha */
const path = require('path')
const fs = require('fs')
const assert = require('assert')
const _ = require('lodash')
const Ajv = require('ajv')
const countGraph = require('../../scripts/helpers/countGraph')
const { readObjects, readGraph } = require('@frontiernav/filesystem')

const locales = readObjects('./locales')

fs.readdirSync(path.resolve('games')).forEach(graphTest)

function graphTest (gameId) {
  describe(`Game(${gameId})`, () => {
    const graph = readGraph(`./games/${gameId}/graph`)
    const { nodeLabels, nodes, relationships, relationshipTypes, properties } = graph

    describe(`Graph`, () => {
      it(`read (${countGraph(graph)})`, () => {})

      it('filenames should match assigned IDs', () => {
        const assertIdsMatch = (type, graphObject) => {
          const id = graphObject.content.id
          const filenameWithoutExt = path.basename(graphObject.absoluteFilePath, path.extname(graphObject.absoluteFilePath))
          assert.strictEqual(
            id,
            filenameWithoutExt,
            `${type}(${id}) does not match filename "${graphObject.absoluteFilePath}"`
          )
        }

        _.forEach(graph, (objects, type) => {
          objects.forEach(obj => assertIdsMatch(type, obj))
        })
      })

      it('IDs should be unique', () => {
        const dupes = _(nodes)
          .groupBy('content.id')
          .mapValues(group => group.length)
          .pickBy(length => length > 1)
          .keys()
          .value()

        assert.deepStrictEqual(dupes, [])
      })

      describe('nodes', () => {
        it('labels assigned to nodes should be defined', () => {
          nodes
            .map(node => node.content)
            .forEach(node => {
              node.labels.forEach(labelId => {
                const labelExists = nodeLabels.some(nodeLabel => nodeLabel.content.id === labelId)
                assert.ok(labelExists, `Node(${node.id}) has unknown Label(${labelId})`)
              })
            })
        })

        it('nodes should satisfy their labels', () => {
          const propertiesById = _(properties).keyBy('content.id').value()
          const nodeLabelsById = _(nodeLabels).keyBy('content.id').value()
          const ajv = new Ajv()
          nodes
            .map(node => node.content)
            .forEach(node => {
              node.labels.forEach(labelId => {
                const nodeLabel = nodeLabelsById[labelId].content
                _.forEach(nodeLabel.properties, (config, property) => {
                  const schema = propertiesById[property].content
                  const value = node.data[property]
                  if (config.required || typeof value !== 'undefined') {
                    assert.ok(
                      ajv.validate(schema, value),
                      `Node(${node.id}).${property}(${JSON.stringify(value)}) does not satisfy NodeLabel(${labelId}).${property}(${JSON.stringify(config)}).` +
                                            `\n${ajv.errorsText()}, Property(${JSON.stringify(schema, null, 2)})`
                    )
                  }
                })
              })
            })
        })

        describe('locale', () => {
          it('codes should match locale defined in graph', () => {
            _(nodes)
              .map('content')
              .filter('locale')
              .forEach(node => {
                _.forEach(node.locale, (localeData, code) => {
                  assert.ok(
                    locales.some(locale => locale.content.id === code),
                    `Unknown language code "${code}" found in Node(${node.id})`
                  )
                })
              })
          })

          it('field names should match base data field names', () => {
            _(nodes)
              .map('content')
              .filter('locale')
              .forEach(node => {
                _.forEach(node.locale, (localeData, code) => {
                  const unknownFieldNames = _(localeData)
                    .keys()
                    .filter(fieldName => !node.data[fieldName])
                    .value()

                  assert.deepStrictEqual(unknownFieldNames, [], `Unknown fields found in Node(${node.id})'s "${code}" locale.`)
                })
              })
          })
        })
      })

      describe('relationshipTypes', () => {
        it('labels assigned to RelationshipTypes should be defined', () => {
          const assertLabelsExist = (relationshipType, key) => {
            const labels = relationshipType[key]
            if (!labels) return

            labels.forEach(labelId => {
              const labelExists = nodeLabels.some(nodeLabel => nodeLabel.content.id === labelId)
              assert.ok(labelExists, `RelationshipType(${relationshipType.id}) has unknown ${key}(${labelId})`)
            })
          }

          relationshipTypes
            .map(relationshipType => relationshipType.content)
            .forEach(relationshipType => {
              assertLabelsExist(relationshipType, 'startLabels')
              assertLabelsExist(relationshipType, 'endLabels')
            })
        })

        it('properties assigned to relationshipTypes should be defined', () => {
          const propertiesById = _(properties).keyBy('content.id').value()
          _(relationshipTypes)
            .map(relationshipType => relationshipType.content)
            .pickBy(relationshipType => !!relationshipType.properties)
            .forEach(relationshipType => {
              const unknownProperties = Object.keys(relationshipType.properties).filter(property => !propertiesById[property])
              assert.deepStrictEqual(unknownProperties, [], `RelationshipType(${relationshipType.id}) has unknown properties [${unknownProperties}]`)
            })
        })
      })

      describe('relationships', () => {
        it('nodes assigned to relationships should be defined', () => {
          const nodesById = _(nodes).keyBy('content.id').value()
          relationships
            .map(relationship => relationship.content)
            .forEach(relationship => {
              const nodesExist = nodesById[relationship.start] && nodesById[relationship.end]
              assert.ok(nodesExist, `Relationship(${relationship.id}) has unknown nodes`)
            })
        })

        it('types assigned to relationships should be defined', () => {
          const relationshipTypesById = _(relationshipTypes).keyBy('content.id').value()
          relationships
            .map(relationship => relationship.content)
            .forEach(relationship => {
              const relationshipTypeExists = !!relationshipTypesById[relationship.type]
              assert.ok(relationshipTypeExists, `Relationship(${relationship.id}) has unknown type "${relationship.type}"`)
            })
        })

        it('nodes assigned to relationships should have necessary labels', () => {
          const nodesById = _(nodes).mapValues('content').keyBy('id').value()
          const typesById = _(relationshipTypes).mapValues('content').keyBy('id').value()

          relationships
            .map(relationship => relationship.content)
            .filter(relationship => !!typesById[relationship.type])
            .forEach(relationship => {
              const type = typesById[relationship.type]
              const assertLabels = (node, key) => {
                const hasLabels = !type[key] || type[key].some(labelId => node.labels.indexOf(labelId) !== -1)
                assert.ok(hasLabels, `Relationship(${relationship.id}) needed ${key}(${type[key]}) but got [${node.labels}]`)
              }

              assertLabels(nodesById[relationship.start], 'startLabels')
              assertLabels(nodesById[relationship.end], 'endLabels')
            })
        })

        it('relationships should satisfy their types', () => {
          const propertiesById = _(properties).keyBy('content.id').value()
          const relationshipTypesById = _(relationshipTypes).keyBy('content.id').value()
          const ajv = new Ajv()
          relationships
            .map(relationship => relationship.content)
            .forEach(relationship => {
              const typeId = relationship.type
              const relationshipType = relationshipTypesById[typeId].content
              _.forEach(relationshipType.properties, (config, property) => {
                const schema = propertiesById[property].content
                const value = relationship.data && relationship.data[property]
                if (config.required || typeof value !== 'undefined') {
                  assert.ok(
                    ajv.validate(schema, value),
                    `Relationship(${relationship.id}).${property}(${JSON.stringify(value)}) does not satisfy RelationshipType(${typeId}).${property}(${JSON.stringify(config)}).` +
                                        `\n${ajv.errorsText()}, Property(${JSON.stringify(schema, null, 2)})`
                  )
                }
              })
            })
        })
      })
    })
  })
}
