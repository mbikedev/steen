<?php
/**
 * Simplified Resident Photos API for debugging
 * This version has minimal dependencies and better error reporting
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    die(json_encode(['error' => 'Direct access not permitted']));
}

// Set JSON header early
header('Content-Type: application/json');

// Basic response function
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

try {
    // Validate API key (simplified)
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? '';
    if ($apiKey !== '20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a') {
        sendResponse(['error' => 'Invalid API key'], 401);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    
    // For now, just handle GET requests to test
    if ($method === 'GET') {
        // Check if we have badge_number parameter
        if (isset($_GET['badge_number'])) {
            // Get specific resident photo (mock response for now)
            sendResponse([
                'success' => true,
                'data' => [
                    'badge_number' => $_GET['badge_number'],
                    'photoUrl' => null,
                    'message' => 'Photo not found (database not connected yet)'
                ]
            ]);
        } else {
            // Get all resident photos (return empty for now)
            sendResponse([
                'success' => true,
                'data' => [],
                'count' => 0,
                'message' => 'Endpoint working but database not connected yet'
            ]);
        }
    } elseif ($method === 'POST') {
        // Handle upload
        sendResponse([
            'success' => false,
            'error' => 'Upload not implemented in simple version',
            'message' => 'Please use the full resident-photos.php for uploads'
        ]);
    } else {
        sendResponse(['error' => 'Method not allowed'], 405);
    }
    
} catch (Exception $e) {
    sendResponse([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ], 500);
}
?>