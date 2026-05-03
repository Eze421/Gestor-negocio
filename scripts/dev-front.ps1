Set-Location $PSScriptRoot\..\front

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}

$npmCommand = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npmCommand) {
    $defaultNpm = "C:\Program Files\nodejs\npm.cmd"
    if (Test-Path $defaultNpm) {
        $npmCommand = $defaultNpm
    } else {
        throw "No se encontro npm. Verifica la instalacion de Node.js y el PATH."
    }
}

if (-not (Test-Path node_modules)) {
    & $npmCommand install
}

Start-Job -ScriptBlock {
    Start-Sleep -Seconds 4
    Start-Process "http://127.0.0.1:5173"
} | Out-Null

& $npmCommand run dev
