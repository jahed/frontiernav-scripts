const path = require('path')
const _ = require('lodash')
const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const csv = bluebird.promisifyAll(require('csv'))

function logJson(promise) {
    return promise.then(d => JSON.stringify(d, undefined, 2)).then(console.log)
}

function nameToId(s) {
    return s.toLowerCase().replace(/[\s\W]/g, '-')
}

function nameToNode(name, labels = []) {
    return {
        id: nameToId(name),
        labels: labels.concat(['XenobladeX']),
        data: {
            name: name
        }
    }
}

function writeObjects(dir, objects, options = {}) {
    const absoluteDir = path.resolve(`./graph/`, dir)

    return Promise.all(
        _(objects)
            .map(obj => {
                return fs.writeFileAsync(
                    path.resolve(absoluteDir, `${obj.id}.json`),
                    JSON.stringify(obj, undefined, 2),
                    'utf-8'
                )
            })
            .value()
    )
}

const RESISTANCES = "physical_resistance/beam_resistance/ether_resistance/thermal_resistance/electric_resistance/gravity_resistance"
const DROP_COUNT = 7
const HEAD_MAP = {
    "n=night, hi/lo=high/low, air=flying around, wait=doesn't appear immediately Location": 'location',
    "Continent": "region",
    "Type": "category",
    "Genus": "subcategory",
    "Lv": "level",
    "Exp": "experience",
    "HP": "health",
    "M.Pow": "melee_power",
    "M.Acc": "melee_accuracy",
    "R.Pow": "ranged_power",
    "R.Acc": "ranged_accuracy",
    "Pot.": "potential",
    "Eva": "evasion",
    "Phys/Beam/Eth/Heat/Elec/Grav Res": RESISTANCES,
    "Gear Drops (click link for more details) Wep": "drops_ground_weapon",
    "Armor": "drops_ground_armor",
    "SkellWep": "drops_skell_weapon",
    "SkellArmr": "drops_skell_armor"
}

const MANUFACTURER_MAP = {
    SA: "Sakuraba Industries",
    GG: "Grenada Galactic Group",
    ME: "Meredith & Co.",
    CC: "Candid & Credible",
    SS: "Six Stars",
    OR: "Orphean Technologies"
}

const GEAR_TYPE_MAP = {
    L: "Light Wear",
    M: "Medium Wear",
    H: "Heavy Wear",
    Sk: "Skell Wear",
    B: "BLADE Wear"
}

function hasMultipleGear(v) {
    return v.indexOf(',') !== -1 || v.indexOf('-') === -1
}

function parseGear(v) {
    if(hasMultipleGear(v)) {
        console.log('Multiple gear detected, skipping ' + v)
        return
    }

    const parts = v.split('-')
    const manufacturer = MANUFACTURER_MAP[parts[0].trim()]
    const gearType = GEAR_TYPE_MAP[parts[1].trim()]

    return {
        manufacturer,
        gearType
    }
}

const NUMBER_PROPS = ['level', 'experience', 'health', 'melee_power', 'melee_accuracy', 'ranged_power', 'ranged_accuracy', 'potential', 'evasion']
function parseNumber(enemy, key) {
    if(enemy[key]) {
        const parts = enemy[key].split('~')
        if (parts.length === 1) {
            enemy[key] = Number(enemy[key])
        } else {
            enemy[`${key}_range`] = {
                minimum: Number(parts[0]),
                maximum: Number(parts[1])
            }
            enemy = _.omit(enemy, [key])
        }
    }

    return enemy
}

function hasValue(v) {
    return v !== '---' && v !== ''
}

const csvPromise = fs.readFileAsync(path.resolve('/media/sf_shared/data/bestiary.csv'))

const enemiesPromise = csvPromise
    .then(data => {
        const csvRows = data.toString().split('\n')
        csvRows[0] = _(csvRows[0].substring(1,csvRows[0].length-1).split('","'))
            .map((v, i) => {
                if(i >= 16 && i < 16+DROP_COUNT) {
                    return "drop_" + (i - 16)
                }

                return HEAD_MAP[v] || v.toLowerCase()
            })
            .map(v => `"${v}"`)
            .join(',')

        return csvRows.join('\n')
    })
    .then(data => csv.parseAsync(data, { columns: true }))
    .then(enemies => {
        return _(enemies)
            .map(enemy => {
                return _(enemy)
                    .pickBy(v => hasValue(v))
                    .value()
            })
            .map((enemy, enemyIndex) => {
                const resistMap = {}
                if(enemy[RESISTANCES]) {
                    const resistNames = RESISTANCES.split('/')
                    const resistValues = enemy[RESISTANCES].split('/')
                    Object.assign(resistMap,
                        _(resistValues)
                            .map((v, i) => ({ v, i }))
                            .keyBy(v => resistNames[v.i])
                            .mapValues(v => Number(v.v))
                            .value()
                    )
                }

                NUMBER_PROPS.forEach(numberKey => {
                    enemy = parseNumber(enemy, numberKey)
                })

                if(enemy.name === 'Slovity Pagus') {
                    enemy.name += ' ' + enemyIndex
                }

                if(enemy.name === 'Abyss[?] Vesper') {
                    enemy.name = 'Abyssal Vesper'
                }

                if(enemy.drops_ground_weapon) {
                    enemy.drops_ground_weapon = true
                }

                if(enemy.location) {
                    enemy.notes = `Found at ${enemy.location}`
                }

                enemy.time = 'TBD'
                enemy.weather = 'TBD'

                return _(enemy)
                    .omit(['raw_level', RESISTANCES, "", 'location'])
                    .assign(resistMap)
                    .value()
            })
            // .groupBy(data => nameToId(data.name))
            // .pickBy(v => v.length > 1)
            // .keys()
            .filter('level_range') // Filter enemies without level range (bosses and tyrants)
            .filter(e => ['Odsent', 'Fosdyke', 'Moorehouse', 'Cross Qmoeva', 'Ajiba Falgo', 'Mujiba Falgo', 'Brutal Prone', 'Soldier Chimera'].indexOf(e.name) === -1) // Filter out bosses with level range
            .filter(e => ['Agito, the Golden', 'Roimi, the Affluent', 'Muruse, the Opulent', 'Yuiro, the Luxuriant', 'Dui, the Invaluable', 'Tico, the Precious', 'Hiro, the Priceless', 'Ald, the Extravagant', 'Camus, the Treasured', 'Natt, the Inestimable'].indexOf(e.name) === -1) //tyrants
            .map(data => {
                return {
                    id: nameToId(data.name),
                    labels: ['NormalEnemy', 'Enemy', 'XenobladeX'],
                    data: data
                }
            })
            .keyBy('id')
            .value()
    })


const enemyCategoriesPromise = enemiesPromise
    .then(enemies => {
        return _(enemies)
            .map('data.category')
            .uniq()
            .map(name => nameToNode(name, ['EnemyCategory']))
            .keyBy('id')
            .value()
    })

const enemySubcategoriesPromise = enemiesPromise
    .then(enemies => {
        return _(enemies)
            .map('data.subcategory')
            .uniq()
            .map(name => nameToNode(name, ['EnemySubcategory']))
            .keyBy('id')
            .value()
    })

const regionsPromise = enemiesPromise
    .then(enemies => {
        return _(enemies)
            .map('data.region')
            .uniq()
            .map(name => nameToNode(name, ['Region']))
            .keyBy('id')
            .value()
    })

const materialsPromise = enemiesPromise
    .then(enemies => {
        return _(enemies)
            .flatMap(e => _(e.data).filter((v, k) => k.startsWith('drop_')).value())
            .uniq()
            .map(name => nameToNode(name, ['Material']))
            .keyBy('id')
            .value()
    })

const enemyDropsPromise = enemiesPromise
    .then(enemies => {
        return _(enemies)
            .mapValues(e => _(e.data).filter((v, k) => k.startsWith('drop_')).map(nameToId).value())
            .flatMap((drops, enemyId) => {
                return drops.map(dropId => {
                    return {
                        id: `${enemyId}__DROPS__${dropId}`,
                        type: 'DROPS',
                        start: enemyId,
                        end: dropId
                    }
                })
            })
            .keyBy('id')
            .value()
    })
// enemyDropsPromise.then(n => writeObjects('relationships/xenoblade-x/drops/', n))

// logJson(enemyDropsPromise)

// enemyCategoriesPromise.then(n => writeObjects('nodes/xenoblade-x/enemy-category', n))
// enemySubcategoriesPromise.then(n => writeObjects('nodes/xenoblade-x/enemy-subcategory', n))
// materialsPromise.then(n => writeObjects('nodes/xenoblade-x/material', n))

const enemyNodesPromise = enemiesPromise
    .then(enemies => {
        return _(enemies)
            .mapValues(e => {
                return Object.assign({}, e, {
                    data: _(e.data).omit([
                        'drop_0', 'drop_1', 'drop_2', 'drop_3', 'drop_4', 'drop_5',
                        'region',
                        //Temporary, until they're parsed properly
                        'drops_ground_armor',
                        'drops_skell_weapon',
                        'drops_skell_armor'
                    ]).value()
                })
            })
            .value()
    })

enemyNodesPromise.then(n => writeObjects('nodes/xenoblade-x/normal-enemy', n))
// logJson(enemyNodesPromise)
