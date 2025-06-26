#!/usr/bin/env node

/**
 * Standalone Apache Configuration Regenerator
 * This script directly creates a corrected Apache configuration
 */

const fs = require('fs');
const path = require('path');

// Simplified constants for script environment
const SONNA_BASE = 'C:/sonna';
const APPLICATIONS_PATH = `${SONNA_BASE}/applications`;
const PHP_VERSIONS = ['8.4', '8.3', '8.2', '8.1', '8.0', '7.4'];

const getPhpPath = (version) => `${APPLICATIONS_PATH}/php/${version}`;
const getPhpConfig = (version) => `${getPhpPath(version)}/php.ini`;

// Function to fix PHP configuration to suppress deprecation warnings
function fixPHPConfiguration() {
  console.log('🐘 Checking and fixing PHP configurations...');
  
  const phpPaths = PHP_VERSIONS.map(version => getPhpPath(version));

  let fixedCount = 0;

  for (const phpPath of phpPaths) {
    if (fs.existsSync(phpPath)) {
      const version = path.basename(phpPath);
      const phpIniPath = getPhpConfig(version);
      
      if (fs.existsSync(phpIniPath)) {
        try {
          let phpIni = fs.readFileSync(phpIniPath, 'utf8');
          let modified = false;
          
          // Fix error_reporting to exclude deprecation warnings
          const originalIni = phpIni;
          phpIni = phpIni.replace(/error_reporting\s*=\s*E_ALL\s*$/gm, 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT');
          phpIni = phpIni.replace(/error_reporting\s*=\s*E_ALL\s*&\s*~E_DEPRECATED\s*&\s*~E_STRICT\s*$/gm, 'error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT');
          
          if (phpIni !== originalIni) {
            fs.writeFileSync(phpIniPath, phpIni, 'utf8');
            console.log(`✅ Fixed PHP configuration: ${phpIniPath}`);
            fixedCount++;
            modified = true;
          } else {
            console.log(`ℹ️ PHP configuration already correct: ${phpIniPath}`);
          }
        } catch (error) {
          console.error(`❌ Failed to fix PHP config at ${phpIniPath}:`, error.message);
        }
      }
    }
  }
  
  if (fixedCount > 0) {
    console.log(`✅ Fixed ${fixedCount} PHP configuration(s) to suppress deprecation warnings`);
    console.log('🔄 Please restart Apache for changes to take effect');
  } else {
    console.log('ℹ️ No PHP configurations needed fixing');
  }
}

function regenerateApacheConfig() {
  console.log('🔧 Regenerating Apache Configuration');
  console.log('=====================================');
  
  // Check if phpMyAdmin is installed
  const phpMyAdminPath = `${APPLICATIONS_PATH}/phpmyadmin`;
  const hasPhpMyAdmin = fs.existsSync(phpMyAdminPath);
  
  // Enhanced PHP detection with multiple fallbacks
  function detectPHP() {
    console.log('🔍 Running enhanced PHP detection...');
    
    // First try: Direct version paths
    const phpPaths = PHP_VERSIONS.map(version => getPhpPath(version));

    for (const phpPath of phpPaths) {
      if (fs.existsSync(phpPath)) {
        const phpExe = path.join(phpPath, 'php.exe');
        const dllNames = ['php8apache2_4.dll', 'php7apache2_4.dll'];

        for (const dllName of dllNames) {
          const dllPath = path.join(phpPath, dllName);
          if (fs.existsSync(phpExe) && fs.existsSync(dllPath)) {
            const version = path.basename(phpPath);
            console.log(`✅ PHP ${version} detected at: ${phpPath} (${dllName})`);
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

    // Second try: Scan all subdirectories
    const phpBaseDir = `${APPLICATIONS_PATH}/php`;
    if (fs.existsSync(phpBaseDir)) {
      console.log('🔍 Scanning PHP subdirectories...');
      const phpDirs = fs.readdirSync(phpBaseDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const phpDirName of phpDirs) {
        const phpPath = getPhpPath(phpDirName);
        const phpExe = path.join(phpPath, 'php.exe');

        if (fs.existsSync(phpExe)) {
          const dllNames = ['php8apache2_4.dll', 'php7apache2_4.dll'];

          for (const dllName of dllNames) {
            const dllPath = path.join(phpPath, dllName);
            if (fs.existsSync(dllPath)) {
              console.log(`✅ PHP ${phpDirName} detected at: ${phpPath} (${dllName})`);
              return {
                available: true,
                path: phpPath,
                version: phpDirName,
                dllName: dllName
              };
            }
          }
        }
      }
    }

    console.log('⚠️ No PHP installation found');
    return { available: false };
  }
  
  const phpConfig = detectPHP();
  
  let phpMyAdminConfig = '# phpMyAdmin not configured';
  
  if (hasPhpMyAdmin) {
    console.log('📋 phpMyAdmin detected, adding configuration...');
    phpMyAdminConfig = `
# phpMyAdmin Configuration
Alias /phpmyadmin "${phpMyAdminPath.replace(/\\/g, '/')}"

<Directory "${phpMyAdminPath.replace(/\\/g, '/')}">
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
<Directory "${phpMyAdminPath.replace(/\\/g, '/')}/libraries">
    Require all denied
</Directory>

<Directory "${phpMyAdminPath.replace(/\\/g, '/')}/setup/lib">
    Require all denied
</Directory>`;
  }
  
  const apacheConfigTemplate = `# Apache Configuration Template for Sonna
# This file will be used to generate Apache httpd.conf

# Basic Server Configuration
ServerRoot "C:/sonna/applications/apache/Apache24"
ServerName localhost:80
Listen 80

# Module Loading
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule authz_host_module modules/mod_authz_host.so
LoadModule authz_user_module modules/mod_authz_user.so
LoadModule authn_core_module modules/mod_authn_core.so
LoadModule authn_file_module modules/mod_authn_file.so
LoadModule authz_groupfile_module modules/mod_authz_groupfile.so
LoadModule auth_basic_module modules/mod_auth_basic.so
LoadModule access_compat_module modules/mod_access_compat.so
LoadModule alias_module modules/mod_alias.so
LoadModule deflate_module modules/mod_deflate.so
LoadModule dir_module modules/mod_dir.so
LoadModule env_module modules/mod_env.so
LoadModule expires_module modules/mod_expires.so
LoadModule headers_module modules/mod_headers.so
LoadModule mime_module modules/mod_mime.so
LoadModule negotiation_module modules/mod_negotiation.so
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule setenvif_module modules/mod_setenvif.so
LoadModule ssl_module modules/mod_ssl.so
LoadModule log_config_module modules/mod_log_config.so

# PHP Module (will be enabled when PHP is installed)
# PHP not configured

# Document Root
DocumentRoot "C:/sonna/www"

# Directory Configuration
<Directory "C:/sonna/www">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    DirectoryIndex index.html index.htm index.php
</Directory>

# Security Configuration
<Files ".ht*">
    Require all denied
</Files>

<Files "*.ini">
    Require all denied
</Files>

# MIME Types
TypesConfig conf/mime.types

# phpMyAdmin Configuration
${phpMyAdminConfig}

# Error and Access Logs
ErrorLog logs/error.log
LogLevel warn
LogFormat '%h %l %u %t "%r" %>s %b "%{Referer}i" "%{User-Agent}i"' combined
CustomLog logs/access.log combined

# Server Information
ServerTokens Prod
ServerSignature Off`;

  try {
    const apacheConfigPath = `${APPLICATIONS_PATH}/apache/Apache24/conf/httpd.conf`;
    const apacheConfigDir = path.dirname(apacheConfigPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(apacheConfigDir)) {
      console.log('📁 Creating Apache config directory...');
      fs.mkdirSync(apacheConfigDir, { recursive: true });
    }
    
    // Write corrected configuration
    console.log('✏️  Writing corrected Apache configuration...');
    fs.writeFileSync(apacheConfigPath, apacheConfigTemplate, 'utf8');
    
    console.log('✅ Apache configuration regenerated successfully!');
    console.log('📍 Location:', apacheConfigPath);
    
    // Verify the LogFormat
    const content = fs.readFileSync(apacheConfigPath, 'utf8');
    const logFormatLine = content.split('\n').find(line => line.includes('LogFormat'));
    if (logFormatLine) {
      console.log('🔍 LogFormat verified:', logFormatLine.trim());
    }
    
    console.log('');
    console.log('🎉 Apache configuration fix completed!');
    
    // Also fix PHP configurations to suppress deprecation warnings
    fixPHPConfiguration();
    
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart Sonna application');
    console.log('2. Start Apache service');
    console.log('3. Access http://localhost/phpmyadmin/');
    
  } catch (error) {
    console.error('❌ Failed to regenerate Apache configuration:', error);
    console.log('');
    console.log('Please check file permissions and try again.');
  }
}

regenerateApacheConfig(); 