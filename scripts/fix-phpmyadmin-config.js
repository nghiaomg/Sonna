const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing phpMyAdmin Configuration with PHP Auto-Detection...\n');

// Check if PHP is available
function detectPHP() {
  const phpPaths = [
    'C:/sonna/applications/php/8.4',
    'C:/sonna/applications/php/8.3', 
    'C:/sonna/applications/php/8.2',
    'C:/sonna/applications/php/8.1',
    'C:/sonna/applications/php/8.0',
    'C:/sonna/applications/php/7.4',
  ];

  for (const phpPath of phpPaths) {
    if (fs.existsSync(phpPath)) {
      const phpExe = path.join(phpPath, 'php.exe');
      const dllNames = ['php8apache2_4.dll', 'php7apache2_4.dll'];

      for (const dllName of dllNames) {
        const dllPath = path.join(phpPath, dllName);
        if (fs.existsSync(phpExe) && fs.existsSync(dllPath)) {
          const version = path.basename(phpPath);
          console.log(`✅ PHP ${version} detected at: ${phpPath}`);
          return {
            available: true,
            path: phpPath,
            version: version,
            dllName: dllName
          };
        }
      }
    }
  }

  console.log('⚠️ No PHP installation found');
  return { available: false };
}

// Check if phpMyAdmin is available
function detectPhpMyAdmin() {
  const phpMyAdminPath = 'C:/sonna/applications/phpmyadmin';
  const indexPhp = path.join(phpMyAdminPath, 'index.php');
  const configSample = path.join(phpMyAdminPath, 'config.sample.inc.php');

  const available = fs.existsSync(indexPhp) && fs.existsSync(configSample);
  
  if (available) {
    console.log(`✅ phpMyAdmin detected at: ${phpMyAdminPath}`);
  } else {
    console.log('⚠️ phpMyAdmin not found');
  }

  return { available, path: phpMyAdminPath };
}

// Generate Apache configuration
function generateApacheConfig(phpConfig, phpMyAdminConfig) {
  console.log('\n📝 Generating Apache configuration...');

  // Load template
  const templatePath = path.join(__dirname, '../electron/utils/config-templates/apache.conf');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  let config = fs.readFileSync(templatePath, 'utf8');

  // Configure PHP module
  let phpModuleConfig = '# PHP not configured';
  if (phpConfig.available) {
    phpModuleConfig = `
# PHP ${phpConfig.version} Configuration  
LoadModule php_module "${phpConfig.path.replace(/\\/g, '/')}/${phpConfig.dllName}"
AddType application/x-httpd-php .php
PHPIniDir "${phpConfig.path.replace(/\\/g, '/')}/"

# Set index.php as directory index  
# DirectoryIndex already set in main template`;

    console.log(`🐘 PHP module configured for version ${phpConfig.version}`);
  } else {
    console.log('⚠️ Apache configured without PHP module');
  }

  // Configure phpMyAdmin
  let phpMyAdminConfigSection = '# phpMyAdmin not configured';
  if (phpMyAdminConfig.available) {
    if (phpConfig.available) {
      // PHP available - normal phpMyAdmin config
      phpMyAdminConfigSection = `
# ✅ PHP CONFIGURED: ${phpConfig.version} at ${phpConfig.path}
# phpMyAdmin will function properly with PHP module loaded.
# phpMyAdmin Configuration
Alias /phpmyadmin "${phpMyAdminConfig.path.replace(/\\/g, '/')}"

<Directory "${phpMyAdminConfig.path.replace(/\\/g, '/')}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.php
    
    # Handle phpMyAdmin routing
    RewriteEngine On
    
    # Allow files and directories to be accessed directly
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Fallback to index.php for phpMyAdmin routing
    RewriteRule ^(.*)$ index.php [QSA,L]
    
    # Ensure index.php is accessible
    <Files "index.php">
        Require all granted
    </Files>
</Directory>

# Security for phpMyAdmin
<Directory "${phpMyAdminConfig.path.replace(/\\/g, '/')}/libraries">
    Require all denied
</Directory>

<Directory "${phpMyAdminConfig.path.replace(/\\/g, '/')}/setup/lib">
    Require all denied
</Directory>`;

      console.log('✅ phpMyAdmin configured with PHP support');
    } else {
      // PHP not available - requirement page mode
      phpMyAdminConfigSection = `
# ⚠️  WARNING: PHP NOT CONFIGURED
# phpMyAdmin requires PHP to function properly.
# Please install PHP through Sonna to enable phpMyAdmin.
# Without PHP, visiting /phpmyadmin will show requirement page.
# phpMyAdmin Configuration
Alias /phpmyadmin "${phpMyAdminConfig.path.replace(/\\/g, '/')}"

<Directory "${phpMyAdminConfig.path.replace(/\\/g, '/')}">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.html index.php
    
    # Handle phpMyAdmin routing
    RewriteEngine On
    
    # Allow files and directories to be accessed directly
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    
    # Fallback to index.html for requirement page
    RewriteRule ^(.*)$ index.html [QSA,L]
    
    # PHP Not Available - Show Installation Guide
    <Files "*.php">
        ForceType text/plain
        Header set Content-Type "text/html; charset=utf-8"
        Header set X-PHP-Required "true"
    </Files>
</Directory>

# Security for phpMyAdmin
<Directory "${phpMyAdminConfig.path.replace(/\\/g, '/')}/libraries">
    Require all denied
</Directory>

<Directory "${phpMyAdminConfig.path.replace(/\\/g, '/')}/setup/lib">
    Require all denied
</Directory>`;

      console.log('⚠️ phpMyAdmin configured for requirement page mode');
    }
  }

  // Replace template variables
  config = config.replace(/{{APACHE_ROOT}}/g, 'C:/sonna/applications/apache/Apache24');
  config = config.replace(/{{APACHE_PORT}}/g, '80');
  config = config.replace(/{{PHP_MODULE_CONFIG}}/g, phpModuleConfig);
  config = config.replace(/{{PHPMYADMIN_CONFIG}}/g, phpMyAdminConfigSection);

  return config;
}

// Create PHP requirement page
function createPHPRequirementPage(phpMyAdminPath) {
  console.log('📄 Creating PHP requirement page...');

  try {
    // Load HTML template from external file
    const templatePath = path.join(__dirname, '../electron/utils/config-templates/php-requirement-page.html');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`PHP requirement page template not found: ${templatePath}`);
    }
    
    const requirementPageContent = fs.readFileSync(templatePath, 'utf8');

    const requirementPagePath = path.join(phpMyAdminPath, 'index.html');
    fs.writeFileSync(requirementPagePath, requirementPageContent, 'utf8');
    console.log(`✅ PHP requirement page created: ${requirementPagePath}`);

    // Create PHP check endpoint
    const wwwDir = 'C:/sonna/www';
    if (!fs.existsSync(wwwDir)) {
      fs.mkdirSync(wwwDir, { recursive: true });
    }

    const phpCheckContent = `<?php
// PHP availability check endpoint for Sonna
header('Content-Type: text/plain');
echo 'PHP_WORKING_VERSION_' . PHP_VERSION;
?>`;

    const phpCheckPath = path.join(wwwDir, 'sonna-php-check.php');
    fs.writeFileSync(phpCheckPath, phpCheckContent, 'utf8');
    console.log(`✅ PHP check endpoint created: ${phpCheckPath}`);
  } catch (error) {
    console.error('Failed to create PHP requirement page:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Step 1: Detect services
    console.log('🔍 Detecting installed services...\n');
    const phpConfig = detectPHP();
    const phpMyAdminConfig = detectPhpMyAdmin();

    // Step 2: Generate Apache config
    const apacheConfig = generateApacheConfig(phpConfig, phpMyAdminConfig);

    // Step 3: Write Apache config
    const configDir = 'C:/sonna/conf/apache';
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log(`📁 Created config directory: ${configDir}`);
    }

    const configPath = path.join(configDir, 'httpd.conf');
    fs.writeFileSync(configPath, apacheConfig, 'utf8');
    console.log(`📝 Apache config written: ${configPath}`);

    // Step 4: Create PHP requirement page if needed
    if (phpMyAdminConfig.available && !phpConfig.available) {
      createPHPRequirementPage(phpMyAdminConfig.path);
    } else if (phpMyAdminConfig.available && phpConfig.available) {
      // Remove requirement page if PHP is now available
      const requirementPagePath = path.join(phpMyAdminConfig.path, 'index.html');
      if (fs.existsSync(requirementPagePath)) {
        fs.unlinkSync(requirementPagePath);
        console.log('🗑️ Removed PHP requirement page (PHP now available)');
      }
    }

    // Step 5: Summary
    console.log('\n🎉 phpMyAdmin Configuration Fix Complete!\n');

    if (phpConfig.available && phpMyAdminConfig.available) {
      console.log('✅ System Status: Ready for phpMyAdmin');
      console.log('   🌐 Visit: http://localhost/phpmyadmin/');
      console.log('   🐘 PHP will execute .php files correctly');
      console.log('   ✨ phpMyAdmin should work normally');
    } else if (phpMyAdminConfig.available) {
      console.log('⚠️ System Status: PHP Required');
      console.log('   🌐 Visit: http://localhost/phpmyadmin/ (shows requirement page)');
      console.log('   📄 Install PHP through Sonna to enable full functionality');
    } else {
      console.log('❌ System Status: phpMyAdmin Not Found');
      console.log('   📦 Install phpMyAdmin through Sonna first');
    }

  } catch (error) {
    console.error('\n💥 Configuration fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
main(); 