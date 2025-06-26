<?php
/**
 * Sonna phpMyAdmin Error Suppression
 * Suppresses PHP 8.x deprecation warnings for better phpMyAdmin compatibility
 */

// Suppress all deprecation warnings and notices at runtime
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE);

// Disable output of startup errors
ini_set('display_startup_errors', '0');

// Enable error logging but suppress output
ini_set('log_errors', '1');
ini_set('ignore_repeated_errors', '1');
ini_set('ignore_repeated_source', '1');

// Set a custom error handler to suppress specific deprecation warnings
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // Suppress deprecation warnings from vendor libraries
    if ($errno === E_DEPRECATED || $errno === E_USER_DEPRECATED) {
        return true; // Suppress the error
    }
    
    // Suppress notices
    if ($errno === E_NOTICE || $errno === E_USER_NOTICE) {
        return true; // Suppress the error
    }
    
    // Let other errors through
    return false;
});

// Suppress output buffering errors
ob_start();
?> 