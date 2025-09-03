<?php
// API Router - handles all endpoints through index.php
define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();

// Get the request path
$request = $_GET['endpoint'] ?? '';

switch ($request) {
    case 'test-connection':
        handleTestConnection();
        break;
    
    case 'residents':
        include 'residents.php';
        break;
        
    case 'resident-photos':
        include 'resident-photos.php';
        break;
    
    case 'dashboard-stats':
        include 'dashboard-stats.php';
        break;
    
    case 'recent-activities':
        include 'recent-activities.php';
        break;
    
    case 'auth':
        include 'auth.php';
        break;
    
    case 'staff-assignments':
        include 'staff-assignments.php';
        break;
    
    case 'out-residents':
        include 'out-residents.php';
        break;
    
    case 'test':
        // Simple PHP test
        if (isset($_GET['db'])) {
            handleTestConnection();
        } else {
            sendJsonResponse([
                'success' => true,
                'message' => 'PHP is working on Hostinger!',
                'timestamp' => date('Y-m-d H:i:s'),
                'php_version' => phpversion()
            ]);
        }
        break;
        
    default:
        // Default API info
        sendJsonResponse([
            'success' => true,
            'message' => 'Steen API is running',
            'endpoints' => [
                'test-connection' => 'index.php?endpoint=test-connection',
                'residents' => 'index.php?endpoint=residents',
                'resident-photos' => 'index.php?endpoint=resident-photos',
                'dashboard-stats' => 'index.php?endpoint=dashboard-stats',
                'recent-activities' => 'index.php?endpoint=recent-activities',
                'auth' => 'index.php?endpoint=auth',
                'staff-assignments' => 'index.php?endpoint=staff-assignments',
                'test' => 'index.php?endpoint=test'
            ],
            'timestamp' => date('Y-m-d H:i:s')
        ]);
}

function handleTestConnection() {
    validateApiKey();
    
    try {
        $db = Database::getInstance()->getConnection();
        
        // Test query
        $stmt = $db->prepare("SELECT 1 as test");
        $stmt->execute();
        $result = $stmt->fetch();
        
        // Get version
        $stmt = $db->prepare("SELECT VERSION() as version");
        $stmt->execute();
        $version = $stmt->fetch();
        
        // Count tables
        $stmt = $db->prepare("SHOW TABLES");
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
            'timestamp' => date('Y-m-d H:i:s')
        ]);
        
    } catch (Exception $e) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ], 500);
    }
}

?>