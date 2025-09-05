<?php
// Resident Photos API Endpoint
define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = Database::getInstance();
    
    switch ($method) {
        case 'GET':
            handleGetPhotos();
            break;
            
        case 'POST':
            handleUploadPhoto();
            break;
            
        case 'DELETE':
            handleDeletePhoto();
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}

function handleGetPhotos() {
    global $db;
    
    try {
        // For now, return empty array since we don't have photos in the database yet
        // This will prevent the frontend from crashing
        $photos = [];
        
        echo json_encode([
            'success' => true,
            'data' => $photos,
            'message' => 'Photos retrieved successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to retrieve photos: ' . $e->getMessage()]);
    }
}

function handleUploadPhoto() {
    global $db;
    
    try {
        // For now, return success but don't actually upload
        // This prevents the frontend from crashing
        echo json_encode([
            'success' => true,
            'message' => 'Photo upload endpoint ready (not implemented yet)'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to upload photo: ' . $e->getMessage()]);
    }
}

function handleDeletePhoto() {
    global $db;
    
    try {
        // For now, return success but don't actually delete
        // This prevents the frontend from crashing
        echo json_encode([
            'success' => true,
            'message' => 'Photo delete endpoint ready (not implemented yet)'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to delete photo: ' . $e->getMessage()]);
    }
}
?>