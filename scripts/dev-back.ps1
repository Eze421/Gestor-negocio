Set-Location $PSScriptRoot\..\back
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload
