param([string]$PythonPath = 'python')
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $ProjectRoot
$RunId = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
$RunFolder = Join-Path $ProjectRoot "outputs/verification/$RunId"
New-Item -ItemType Directory -Path $RunFolder -Force | Out-Null
$Results = [System.Collections.Generic.List[object]]::new()
function Invoke-Check([string]$Name, [string]$Program, [string[]]$Arguments) {
    $Started = [DateTime]::UtcNow
    $Log = & $Program @Arguments 2>&1
    $Code = $LASTEXITCODE
    $Log | Out-File -LiteralPath (Join-Path $RunFolder "$Name.log") -Encoding utf8
    $Results.Add([pscustomobject]@{name=$Name;exitCode=$Code;startedAt=$Started.ToString('o');elapsedSeconds=([DateTime]::UtcNow-$Started).TotalSeconds;log="$Name.log"})
    Write-Host "$Name exit=$Code"
    if ($Code -ne 0) {throw "$Name failed; inspect its log."}
}
try {
    Invoke-Check 'bundle' 'node' @('tests/bundle-core.mjs')
    $JsTests = @(Get-ChildItem -LiteralPath tests -Filter '*.test.mjs' | ForEach-Object { $_.FullName })
    Invoke-Check 'core-tests' 'node' (@('--test') + $JsTests)
    Invoke-Check 'typecheck' 'node' @('node_modules/typescript/bin/tsc','--noEmit')
    Invoke-Check 'research-tests' $PythonPath @('-m','unittest','discover','-s','tests','-p','test_*.py')
    Invoke-Check 'corpus-audit' $PythonPath @('pipeline/audit.py')
    Invoke-Check 'reproduce' $PythonPath @('pipeline/reproduce.py')
    Invoke-Check 'build' 'node' @('node_modules/next/dist/bin/next','build')
    Invoke-Check 'production-admin-http' 'node' @('tests/admin-http.mjs')
} finally {
    [pscustomobject]@{runId=$RunId;scope='Core, research reproduction and production administrative API; separate browser and Claudable checks required';checks=$Results.ToArray()} | ConvertTo-Json -Depth 8 | Out-File -LiteralPath (Join-Path $RunFolder 'report.json') -Encoding utf8
    Pop-Location
    Write-Host "Evidence: $RunFolder/report.json"
}
