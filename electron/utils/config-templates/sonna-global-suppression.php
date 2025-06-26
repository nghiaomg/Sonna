<?php
/**
 * Sonna Global PHP Error Suppression
 * Auto-prepended to ALL PHP scripts for maximum compatibility
 * ULTRA-AGGRESSIVE suppression of PHP 8.x deprecation warnings
 */

// Start output buffering immediately to catch ANY output
if (!ob_get_level()) {
    ob_start();
}

// SILENCE ALL PHP errors at the most fundamental level
error_reporting(0);

// Disable ALL error display mechanisms
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
ini_set('html_errors', '0');
ini_set('xmlrpc_errors', '0');

// Enable logging but suppress output
ini_set('log_errors', '1');
ini_set('ignore_repeated_errors', '1');
ini_set('ignore_repeated_source', '1');

// NUCLEAR OPTION: Replace default error handler completely
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // SUPPRESS EVERYTHING - no output at all
    return true;
}, E_ALL);

// NUCLEAR OPTION: Replace exception handler
set_exception_handler(function($exception) {
    // Log but don't output
    error_log('Suppressed exception: ' . $exception->getMessage());
    return true;
});

// NUCLEAR OPTION: Register shutdown function to handle fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_PARSE])) {
        // Log but don't output
        error_log('Suppressed fatal error: ' . $error['message']);
    }
    
    // Clean any output buffer content that might contain warnings
    while (ob_get_level()) {
        $content = ob_get_clean();
        // Filter out deprecation warnings from output
        $content = preg_replace('/<br \/>\s*<b>Deprecated<\/b>:.*?<br \/>/is', '', $content);
        $content = preg_replace('/Deprecated:.*?\n/is', '', $content);
        echo $content;
    }
});

// Additional safety: Override error constants to prevent issues
if (!defined('E_DEPRECATED')) define('E_DEPRECATED', 0);
if (!defined('E_STRICT')) define('E_STRICT', 0);
if (!defined('E_NOTICE')) define('E_NOTICE', 0);
if (!defined('E_WARNING')) define('E_WARNING', 0);
?> 