const IGNORED_BLADES = {
  'Dagas (Cavalier Attitude)': true
}

const notIgnoredBlade = name => !IGNORED_BLADES[name]

module.exports = {
  'Blades': row => notIgnoredBlade(row.Name),
  'Blade Affinity Rewards': row => notIgnoredBlade(row.Blade)
}
