<?php
/**
 * Residents API Endpoint
 * Handles CRUD operations for residents
 */

define('API_ACCESS', true);
require_once 'config.php';

// Set CORS headers
setCorsHeaders();

// Validate API key for non-GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    validateApiKey();
}

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

try {
    switch ($method) {
        case 'GET':
            if ($id) {
                getResident($db, $id);
            } else {
                getAllResidents($db);
            }
            break;
            
        case 'POST':
            createResident($db);
            break;
            
        case 'PUT':
            if ($id) {
                updateResident($db, $id);
            } else {
                sendJsonResponse(['error' => 'ID required for update'], 400);
            }
            break;
            
        case 'DELETE':
            if ($id) {
                deleteResident($db, $id);
            } else {
                sendJsonResponse(['error' => 'ID required for delete'], 400);
            }
            break;
            
        default:
            sendJsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    error_log("API Error Details: " . print_r($_POST, true));
    error_log("API Error Input: " . file_get_contents('php://input'));
    sendJsonResponse([
        'error' => 'Internal server error',
        'details' => $e->getMessage(),
        'line' => $e->getLine(),
        'file' => basename($e->getFile())
    ], 500);
}

/**
 * Get all residents
 */
function getAllResidents($db) {
    $query = "SELECT * FROM residents WHERE status != 'deleted' ORDER BY badge ASC";
    
    // Add filters if provided
    $params = [];
    $conditions = ["status != 'deleted'"];
    
    
    if (isset($_GET['room'])) {
        $conditions[] = "room = :room";
        $params[':room'] = $_GET['room'];
    }
    
    if (isset($_GET['status'])) {
        $conditions[] = "status = :status";
        $params[':status'] = $_GET['status'];
    }
    
    if (count($conditions) > 0) {
        $query = "SELECT * FROM residents WHERE " . implode(" AND ", $conditions) . " ORDER BY badge ASC";
    }
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();
    $residents = $stmt->fetchAll();
    
    // Convert database fields to frontend format
    $formattedResidents = array_map('formatResident', $residents);
    
    sendJsonResponse([
        'success' => true,
        'data' => $formattedResidents,
        'count' => count($formattedResidents)
    ]);
}

/**
 * Get single resident
 */
function getResident($db, $id) {
    $query = "SELECT * FROM residents WHERE id = :id AND status != 'deleted'";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $resident = $stmt->fetch();
    
    if ($resident) {
        sendJsonResponse([
            'success' => true,
            'data' => formatResident($resident)
        ]);
    } else {
        sendJsonResponse(['error' => 'Resident not found'], 404);
    }
}

/**
 * Create new resident
 */
function createResident($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        sendJsonResponse(['error' => 'Invalid JSON data'], 400);
    }
    
    // Validate required fields
    $required = ['firstName', 'lastName', 'badge'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendJsonResponse(['error' => "Field '$field' is required"], 400);
        }
    }
    
    $query = "INSERT INTO residents (
        badge, first_name, last_name, room, 
        nationality, ov_number, register_number, 
        date_of_birth, age, gender, reference_person,
        date_in, days_of_stay, status, remarks,
        room_remarks, created_at, updated_at
    ) VALUES (
        :badge, :first_name, :last_name, :room,
        :nationality, :ov_number, :register_number,
        :date_of_birth, :age, :gender, :reference_person,
        :date_in, :days_of_stay, :status, :remarks,
        :room_remarks, NOW(), NOW()
    )";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters with default values
    // Convert badge to integer, handle both string and numeric badges
    $badge = is_numeric($data['badge']) ? (int)$data['badge'] : 0;
    $stmt->bindValue(':badge', $badge, PDO::PARAM_INT);
    $stmt->bindValue(':first_name', $data['firstName']);
    $stmt->bindValue(':last_name', $data['lastName']);
    $stmt->bindValue(':room', $data['room'] ?? '');
    $stmt->bindValue(':nationality', $data['nationality'] ?? '');
    $stmt->bindValue(':ov_number', $data['ovNumber'] ?? '');
    $stmt->bindValue(':register_number', $data['registerNumber'] ?? '');
    $stmt->bindValue(':date_of_birth', $data['dateOfBirth'] ?? null);
    $stmt->bindValue(':age', $data['age'] ?? 0, PDO::PARAM_INT);
    $stmt->bindValue(':gender', $data['gender'] ?? 'M');
    $stmt->bindValue(':reference_person', $data['referencePerson'] ?? '');
    $stmt->bindValue(':date_in', $data['dateIn'] ?? date('Y-m-d'));
    $stmt->bindValue(':days_of_stay', $data['daysOfStay'] ?? 1, PDO::PARAM_INT);
    $stmt->bindValue(':status', $data['status'] ?? 'active');
    $stmt->bindValue(':remarks', $data['remarks'] ?? '');
    $stmt->bindValue(':room_remarks', $data['roomRemarks'] ?? '');
    
    if ($stmt->execute()) {
        $newId = $db->lastInsertId();
        getResident($db, $newId);
    } else {
        sendJsonResponse(['error' => 'Failed to create resident'], 500);
    }
}

/**
 * Update resident
 */
function updateResident($db, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        sendJsonResponse(['error' => 'Invalid JSON data'], 400);
    }
    
    // Build dynamic update query
    $fields = [];
    $params = [':id' => $id];
    
    $allowedFields = [
        'badge', 'firstName' => 'first_name', 'lastName' => 'last_name',
        'room', 'nationality', 'ovNumber' => 'ov_number',
        'registerNumber' => 'register_number', 'dateOfBirth' => 'date_of_birth',
        'age', 'gender', 'referencePerson' => 'reference_person',
        'dateIn' => 'date_in', 'daysOfStay' => 'days_of_stay',
        'status', 'remarks', 'roomRemarks' => 'room_remarks'
    ];
    
    foreach ($allowedFields as $jsonField => $dbField) {
        if (is_string($jsonField)) {
            $field = $jsonField;
            $column = $dbField;
        } else {
            $field = $dbField;
            $column = $dbField;
        }
        
        if (isset($data[$field])) {
            $fields[] = "$column = :$column";
            $params[":$column"] = $data[$field];
        }
    }
    
    if (empty($fields)) {
        sendJsonResponse(['error' => 'No fields to update'], 400);
    }
    
    $fields[] = "updated_at = NOW()";
    
    $query = "UPDATE residents SET " . implode(", ", $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute($params)) {
        getResident($db, $id);
    } else {
        sendJsonResponse(['error' => 'Failed to update resident'], 500);
    }
}

/**
 * Delete resident (soft delete)
 */
function deleteResident($db, $id) {
    $query = "UPDATE residents SET status = 'deleted', updated_at = NOW() WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        sendJsonResponse([
            'success' => true,
            'message' => 'Resident deleted successfully'
        ]);
    } else {
        sendJsonResponse(['error' => 'Failed to delete resident'], 500);
    }
}

/**
 * Format resident data for frontend
 */
function formatResident($resident) {
    return [
        'id' => (int)$resident['id'],
        'badge' => (int)$resident['badge'],
        'firstName' => $resident['first_name'],
        'lastName' => $resident['last_name'],
        'name' => $resident['first_name'] . ' ' . $resident['last_name'],
        'room' => $resident['room'],
        'nationality' => $resident['nationality'],
        'ovNumber' => $resident['ov_number'],
        'registerNumber' => $resident['register_number'],
        'dateOfBirth' => $resident['date_of_birth'],
        'age' => (int)$resident['age'],
        'gender' => $resident['gender'],
        'referencePerson' => $resident['reference_person'],
        'dateIn' => $resident['date_in'],
        'daysOfStay' => (int)$resident['days_of_stay'],
        'status' => $resident['status'],
        'remarks' => $resident['remarks'],
        'roomRemarks' => $resident['room_remarks'],
        'createdAt' => $resident['created_at'],
        'updatedAt' => $resident['updated_at']
    ];
}