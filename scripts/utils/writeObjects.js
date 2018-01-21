const path = require('path')
const _ = require('lodash')
const bluebird = require('bluebird')
const fs = bluebird.promisifyAll(require('fs'))
const assert = require('assert')
const colors = require('colors/safe')


/**
 * Writes the given graph objects to the appropriate directory. The directory is not created for safety so create it
 * beforehand.
 */
function writeObjects({
    gameId,
    objectType,
    subPath = () => './',
    objects = [],
    overwrite = false
} = {}) {
    assert(gameId, 'gameId is required.')
    assert(objectType, 'objectType is required.')

    const absoluteDir = path.resolve('games', gameId, 'graph', objectType)

    return Promise.all(
        _(objects)
            .map(obj => {
                const filePath = path.resolve(absoluteDir, subPath(obj), `${obj.id}.json`)

                return fs.accessAsync(filePath)
                    .then(
                        () => {
                            if(!overwrite) {
                                return Promise.reject(
                                    new Error(`[IGNORE   ] ${filePath}`)
                                )
                            } else {
                                console.log(colors.yellow(`[OVERWRITE] ${filePath}`))
                            }
                        },
                        () => {
                            console.log(colors.green(`[NEW      ]  ${filePath}`))
                        }
                    )
                    .then(
                        () => {
                            return fs.writeFileAsync(
                                filePath,
                                JSON.stringify(obj, undefined, 2),
                                'utf-8'
                            )
                        },
                        e => {
                            // console.log(colors.gray(e.message))
                        }
                    )
                    .catch(e => console.error(e))
            })
            .value()
    )
}

module.exports = writeObjects