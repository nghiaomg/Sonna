/**
 * This script creates a proper multi-size Windows ICO file from a PNG image
 * Windows requires multiple sizes for proper display in different contexts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🖼️ Creating Windows ICO file with multiple sizes...');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (error) {
  console.log('Installing sharp package...');
  try {
    execSync('npm install sharp', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install sharp:', error);
    process.exit(1);
  }
}

// Check if to-ico is installed
try {
  require.resolve('to-ico');
} catch (error) {
  console.log('Installing to-ico package...');
  try {
    execSync('npm install to-ico', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install to-ico:', error);
    process.exit(1);
  }
}

// Import packages
const sharp = require('sharp');
const toIco = require('to-ico');

// Paths
const SOURCE_PNG = path.resolve(__dirname, '../public/logo.png');
const BUILD_DIR = path.resolve(__dirname, '../build/icons');
const OUTPUT_ICO = path.resolve(BUILD_DIR, 'icon.ico');

// Create build directory if it doesn't exist
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Required sizes for Windows
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function createIcoFile() {
  try {
    // Check if source PNG exists
    if (!fs.existsSync(SOURCE_PNG)) {
      console.error(`❌ Source PNG not found: ${SOURCE_PNG}`);
      process.exit(1);
    }

    console.log(`Source image: ${SOURCE_PNG}`);
    console.log(`Output ICO: ${OUTPUT_ICO}`);
    
    // Generate PNG files of each size
    const pngBuffers = await Promise.all(
      sizes.map(async (size) => {
        const resizedBuffer = await sharp(SOURCE_PNG)
          .resize(size, size)
          .png()
          .toBuffer();
        
        // Save individual PNG for debugging (optional)
        fs.writeFileSync(path.join(BUILD_DIR, `icon-${size}.png`), resizedBuffer);
        
        return resizedBuffer;
      })
    );
    
    // Convert to ICO
    const icoBuffer = await toIco(pngBuffers);
    
    // Save ICO file
    fs.writeFileSync(OUTPUT_ICO, icoBuffer);
    
    // Also copy to public directory for development
    fs.copyFileSync(OUTPUT_ICO, path.resolve(__dirname, '../public/logo.ico'));
    
    console.log(`✅ Created Windows ICO file with ${sizes.length} sizes: ${sizes.join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to create ICO file:', error);
    process.exit(1);
  }
}

createIcoFile(); 