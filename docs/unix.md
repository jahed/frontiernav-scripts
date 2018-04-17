# Unix

This document is mainly to list useful how-tos.

## File System

### Removing whitespace from filenames

```bash
for f in *\ *; do mv "$f" "${f// /_}"; done
```

### Iterating through whitespaced filenames

```bash
find "${dir}" -type f | while read file
do
    ./square.sh "${file}"
done
```


### List filenames in a directory

```bash
find ./dir1 -type f -exec basename {} ';'
```