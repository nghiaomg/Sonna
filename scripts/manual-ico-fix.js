/**
 * This script manually copies and fixes icon issues for Windows
 * It can be run after build to ensure icons are in the right place
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Manually fixing icon issues for Windows...');

// Paths
const SOURCE_ICO = path.resolve(__dirname, '../build/icons/icon.ico');
const RELEASE_DIR = path.resolve(__dirname, '../release');

// Check if source icon exists
if (!fs.existsSync(SOURCE_ICO)) {
  console.error(`❌ Source icon not found: ${SOURCE_ICO}`);
  process.exit(1);
}

// Check if release directory exists
if (!fs.existsSync(RELEASE_DIR)) {
  console.error(`❌ Release directory not found: ${RELEASE_DIR}`);
  process.exit(1);
}

// Find all win-unpacked directories
const findWinUnpacked = (dir) => {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file === 'win-unpacked' || file === 'win-ia32-unpacked') {
        results.push(fullPath);
      } else {
        results.push(...findWinUnpacked(fullPath));
      }
    }
  }
  
  return results;
};

// Copy icon to all win-unpacked directories
try {
  const winUnpackedDirs = findWinUnpacked(RELEASE_DIR);
  
  if (winUnpackedDirs.length === 0) {
    console.warn('⚠️ No win-unpacked directories found');
  } else {
    for (const dir of winUnpackedDirs) {
      // Copy to root directory
      const targetPath = path.join(dir, 'icon.ico');
      fs.copyFileSync(SOURCE_ICO, targetPath);
      console.log(`✅ Copied icon to ${targetPath}`);
      
      // Copy to resources directory
      const resourcesDir = path.join(dir, 'resources');
      if (fs.existsSync(resourcesDir)) {
        const resourcesIconPath = path.join(resourcesDir, 'icon.ico');
        fs.copyFileSync(SOURCE_ICO, resourcesIconPath);
        console.log(`✅ Copied icon to ${resourcesIconPath}`);
        
        // Create icons directory in resources
        const iconsDir = path.join(resourcesDir, 'icons');
        if (!fs.existsSync(iconsDir)) {
          fs.mkdirSync(iconsDir);
        }
        
        // Copy to icons directory
        const iconsIconPath = path.join(iconsDir, 'icon.ico');
        fs.copyFileSync(SOURCE_ICO, iconsIconPath);
        console.log(`✅ Copied icon to ${iconsIconPath}`);
      }
    }
  }
  
  console.log('✅ Icon fix complete!');
} catch (error) {
  console.error('❌ Failed to fix icons:', error);
  process.exit(1);
}
