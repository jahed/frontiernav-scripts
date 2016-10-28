module.exports = function countGraph({ nodeLabels, nodes, relationships, relationshipTypes }) {
    return `${nodeLabels.length} nodeLabels, ${nodes.length} nodes, ${relationships.length} relationships, ${relationshipTypes.length} relationshipTypes`
}
