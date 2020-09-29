# Get-ChildItem -Path data\map -Name -Include st* | ForEach-Object { $found = $_ -match 'st(.*)'; ./generate_maps.ps1 -MapNumber $matches[1] }

Param (
    [Parameter(Mandatory=$true)]
    [string]$MapNumber,
    [switch]$Extract = $false,
    [switch]$Convert = $false,
    [switch]$VariantOnly = $false
)

$RootDir = '~\tmp\dragons-dogma'
$TexConvOutput = ($RootDir + '\output\map\' + $MapNumber)
$TileRegex = ('map' + $MapNumber + '_(\d\d\d\d)(.*)_ID.TIF')
$MapOutputFolder = ($RootDir + '\generated_maps')
$BlankTile = ($RootDir + '\blanktile.tif')

C:\Applications\ImageMagick\convert.exe -size 512x512 xc:transparent $BlankTile

New-Item -Path $MapOutputFolder -ItemType Directory -ErrorAction SilentlyContinue

Write-Output 'Allocating tiles.'
$tiles = Get-ChildItem -Path $TexConvOutput |
    ForEach-Object { $_.FullName } |
    Where-Object { $_ -match $TileRegex }

$MapRowCount = 0
$MapColCount = 0
$SparseTileInput = @{}

foreach ($tile in $tiles) {
    $found = $tile -match $TileRegex
    $row = [convert]::ToInt32(($matches[1][0] + $matches[1][1]), 10)
    $col = [convert]::ToInt32(($matches[1][2] + $matches[1][3]), 10) - 1
    $variant = $matches[2]

    if (-Not ($SparseTileInput[$variant])) {
        $SparseTileInput[$variant] = @{}
    }

    if (-Not ($SparseTileInput[$variant][$row])) {
        $SparseTileInput[$variant][$row] = @{}
    }

    $SparseTileInput[$variant][$row][$col] = $tile

    if ($row -gt $MapRowCount) {
        $MapRowCount = $row
    }
    if ($col -gt $MapColCount) {
        $MapColCount = $col
    }
}

$MapRowCount += 1
$MapColCount += 1

foreach ($variant in $SparseTileInput.Keys) {
    $MapOutput = ($MapOutputFolder + '\' + $MapNumber + $variant + '.png')
    if ($VariantOnly -And -Not ($variant) -And (Test-Path $MapOutput -PathType leaf)) {
        Write-Output ('Skipping ' + $MapOutput)
        continue
    }

    Write-Output ('Creating ' + $MapOutput)

    $FallbackVariant = $variant -match '^(.*)[a-z]$'
    $BaseVariant = $matches[1]

    $TileCount = $MapColCount * $MapRowCount
    $TileInput = ,$BlankTile * $TileCount
    foreach ($i in 0..($TileCount - 1)) {
        $row = [convert]::ToInt32([math]::floor($i / $MapColCount), 10)
        $col = [convert]::ToInt32($i % $MapColCount, 10)
        if ($FallbackVariant -And $SparseTileInput[$BaseVariant][$row] -And $SparseTileInput[$BaseVariant][$row][$col]) {
            $TileInput[$i] = $SparseTileInput[$BaseVariant][$row][$col]
        }
        if ($SparseTileInput[$variant][$row] -And $SparseTileInput[$variant][$row][$col]) {
            $TileInput[$i] = $SparseTileInput[$variant][$row][$col]
        }
    }

    $TileLayout = ("$MapColCount" + 'x' + "$MapRowCount")
    C:\Applications\ImageMagick\montage.exe $TileInput -background transparent -geometry +0+0 -tile $TileLayout $MapOutput
}


Write-Output 'Done.'
