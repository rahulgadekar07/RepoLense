@echo off
cd /d d:\RepoLense\backend

REM Compute MD5 hash using PowerShell
for /f "tokens=*" %%A in ('powershell -Command "Write-Host ([System.Security.Cryptography.MD5]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes('https://github.com/axios/axios.git')) | ForEach-Object {'{0:x2}' -f $_} | Join-String)"') do set "HASH=%%A"

echo Cache hash for axios: %HASH%

if exist cache\%HASH%.json (
    echo Cache file already exists
) else (
    echo Creating cache file...
    copy cache\mock-axios.json cache\%HASH%.json
    echo Cache file created: cache\%HASH%.json
)

pause
