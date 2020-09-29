# Extractors for Dragon's Dogma

## Dependencies

These tools need to be placed under specific directories as the scripts are
hardcoded to them. This might be fixed later.

### texconv

- https://github.com/microsoft/DirectXTex/wiki/Texconv

Place under:

```
C:\Applications\texconv\texconv.exe
```

### ARC Tool

- https://www.romhacking.net/utilities/1232/
- https://residentevilmodding.boards.net/thread/481

Place under:

```
C:\Applications\ARCtool\ARCtool.exe
```

### ImageMagick

- https://imagemagick.org/

Place all of the files under:

```
C:\Applications\ImageMagick
```

## Usage

These scripts assume they're in `~/tmp/dragons-dogma` and run from there, so
copy them over. That's just where they were written. I might fix this later if
needed.

### Extracting Data

1. Copy the files from Dragon's Dogma into a `data` directory.
2. Use `convert_dir.ps1` to extract the `.arc` files and convert the textures
   from `dds` to `tif`.
3. Converted files will be placed in `output`.

### Generating Maps

1. Extract `data/map/mmap_BKmap_ID.arc` and convert the textures to `output/map`.
2. Run `generate_maps.ps1` with the map you want to generate.
    - Some maps have variants like a destroyed building. These will also be
      generated as separate maps.
3. Results will be placed in `generated_maps` as `.png` files.

To generate all of the maps, run:

```ps1
Get-ChildItem -Path data\map -Name -Include st* | ForEach-Object { $found = $_ -match 'st(.*)'; ./generate_maps.ps1 -MapNumber $matches[1] }
```
