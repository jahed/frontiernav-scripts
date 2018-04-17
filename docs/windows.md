# Windows

## Maps

### Get max native zooms for each tileset in a folder

```powershell
Get-ChildItem . | Foreach-Object { (Get-ChildItem -Path $_ -Directory).Count - 1}
```