# FrontierNav Data

[![Travis Build Status](https://img.shields.io/travis/frontiernav/frontiernav-data/master.svg)](https://travis-ci.org/frontiernav/frontiernav-data/branches/master)
[![Dev Dependencies Status](https://img.shields.io/david/dev/frontiernav/frontiernav-data.svg)](https://david-dm.org/frontiernav/frontiernav-data?type=dev)
[![Discord Chat](https://img.shields.io/badge/discord-chat-7289da.svg)](https://discord.gg/crmfAsJ)

The data here is made to work with FrontierNav, however you're free to re-use the data for your own projects. Consider contributing to help fill in the gaps.

There may be data specific to FrontierNav but the plan is to move that data into a different repo so that this repo is strictly representing the video game multi-verse.

Note: The data is currently in a migration phase so it's likely to be restructured. If you have any opinions on it, share!


## Contributions

[Join the project's Discord server so we can discuss!](https://discordapp.com/invite/crmfAsJ)

All contributions are welcome. If you are trying to solve a particular issue or add more data, it'll help if you announce it by creating an [Issue](https://github.com/frontiernav/frontiernav-data/issues) first so that people aren't duplicating work or doing what that has already been discussed.

You have two ways of contributing.

### Option 1

Submit data, assets and guides in any format you want on the Discord server (spreadsheets, text files, etc.). I'll then migrate it on my end.

If you are doing this, it'll help me if your data is consistent and not all over the place. Spreadsheets are usually perfect for organising data easily.

### Option 2

You'll need a bit of experience with Git and GitHub for this option, but it's the most convenient in the long run if you're contributing often. All you have to do is fork this repo and submit pull requests. You'll need to do a bit of research into how the [data is structured](#data-structure) to do this correctly.

If you are contributing with Option 2, I highly recommend a text editor with Global Text Find & Replace which most IDEs and Advanced Text Editors have. This will help with finding where things are used and changing things in bulk. I suggest either [IntelliJ Community Edition](https://www.jetbrains.com/idea/download/) or [Sublime Text](https://www.sublimetext.com/).


## Data Structure

The data is structured as a [Graph](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)). This allows you to do queries like "an item is rewarded for completing this mission which is only activated after going to this location" without explicitly  joining relations.

It's also flexible so items labelled as `Location` can also have additional properties for their own game like `XenobladeX_Location` without needing to introduce more tables/relations as you would in a relational model.

## Type Definitions

Here's an outline of how the data is **planned to be** structured. The current data likely doesn't reflect the structure below as it's still being migrated.

### Unique Identifier (`.id`)

All Objects must have an `.id` to uniquely identify it across the entire graph. Only use alphanumeric characters and hyphens (-). The ID should also be reflected in the filename.


### Property

`Properties` describe specific properties of `Nodes` and `Relationships` that are placed under `.data`.

A `Property` definition has the following fields

- ... Property Definitions are currently not in use but are planned in the future. They might just use JSON Schema definitions.


#### Global Recommended Properties

In most cases, it's worth providing these properties on any type of Object so we don't end up solely relying on IDs.

- `.data.name` - A friendly name for this Object.
- `.data.description` - A short description of this Object.


### NodeLabel

`NodeLabels` define the properties of a `Node`.

- `.id` - In CamelCase
- `.properties[Property*]` - The Properties applicable to any Nodes marked with this NodeLabel

### Node

`Nodes` are anything that exist in the video game multi-verse. They can be games, items, characters, locations, missions, concepts and more.

- `.id` - In kebab-case
- `.labels[NodeLabel*]` - The NodeLabels which apply to this Node

### RelationshipType

A node can relate to another node. Such a relationship is of a certain type. For example, a Game "HAS" a Map. The `RelationshipType` there is `HAS`.

- `.id` - In UPPERCASE_SNAKE_CASE
- `.startLabels[NodeLabel*]` - At least one of these NodeLabels need to be applied to the **start** Node of the Relationship
- `.endLabels[NodeLabel*]`  - At least one of these NodeLabels need to be applied to the **end** Node of the Relationship
- `.properties[Property*]` - The Properties applicable to any Relationships marked with this NodeLabel

### Relationship

Relationships link two nodes together. They are unidirectional. For example, a Game "has" a Map. A Map does not "have" a game. However, we can still tell which Games a Map is "part of" by traversing the "has" relationships backwards instead of having to introduce another `RelationshipType`.

- `.id` - In the format `{Start Node.id}__{RelationshipType.id}__{End Node.id}`
- `.type[RelationshipType]` - The RelationshipType.id with applies to this Relationship
- `.start[Node]` - The start Node.id
- `.end[Node]` - The end Node.id

## File Format

Currently data is only supported in JSON. For consistency, no other file formats will be used.
