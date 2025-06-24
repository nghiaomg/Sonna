@echo off
echo ======================================
echo Building Sonna for Windows
echo ======================================

echo.
echo [1/4] Installing dependencies...
call npm install

echo.
echo [2/4] Building TypeScript and frontend...
call npm run build

echo.
echo [3/4] Building Windows installer...
call npm run dist:win

echo.
echo [4/4] Build complete!
echo.
echo Output files are in the 'release' directory:
echo - Sonna-1.0.0-x64.exe (Windows 64-bit installer)
echo - Sonna-1.0.0-ia32.exe (Windows 32-bit installer)
echo - Sonna-1.0.0-portable.exe (Portable version)
echo - Sonna-1.0.0-x64.zip (ZIP archive 64-bit)
echo - Sonna-1.0.0-ia32.zip (ZIP archive 32-bit)
echo.

pause 