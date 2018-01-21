const path = require('path')
const _ = require('lodash')
const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))
const { nameToId, stampRelationshipId, nameToNode, createNodeLabel } = require('../utils/IDFactory')
const writeObjects = require('../utils/writeObjects')


function bladeFilter(blade) {
    if(blade.name === 'Dagas (Cavalier Attitude)') {
        return false
    }

    return true
}

const relationshipMap = {
    role: {
        type: 'COMBAT_ROLE',
        endLabels: ['CombatRole']
    },
    element: {
        type: 'ELEMENT',
        endLabels: ['Element']
    },
    weapon: {
        type: 'WEAPON',
        endLabels: ['Weapon']
    },
    gender: {
        type: 'GENDER',
        endLabels: ['Gender']
    },
    liked_type_1: {
        type: 'LIKES',
        endLabels: ['PouchItemCategory'],
        data: {
            order: 1
        }
    },
    liked_type_2: {
        type: 'LIKES',
        endLabels: ['PouchItemCategory'],
        data: {
            order: 2
        }
    },
    liked_item_1: {
        type: 'LIKES',
        endLabels: ['PouchItem'],
        data: {
            order: 1
        }
    },
    liked_item_2: {
        type: 'LIKES',
        endLabels: ['PouchItem'],
        data: {
            order: 2
        }
    },
    skill_a: {
        type: 'FIELD_SKILL',
        endLabels: ['FieldSkill'],
        data: {
            order: 1
        }
    },
    skill_b: {
        type: 'FIELD_SKILL',
        endLabels: ['FieldSkill'],
        data: {
            order: 2
        }
    },
    skill_c: {
        type: 'FIELD_SKILL',
        endLabels: ['FieldSkill'],
        data: {
            order: 3
        }
    }
}

const bladeDataMap = {
    'nia-blade': {
        spoiler: true
    }
}

function bladeEntryToNode(entry) {
    const id = nameToId(entry.name)
   return {
       id: id,
       labels: ['Blade'],
       data: {
           ..._.omitBy(entry, v => v === ''),
           ..._.get(bladeDataMap, id, {})
       }
   }
}

function mapBladeToRelationships(blade) {
    const result = _(blade.data)
        .pickBy((v, k) => relationshipMap[k])
        .map((value, key) => {
            const mapping = relationshipMap[key]
            return {
                relationship: stampRelationshipId({
                    type: mapping.type,
                    data: mapping.data,
                    start: blade.id,
                    end: nameToId(value)
                }),
                endNode: nameToNode(value, mapping.endLabels)
            }
        })
        .value()

    return {
        blade: {
            ...blade,
            data: _.omit(blade.data, Object.keys(relationshipMap))
        },
        relationships: result.map(r => r.relationship),
        endNodes: result.map(r => r.endNode)
    }
}

const bladesCsvPromise = fs.readFileAsync(path.resolve(__dirname, 'csv/blades.csv'))

const resultsPromise = bladesCsvPromise
    .then(data => csv.parseAsync(data, {
        columns: true,
        trim: true
    }))
    .then(data => {
        return _(data)
            .map(blade => _(blade)
                .mapKeys((v, k) => _.snakeCase(k))
                .value()
            )
            .filter(blade => bladeFilter(blade))
            .map(blade => bladeEntryToNode(blade))
            .value()
    })
    .then(blades => blades
        .map(blade => mapBladeToRelationships(blade))
    )
    // .then(data => console.log(JSON.stringify(data, null, 2)))

const gameId = 'xenoblade-chronicles-2'
const overwrite = false

resultsPromise.then(results => {
    const blades = _(results)
        .map(r => r.blade)
        .uniqBy('id')
        .value()

    const relationships = _(results)
        .flatMap(r => r.relationships)
        .uniqBy('id')
        .value()

    const endNodes = _(results)
        .flatMap(r => r.endNodes)
        .uniqBy('id')
        .value()

    const endNodeLabels = _(endNodes)
        .flatMap(n => n.labels)
        .map(id => createNodeLabel({ id: id }))
        .uniqBy('id')
        .value()

    const relationshipTypes = _.values(
        _(relationshipMap)
            .reduce((acc, next) => {
                const current = acc[next.type] || {
                    id: next.type,
                    startLabels: ['Blade'],
                    endLabels: next.endLabels || []
                }

                return {
                    ...acc,
                    [next.type]: {
                        ...current,
                        endLabels: _(current.endLabels)
                            .concat(next.endLabels || [])
                            .uniq()
                            .value()
                    }
                }
            }, {})
    )

    return Promise.all([
        writeObjects({
            gameId: gameId,
            objectType: 'nodes',
            subPath: () => 'blade',
            objects: blades,
            overwrite: overwrite
        }),
        writeObjects({
            gameId: gameId,
            objectType: 'nodes',
            subPath: (obj) => _.kebabCase(obj.labels[0]) || 'other',
            objects: endNodes,
            overwrite: overwrite
        }),
        writeObjects({
            gameId: gameId,
            objectType: 'nodeLabels',
            objects: endNodeLabels,
            overwrite: overwrite
        }),
        writeObjects({
            gameId: gameId,
            objectType: 'relationshipTypes',
            objects: relationshipTypes,
            overwrite: overwrite
        }),
        Promise.all(
            blades
                .map(blade => {
                   return fs.mkdirAsync(path.resolve(
                       './games/xenoblade-chronicles-2/graph/relationships/blade/',
                       blade.id
                   )).catch(() => {})
                })
        )
    ]).then(() => {
        return writeObjects({
            gameId: gameId,
            objectType: 'relationships',
            subPath: obj => `blade/${obj.start}`,
            objects: relationships,
            overwrite: overwrite
        })
    })
})
