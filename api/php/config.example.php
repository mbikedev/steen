<?php
/**
 * Database Configuration Template for Hostinger MySQL
 * Copy this file to config.php and update with your actual values
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    die('Direct access not permitted');
}

// Database configuration - replace with your actual Hostinger credentials
define('DB_HOST', 'localhost'); // Usually 'localhost' on Hostinger
define('DB_NAME', 'your_database_name'); // Your Hostinger database name
define('DB_USER', 'your_database_user'); // Your Hostinger database username
define('DB_PASS', 'your_database_password'); // Your Hostinger database password
define('DB_CHARSET', 'utf8mb4');

// API Configuration - generate a secure random key
define('API_KEY', 'your_secure_api_key_here'); // Generate a secure random key
define('CORS_ORIGIN', '*'); // Allow all origins during development

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 in production
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// Timezone
date_default_timezone_set('Europe/Brussels');

/**
 * Database connection class
 */
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize Database instance");
    }
}

/**
 * Helper function to send JSON response
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Helper function to validate API key
 */
function validateApiKey() {
    // Try multiple ways to get the API key
    $apiKey = '';
    
    // Method 1: getallheaders() function
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $apiKey = $headers['X-Api-Key'] ?? $headers['x-api-key'] ?? '';
    }
    
    // Method 2: $_SERVER array
    if (empty($apiKey)) {
        $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    }
    
    // Method 3: GET parameter fallback
    if (empty($apiKey)) {
        $apiKey = $_GET['api_key'] ?? '';
    }
    
    if ($apiKey !== API_KEY) {
        sendJsonResponse(['error' => 'Invalid API key'], 401);
    }
}

/**
 * Set CORS headers
 */
function setCorsHeaders() {
    header("Access-Control-Allow-Origin: " . CORS_ORIGIN);
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-Api-Key, Authorization");
    header("Access-Control-Max-Age: 3600");
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
?>