# Sonna - Windows Build Guide

This guide explains how to build Sonna from source code for Windows systems.

## Prerequisites

- **Node.js** (v16 or newer)
- **npm** (included with Node.js)
- **Git** (for cloning the repository)
- **Windows 10/11** (for building Windows installers)

## Quick Build

For a quick build with default settings, run:

```bash
# Clone the repository
git clone https://github.com/nghiaomg/sonna.git
cd sonna

# Install dependencies and build
npm install
npm run build:win
```

The output files will be in the `release` directory.

## Build Options

### One-Click Build

The easiest way to build Sonna is using the included batch script:

```bash
build-windows.bat
```

This script:
1. Creates necessary build directories
2. Copies icon files to the build directory
3. Installs dependencies
4. Builds the application
5. Creates Windows installers
6. Applies icon fixes for proper Windows integration

### Manual Build Steps

If you prefer to build manually:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create Windows icon files**
   ```bash
   npm run create-icons
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

4. **Build Windows installer**
   ```bash
   npm run dist:win
   ```

5. **Apply icon fixes** (important for proper Windows integration)
   ```bash
   npm run fix-icons
   ```

## Output Files

After building, you'll find these files in the `release` directory:

- **Sonna-0.0.1-x64.exe** - Windows installer (64-bit)
- **Sonna-Portable-0.0.1.exe** - Portable version (no installation required)
- **Sonna-0.0.1-x64.zip** - ZIP archive (64-bit)

## Troubleshooting

### Icon Issues

If the application icon doesn't appear correctly in Windows:

1. Make sure the build process completed successfully
2. Try clearing the Windows icon cache:
   ```
   ie4uinit.exe -show
   ```
3. Ensure `public/logo.png` and `public/logo.ico` exist and are valid image files
4. Check that the `build/icons/icon.ico` file was created correctly

### Build Errors

- **"electron-builder command not found"** - Run `npm install -g electron-builder` or use `npx electron-builder`
- **"Failed to create ICO file"** - Make sure the source PNG file exists and is valid
- **"Error: Cannot find module"** - Run `npm install` to ensure all dependencies are installed

## Advanced Configuration

### Customizing the Build

You can customize the build process by editing:

- **electron-builder.json** - Controls packaging options, installer settings, etc.
- **vite.config.ts** - Configure the Vite build process
- **build-windows.bat** - Modify the build script steps

### Icon Requirements

Windows requires icons in multiple sizes for proper display:

- Taskbar: 16x16, 32x32
- Alt+Tab switcher: 32x32, 48x48
- Desktop shortcuts: 48x48
- Start menu: 48x48
- File explorer: 16x16, 32x32, 48x48, 256x256

The build process creates all these sizes automatically from `public/logo.png`.

## System Tray Integration

Sonna includes system tray functionality. When minimized, it will:

1. Hide the main window
2. Show a tray icon in the system tray
3. Display a balloon notification on first minimize
4. Provide a context menu with service controls

To exit the application completely, use the "Quit" option in the tray menu or titlebar dropdown. 