@echo off
setlocal enableextensions enabledelayedexpansion

REM Sumsub Design Skills - Windows installer
REM Double-click to install or update all design skills into %USERPROFILE%\.claude\skills

set "REPO=https://github.com/SumsubProductDesign/sumsub-design-skills"
set "TARGET=%USERPROFILE%\.claude\skills"
set "TMP_DIR=%TEMP%\sumsub-skills-install"

cd /d "%~dp0"

echo.
echo ======================================
echo   Sumsub Design Skills - Installer
echo ======================================
echo.

REM Check if we're already in the repo (ran from cloned dir) or need to download
if exist "skills\" if exist "README.md" goto usepwd

echo [1/3] Downloading latest skills from GitHub...
if exist "%TMP_DIR%" rmdir /s /q "%TMP_DIR%"
mkdir "%TMP_DIR%"

where git >nul 2>&1
if !errorlevel! equ 0 (
  echo        using git...
  git clone --depth 1 "%REPO%" "%TMP_DIR%\repo" >nul 2>&1
  if !errorlevel! neq 0 (
    echo ERROR: git clone failed. Check your internet connection.
    pause
    exit /b 1
  )
) else (
  echo        git not found, downloading ZIP via PowerShell...
  powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri '%REPO%/archive/refs/heads/main.zip' -OutFile '%TMP_DIR%\repo.zip'"
  if !errorlevel! neq 0 (
    echo ERROR: download failed. Check your internet connection.
    pause
    exit /b 1
  )
  powershell -NoProfile -Command "Expand-Archive -Force -Path '%TMP_DIR%\repo.zip' -DestinationPath '%TMP_DIR%'"
  if !errorlevel! neq 0 (
    echo ERROR: failed to unzip download.
    pause
    exit /b 1
  )
  REM GitHub ZIP extracts to sumsub-design-skills-main; rename to repo
  move /Y "%TMP_DIR%\sumsub-design-skills-main" "%TMP_DIR%\repo" >nul
)

set "SOURCE_SKILLS=%TMP_DIR%\repo\skills"
goto copyskills

:usepwd
echo [1/3] Using local skills from %CD%
set "SOURCE_SKILLS=%CD%\skills"

:copyskills
if not exist "%SOURCE_SKILLS%" (
  echo ERROR: skills folder not found at %SOURCE_SKILLS%
  pause
  exit /b 1
)

if not exist "%TARGET%" mkdir "%TARGET%"

echo [2/3] Installing skills into %TARGET%
for /d %%D in ("%SOURCE_SKILLS%\*") do (
  echo        - %%~nxD
  if exist "%TARGET%\%%~nxD" rmdir /s /q "%TARGET%\%%~nxD"
  xcopy "%%D" "%TARGET%\%%~nxD\" /E /I /Q /Y >nul
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
