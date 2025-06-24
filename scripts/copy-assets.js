/**
 * This script copies static assets to the dist directory
 * to ensure they are available in the production build
 */

const fs = require('fs');
const path = require('path');

// Paths
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DIST_DIR = path.resolve(__dirname, '../dist');
const BUILD_ICONS_DIR = path.resolve(__dirname, '../build/icons');

// Make sure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Dist directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

// Assets to copy from public to dist
const assetsToCopy = [
  { src: 'logo.png', dest: 'logo.png' },
  { src: 'logo.ico', dest: 'logo.ico' },
];

// Copy assets
console.log('📦 Copying assets to dist directory...');
assetsToCopy.forEach(asset => {
  const srcPath = path.join(PUBLIC_DIR, asset.src);
  const destPath = path.join(DIST_DIR, asset.dest);
  
  if (fs.existsSync(srcPath)) {
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${asset.src} to ${destPath}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${asset.src}:`, error);
    }
  } else {
    console.warn(`⚠️ Source file not found: ${srcPath}`);
  }
});

// Also copy from build/icons as backup
if (fs.existsSync(BUILD_ICONS_DIR)) {
  try {
    if (fs.existsSync(path.join(BUILD_ICONS_DIR, 'icon.ico'))) {
      fs.copyFileSync(
        path.join(BUILD_ICONS_DIR, 'icon.ico'),
        path.join(DIST_DIR, 'icon.ico')
      );
      console.log('✅ Copied build/icons/icon.ico to dist/icon.ico');
    }
    
    if (fs.existsSync(path.join(BUILD_ICONS_DIR, 'icon.png'))) {
      fs.copyFileSync(
        path.join(BUILD_ICONS_DIR, 'icon.png'),
        path.join(DIST_DIR, 'icon.png')
      );
      console.log('✅ Copied build/icons/icon.png to dist/icon.png');
    }
  } catch (error) {
    console.error('❌ Failed to copy from build/icons:', error);
  }
}

console.log('✅ Assets copied successfully!'); 