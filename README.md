# FrontierNav Data

The data here is made to work with FrontierNav, however you're free to re-use the data for your own projects. Consider contributing to help fill in the gaps.

There may be data specific to FrontierNav but the plan is to move that data into a different repo so that this repo is strictly representing the video game multi-verse.

Note: The data is currently in a migration phase so it's likely to be restructured. If you have any opinions on it, share!


## Contributions

All contributions are welcome. Simply fork the repo and submit pull requests. If you are trying to solve a particular issue or add more data, it'll help if you announce it by creating an Issue first so that people aren't duplicating work or doing what that has already been discussed.

If you're confused by how the data is structured, you can just provide the data however you want and someone else can transform it to the right format.

If you are contributing, I highly recommend a text editor with Global Text Find & Replace which most IDEs and Advanced Text Editors have.
This will help with finding where things are used and changing things in bulk.
I suggest either [IntelliJ Community Edition](https://www.jetbrains.com/idea/download/) or [Sublime Text](https://www.sublimetext.com/).

## Data Structure

The data is structured as a [Graph](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)) and is similar to Neo4j's model. This allows you to do queries like "an item is rewarded for completing this mission which is only activated after going to this location" without explicit joins.

It's also flexible so items labelled as `Location` can also have additional properties for their own game like `XenobladeX_Location` without needing to introduce more tables/relations as you would in a relational model.

## Type Definitions

Here's an outline of how the data is **planned to be** structured. The current data likely doesn't reflect the structure below as it's still being migrated.

### Unique Identifier (`.id`)

All Objects must have an `.id` to uniquely identify it across the entire graph. Only use alphanumeric characters and hyphens (-). The ID should also be reflected in the filename.


### Property

`Properties` describe specific properties of `Nodes` and `Relationships` that are placed under `.data`.

A `Property` definition has the following fields

- ... Property Definitions are currently not in use but are planned in the future. They might just use JSON Schema definitions.


#### Global Recommended properties

In most cases, it's worth providing these properties on any type of Object so we don't end up solely relying on IDs.

- `.data.name` - The friendly name of this Object.
- `.data.description` - A short description of this Object.


### NodeLabel

`NodeLabels` define the properties of a `Node`.

- `.properties[Property*]`

### Node

`Nodes` are anything that exist in the video game multi-verse. They can be games, items, characters, locations, missions, concepts and more.

- `.labels[NodeLabel*]`

### RelationshipType

A node can relate to another node. Such a relationship is of a certain type. For example, a Game "has" a Map. The `RelationshipType` there is `has`.

- `.properties[Property*]`

### Relationship

Relationships link two nodes together. They are unidirectional. For example, a Game "has" a Map. A Map does not "have" a game. However, we can still tell which Games a Map is "part of" by traversing the "has" relationships backwards instead of having to introduce another `RelationshipType`.

- `.type[RelationshipType`
- `.start[Node]`
- `.end[Node]`

## File Format

Currently data is only supported in JSON. YAML and TOML support coming soon.
