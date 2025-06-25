#!/usr/bin/env node

/**
 * Standalone Apache Configuration Regenerator
 * This script directly creates a corrected Apache configuration
 */

const fs = require('fs');
const path = require('path');

function regenerateApacheConfig() {
  console.log('🔧 Regenerating Apache Configuration');
  console.log('=====================================');
  
  // Check if phpMyAdmin is installed
  const phpMyAdminPath = 'C:/sonna/applications/phpmyadmin';
  const hasPhpMyAdmin = fs.existsSync(phpMyAdminPath);
  
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
    const apacheConfigPath = 'C:/sonna/applications/apache/Apache24/conf/httpd.conf';
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