<?php
/**
 * Resident Photos API - handles photo upload, retrieval, and deletion
 */

// Prevent direct access
if (!defined('API_ACCESS')) {
    http_response_code(403);
    die('Direct access not permitted');
}

// Set JSON header early to ensure proper response
header('Content-Type: application/json');

validateApiKey();

$method = $_SERVER['REQUEST_METHOD'];

// Try to get database connection with error handling
try {
    $db = Database::getInstance()->getConnection();
    // Create resident_photos table if it doesn't exist
    createResidentPhotosTable($db);
} catch (Exception $e) {
    // If database connection fails, return error
    sendJsonResponse([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => 'Could not connect to database. Please check configuration.',
        'debug' => $e->getMessage()
    ], 500);
    exit;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['badge_number'])) {
            // Get specific resident photo
            getResidentPhoto($db, $_GET['badge_number']);
        } else {
            // Get all resident photos
            getAllResidentPhotos($db);
        }
        break;
        
    case 'POST':
        // Upload resident photo
        uploadResidentPhoto($db);
        break;
        
    case 'DELETE':
        if (isset($_GET['badge_number'])) {
            deleteResidentPhoto($db, $_GET['badge_number']);
        } else {
            sendJsonResponse(['error' => 'Badge number required for deletion'], 400);
        }
        break;
        
    default:
        sendJsonResponse(['error' => 'Method not allowed'], 405);
}

/**
 * Create resident_photos table if it doesn't exist
 */
function createResidentPhotosTable($db) {
    $sql = "CREATE TABLE IF NOT EXISTS resident_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge_number INT NOT NULL UNIQUE,
        photo_filename VARCHAR(255) NOT NULL,
        photo_url VARCHAR(500) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_badge_number (badge_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    try {
        $db->exec($sql);
        return true;
    } catch (Exception $e) {
        error_log("Failed to create resident_photos table: " . $e->getMessage());
        // Don't fail silently - return the error
        sendJsonResponse([
            'success' => false,
            'error' => 'Failed to create database table',
            'message' => 'Could not create resident_photos table',
            'debug' => $e->getMessage()
        ], 500);
        exit;
    }
}

/**
 * Upload resident photo
 */
function uploadResidentPhoto($db) {
    try {
        // Validate required fields
        if (!isset($_POST['badge_number']) || !isset($_FILES['photo'])) {
            sendJsonResponse(['error' => 'Badge number and photo file are required'], 400);
        }
        
        $badgeNumber = (int)$_POST['badge_number'];
        $file = $_FILES['photo'];
        
        // Validate file upload
        if ($file['error'] !== UPLOAD_ERR_OK) {
            sendJsonResponse(['error' => 'File upload failed'], 400);
        }
        
        // Validate file type
        $allowedMimes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
            'image/webp', 'image/bmp', 'image/tiff', 'image/avif'
        ];
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $allowedMimes)) {
            sendJsonResponse(['error' => 'Invalid file type. Only images are allowed.'], 400);
        }
        
        // Validate file size (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            sendJsonResponse(['error' => 'File size must be less than 5MB'], 400);
        }
        
        // Create uploads directory if it doesn't exist
        $uploadDir = __DIR__ . '/uploads/resident-photos/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'resident_' . $badgeNumber . '_' . time() . '.' . $extension;
        $filePath = $uploadDir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            sendJsonResponse(['error' => 'Failed to save uploaded file'], 500);
        }
        
        // Generate photo URL - use full server URL
        $photoUrl = 'https://mikaty.eastatwest.com/api/php/uploads/resident-photos/' . $filename;
        
        // Check if resident photo already exists
        $stmt = $db->prepare("SELECT id FROM resident_photos WHERE badge_number = ?");
        $stmt->execute([$badgeNumber]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update existing photo
            $stmt = $db->prepare(
                "UPDATE resident_photos 
                 SET photo_filename = ?, photo_url = ?, file_size = ?, mime_type = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE badge_number = ?"
            );
            $stmt->execute([$filename, $photoUrl, $file['size'], $mimeType, $badgeNumber]);
        } else {
            // Insert new photo
            $stmt = $db->prepare(
                "INSERT INTO resident_photos (badge_number, photo_filename, photo_url, file_size, mime_type) 
                 VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([$badgeNumber, $filename, $photoUrl, $file['size'], $mimeType]);
        }
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Photo uploaded successfully',
            'data' => [
                'badge_number' => $badgeNumber,
                'photoUrl' => $photoUrl,
                'filename' => $filename,
                'file_size' => $file['size'],
                'mime_type' => $mimeType
            ]
        ]);
        
    } catch (Exception $e) {
        error_log("Photo upload error: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to upload photo: ' . $e->getMessage()], 500);
    }
}

/**
 * Get specific resident photo
 */
function getResidentPhoto($db, $badgeNumber) {
    try {
        $stmt = $db->prepare("SELECT * FROM resident_photos WHERE badge_number = ?");
        $stmt->execute([$badgeNumber]);
        $photo = $stmt->fetch();
        
        if ($photo) {
            sendJsonResponse([
                'success' => true,
                'data' => [
                    'photoUrl' => $photo['photo_url'],
                    'filename' => $photo['photo_filename'],
                    'file_size' => $photo['file_size'],
                    'mime_type' => $photo['mime_type'],
                    'created_at' => $photo['created_at'],
                    'updated_at' => $photo['updated_at']
                ]
            ]);
        } else {
            sendJsonResponse([
                'success' => false,
                'error' => 'Photo not found'
            ], 404);
        }
        
    } catch (Exception $e) {
        error_log("Get photo error: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to get photo'], 500);
    }
}

/**
 * Get all resident photos
 */
function getAllResidentPhotos($db) {
    try {
        $stmt = $db->prepare("SELECT badge_number, photo_url FROM resident_photos ORDER BY badge_number");
        $stmt->execute();
        $photos = $stmt->fetchAll();
        
        // Convert to associative array with badge_number as key
        $result = [];
        foreach ($photos as $photo) {
            $result[$photo['badge_number']] = $photo['photo_url'];
        }
        
        sendJsonResponse([
            'success' => true,
            'data' => $result,
            'count' => count($result)
        ]);
        
    } catch (Exception $e) {
        error_log("Get all photos error: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to get photos'], 500);
    }
}

/**
 * Delete resident photo
 */
function deleteResidentPhoto($db, $badgeNumber) {
    try {
        // Get photo info first
        $stmt = $db->prepare("SELECT photo_filename FROM resident_photos WHERE badge_number = ?");
        $stmt->execute([$badgeNumber]);
        $photo = $stmt->fetch();
        
        if ($photo) {
            // Delete physical file
            $filePath = __DIR__ . '/uploads/resident-photos/' . $photo['photo_filename'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }
            
            // Delete database record
            $stmt = $db->prepare("DELETE FROM resident_photos WHERE badge_number = ?");
            $stmt->execute([$badgeNumber]);
            
            sendJsonResponse([
                'success' => true,
                'message' => 'Photo deleted successfully'
            ]);
        } else {
            sendJsonResponse([
                'success' => false,
                'error' => 'Photo not found'
            ], 404);
        }
        
    } catch (Exception $e) {
        error_log("Delete photo error: " . $e->getMessage());
        sendJsonResponse(['error' => 'Failed to delete photo'], 500);
    }
}
?>