const get = require('lodash/get')

function promisify(context, functionName) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            get(context, functionName).call(context, ...args, (err, result) => {
                if(err) {
                    reject(err)
                    return
                }

                resolve(result)
            })
        })
    }
}

module.exports = promisify