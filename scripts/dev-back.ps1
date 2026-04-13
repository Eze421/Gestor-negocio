Set-Location $PSScriptRoot\..\back
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -e .[dev]
uvicorn app.main:app --reload
