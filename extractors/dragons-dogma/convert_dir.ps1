Param (
    [Parameter(Mandatory=$true)]
    [string]$Target,
    [switch]$Extract = $false,
    [switch]$Convert = $false
)

$RootDir = '~\tmp\dragons-dogma'
$ArchiveDir = ($RootDir + '\data\' + $Target)
$OutputDir = ($RootDir + '\output\' + $Target)

if ($Extract) {
    Write-Output 'Extracting ARC files'
    Get-ChildItem -Path ($ArchiveDir + '\*') -Include *.arc -Recurse | ForEach-Object {
        C:\Applications\ARCtool\ARCtool.exe -dd -tex -texRE6 -alwayscomp -pc -txt -v 7 $_.FullName
    }
}

if ($Convert) {
    Write-Output 'Converting DDS files'
    New-Item -Path $OutputDir -ItemType Directory -ErrorAction SilentlyContinue
    Set-Location $OutputDir
    Get-ChildItem -Path ($ArchiveDir + '\*') -Include *.dds -Recurse | ForEach-Object {
        C:\Applications\texconv\texconv.exe -ft TIF $_.FullName
    }
    Set-Location $RootDir
}

Write-Output 'Done.'
