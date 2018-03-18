function promisify (context, functionName) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      context[functionName](...args, (err, result) => {
        if (err) {
          reject(err)
          return
        }

        resolve(result)
      })
    })
  }
}

module.exports = promisify
