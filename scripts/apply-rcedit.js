/**
 * This script applies resource editor changes to the Windows executable
 * to ensure it shows as Sonna instead of Electron in taskbar and other places
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Applying rcedit to Windows executables...');

// Check if rcedit is installed
try {
  execSync('npm list -g rcedit', { stdio: 'ignore' });
} catch (error) {
  console.log('Installing rcedit globally...');
  try {
    execSync('npm install -g rcedit', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install rcedit:', error);
    process.exit(1);
  }
}

// Paths
const RELEASE_DIR = path.resolve(__dirname, '../release');
const RCEDIT_CONFIG = path.resolve(__dirname, '../build/rcedit-config.json');

// Check if release directory exists
if (!fs.existsSync(RELEASE_DIR)) {
  console.error(`❌ Release directory not found: ${RELEASE_DIR}`);
  process.exit(1);
}

// Check if rcedit config exists
if (!fs.existsSync(RCEDIT_CONFIG)) {
  console.error(`❌ rcedit config not found: ${RCEDIT_CONFIG}`);
  process.exit(1);
}

// Find all .exe files in release directory
const findExeFiles = (dir) => {
  const results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findExeFiles(fullPath));
    } else if (file.endsWith('.exe')) {
      results.push(fullPath);
    }
  }
  
  return results;
};

// Apply rcedit to all .exe files
try {
  const exeFiles = findExeFiles(RELEASE_DIR);
  
  if (exeFiles.length === 0) {
    console.warn('⚠️ No .exe files found in release directory');
  } else {
    for (const exeFile of exeFiles) {
      console.log(`Applying rcedit to ${path.basename(exeFile)}...`);
      try {
        execSync(`rcedit "${exeFile}" --set-version-string "ProductName" "Sonna"`);
        execSync(`rcedit "${exeFile}" --set-version-string "FileDescription" "Sonna - Modern Local Development Environment"`);
        execSync(`rcedit "${exeFile}" --set-version-string "CompanyName" "nghiaomg"`);
        execSync(`rcedit "${exeFile}" --set-version-string "LegalCopyright" "Copyright © 2024 nghiaomg"`);
        execSync(`rcedit "${exeFile}" --set-file-version "1.0.0"`);
        execSync(`rcedit "${exeFile}" --set-product-version "1.0.0"`);
        execSync(`rcedit "${exeFile}" --set-icon "${path.resolve(__dirname, '../build/icons/icon.ico')}"`);
        
        console.log(`✅ Applied rcedit to ${path.basename(exeFile)}`);
      } catch (error) {
        console.error(`❌ Failed to apply rcedit to ${path.basename(exeFile)}:`, error.message);
      }
    }
  }
  
  console.log('✅ rcedit application complete!');
} catch (error) {
  console.error('❌ Failed to apply rcedit:', error);
  process.exit(1);
} 