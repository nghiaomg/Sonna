const http = require('http');

console.log('🧪 Final Test: phpMyAdmin Error Suppression');
console.log('============================================');

const testPhpMyAdmin = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 80,
      path: '/phpmyadmin/',
      method: 'GET',
      timeout: 10000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Response Status: ${res.statusCode}`);
        console.log(`📊 Content-Type: ${res.headers['content-type']}`);
        console.log(`📊 Response Size: ${data.length} bytes`);
        
        // Check for PHP errors/warnings
        const hasDeprecationWarnings = data.includes('Deprecated');
        const hasWarnings = data.includes('Warning');
        const hasErrors = data.includes('Error');
        const hasPhpMyAdminContent = data.includes('phpMyAdmin') || data.includes('pma_');
        
        console.log('\n🔍 Content Analysis:');
        console.log(`   PHP Deprecation Warnings: ${hasDeprecationWarnings ? '❌ FOUND' : '✅ CLEAN'}`);
        console.log(`   PHP Warnings: ${hasWarnings ? '❌ FOUND' : '✅ CLEAN'}`);
        console.log(`   PHP Errors: ${hasErrors ? '❌ FOUND' : '✅ CLEAN'}`);
        console.log(`   phpMyAdmin Content: ${hasPhpMyAdminContent ? '✅ PRESENT' : '❌ MISSING'}`);
        
        if (hasDeprecationWarnings || hasWarnings || hasErrors) {
          console.log('\n🚨 ISSUES DETECTED - First 10 problematic lines:');
          const lines = data.split('\n');
          const problemLines = lines.filter(line => 
            line.includes('Deprecated') || 
            line.includes('Warning') || 
            line.includes('Error') ||
            line.includes('<b>')
          );
          
          problemLines.slice(0, 10).forEach((line, index) => {
            console.log(`   ${index + 1}: ${line.trim()}`);
          });
        }
        
        // Overall status
        const isClean = !hasDeprecationWarnings && !hasWarnings && !hasErrors;
        const isWorking = hasPhpMyAdminContent;
        
        console.log('\n🎯 Final Assessment:');
        if (isClean && isWorking) {
          console.log('   ✅ SUCCESS: phpMyAdmin working with clean output (no PHP warnings)');
        } else if (isWorking && !isClean) {
          console.log('   ⚠️  PARTIAL: phpMyAdmin working but with PHP warnings (suppression incomplete)');
        } else if (!isWorking) {
          console.log('   ❌ FAILED: phpMyAdmin not working properly');
        }
        
        console.log('\n📄 First 300 characters of response:');
        console.log(data.substring(0, 300));
        console.log('...\n');
        
        resolve({
          isClean,
          isWorking,
          hasWarnings: hasDeprecationWarnings || hasWarnings || hasErrors,
          statusCode: res.statusCode
        });
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('❌ Request timed out');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
};

// Run the test
testPhpMyAdmin()
  .then((result) => {
    console.log('✅ Test completed');
    process.exit(result.isClean && result.isWorking ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 