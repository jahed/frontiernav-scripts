# Migrating JSON to TOML (and back)

Use [Remarshal](https://github.com/dbohdan/remarshal).

From the Remarshal project directory (assuming the project folder is in the same parent directory as `frontiernav-data`):

```sh
find ../frontiernav-data/graph/ -name "*.json" -exec sh -c 'python remarshal.py -if json -of toml "$0" -o "${0%.json}.toml"' {} \;
```

You can change the `find` path to be more specific.

Check to make sure all's good. These numbers should match.

```sh
find ../frontiernav-data/graph/ -name "*.json" | wc -l
find ../frontiernav-data/graph/ -name "*.toml" | wc -l
```

Run the tests. They should fail as you'll have duplicates, i.e. the same thing represented in both JSON and TOML.

You can now delete the JSON files.

```sh
find ../frontiernav-data/graph/ -name "*.json" -exec rm {} \;
```

Re-run the tests and they should pass.

To go back to JSON, just swap the extensions around.
