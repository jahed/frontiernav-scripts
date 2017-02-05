module.exports = function nameToId(name) {
    return name.toLowerCase().replace(/[\s\W]/g, '-')
}
