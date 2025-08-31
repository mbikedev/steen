<?php
/**
 * Test Database Connection Endpoint
 * Use this to verify your database configuration
 */

define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
validateApiKey();

try {
    $db = Database::getInstance()->getConnection();
    
    // Test query to verify connection
    $testQuery = "SELECT 1 as test";
    $stmt = $db->prepare($testQuery);
    $stmt->execute();
    $result = $stmt->fetch();
    
    // Get database version
    $versionQuery = "SELECT VERSION() as version";
    $stmt = $db->prepare($versionQuery);
    $stmt->execute();
    $version = $stmt->fetch();
    
    // Count tables
    $tablesQuery = "SHOW TABLES";
    $stmt = $db->prepare($tablesQuery);
    $stmt->execute();
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Database connection successful',
        'database' => [
            'connected' => true,
            'version' => $version['version'],
            'tables_count' => count($tables),
            'tables' => $tables
        ],
        'timestamp' => date('Y-m-d H:i:s'),
        'timezone' => date_default_timezone_get()
    ]);
    
} catch (Exception $e) {
    error_log("Database connection test failed: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], 500);
}