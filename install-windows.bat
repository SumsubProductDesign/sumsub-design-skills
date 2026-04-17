@echo off
setlocal enableextensions

REM Sumsub Design Skills - Windows installer
REM Double-click to install or update all design skills into %USERPROFILE%\.claude\skills

set REPO=https://github.com/SumsubProductDesign/sumsub-design-skills
set TARGET=%USERPROFILE%\.claude\skills
set TMP_DIR=%TEMP%\sumsub-skills-install

cd /d "%~dp0"

echo.
echo ======================================
echo   Sumsub Design Skills - Installer
echo ======================================
echo.

REM Check if we're already in the repo (ran from cloned dir) or need to download
if exist "skills" if exist "README.md" goto :usepwd

echo [1/3] Downloading latest skills from GitHub...
if exist "%TMP_DIR%" rmdir /s /q "%TMP_DIR%"
mkdir "%TMP_DIR%"

where git >nul 2>&1
if %errorlevel%==0 (
  git clone --depth 1 %REPO% "%TMP_DIR%\repo" >nul 2>&1
) else (
  REM Fallback to PowerShell if no git
  powershell -NoProfile -Command "Invoke-WebRequest -Uri '%REPO%/archive/refs/heads/main.zip' -OutFile '%TMP_DIR%\repo.zip'"
  powershell -NoProfile -Command "Expand-Archive -Force -Path '%TMP_DIR%\repo.zip' -DestinationPath '%TMP_DIR%'"
  REM GitHub ZIPs extract to sumsub-design-skills-main; rename to repo
  move "%TMP_DIR%\sumsub-design-skills-main" "%TMP_DIR%\repo" >nul
)

set SOURCE_SKILLS=%TMP_DIR%\repo\skills
goto :copyskills

:usepwd
echo [1/3] Using local skills from %CD%
set SOURCE_SKILLS=%CD%\skills

:copyskills
if not exist "%TARGET%" mkdir "%TARGET%"

echo [2/3] Installing skills into %TARGET%
for /d %%D in ("%SOURCE_SKILLS%\*") do (
  echo        - %%~nxD
  if exist "%TARGET%\%%~nxD" rmdir /s /q "%TARGET%\%%~nxD"
  xcopy "%%D" "%TARGET%\%%~nxD" /E /I /Q /Y >nul
)

echo [3/3] Cleaning up
if exist "%TMP_DIR%" rmdir /s /q "%TMP_DIR%"

echo.
echo ======================================
echo   Done!
echo ======================================
echo.
echo Installed skills:
dir /B "%TARGET%"
echo.
echo Restart Claude Desktop to pick up the new skills.
echo Then in the Code tab, type /mockup or /specs-docs to use them.
echo.
pause
