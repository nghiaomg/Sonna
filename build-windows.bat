@echo off
echo ===================================================
echo        SONNA - Windows Build Script
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo [1/8] Creating build directories...
if not exist "build\icons" mkdir build\icons
if not exist "release" mkdir release
if not exist "dist-electron" mkdir dist-electron

echo [2/8] Copying icon files...
copy "public\logo.ico" "build\icons\icon.ico" >nul
copy "public\logo.png" "build\icons\icon.png" >nul

echo [3/8] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)

echo [4/8] Building Electron TypeScript...
call npm run build:electron
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Electron TypeScript
    exit /b 1
)

echo [5/8] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    exit /b 1
)

echo [6/8] Installing rcedit globally (if not installed)...
call npm list -g rcedit >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing rcedit globally...
    call npm install -g rcedit
    if %errorlevel% neq 0 (
        echo WARNING: Failed to install rcedit globally. Icon fixes may not work.
    )
)

echo [7/8] Building Windows installer...
call npx electron-builder --win --config electron-builder.json
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Windows installer
    exit /b 1
)

echo [8/8] Running post-build icon fixes...
node scripts/apply-rcedit.js
if %errorlevel% neq 0 (
    echo WARNING: Post-build icon fixes failed. Icons may not display correctly.
)

echo.
echo ===================================================
echo        Build completed successfully!
echo ===================================================
echo.
echo Installer location: release\Sonna-1.3.1-x64.exe
echo Portable version: release\Sonna-Portable-1.3.1.exe
echo.
echo NOTE: If icons are not displaying correctly in Windows,
echo       you may need to clear the Windows icon cache:
echo       - Close all instances of File Explorer
echo       - Run: ie4uinit.exe -show
echo.
pause 