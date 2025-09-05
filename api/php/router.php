<?php
// router.php - Handles PHP built-in server requests

// 1. Set CORS headers for all responses
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key");

// 2. Handle OPTIONS preflight requests (for CORS)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
  http_response_code(204); // No Content
  exit;
}

// 3. Serve static files if they exist
$filePath = $_SERVER["DOCUMENT_ROOT"] . $_SERVER["REQUEST_URI"];
if (file_exists($filePath) && is_file($filePath)) {
    return false; // Let the built-in server handle it
}

// 4. For all other API requests, route them to index.php
// This ensures our main API handler processes all endpoints.
$_SERVER['SCRIPT_NAME'] = '/api/php/index.php';
require_once __DIR__ . '/index.php';
