<?php
/**
 * OUT Residents API Endpoint
 * Handles CRUD operations for residents who are OUT
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
    // Create out_residents table if it doesn't exist
    createOutResidentsTableIfNotExists($db);
    
    switch ($method) {
        case 'GET':
            if ($id) {
                getOutResident($db, $id);
            } else {
                getAllOutResidents($db);
            }
            break;
            
        case 'POST':
            moveResidentToOut($db);
            break;
            
        case 'DELETE':
            if ($id) {
                deleteOutResident($db, $id);
            } else {
                sendJsonResponse(['error' => 'ID required for delete'], 400);
            }
            break;
            
        default:
            sendJsonResponse(['error' => 'Method not allowed'], 405);
    }
} catch (Exception $e) {
    error_log("OUT Residents API Error: " . $e->getMessage());
    sendJsonResponse([
        'error' => 'Internal server error',
        'details' => $e->getMessage(),
        'line' => $e->getLine(),
        'file' => basename($e->getFile())
    ], 500);
}

/**
 * Create out_residents table if it doesn't exist
 */
function createOutResidentsTableIfNotExists($db) {
    $query = "CREATE TABLE IF NOT EXISTS out_residents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        original_id INT NOT NULL,
        badge INT NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        room VARCHAR(50),
        nationality VARCHAR(100),
        ov_number VARCHAR(100),
        register_number VARCHAR(100),
        date_of_birth DATE,
        age INT,
        gender ENUM('M', 'F', 'V') DEFAULT 'M',
        reference_person VARCHAR(255),
        date_in DATE,
        days_of_stay INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'OUT',
        remarks TEXT,
        room_remarks TEXT,
        date_out TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        original_created_at TIMESTAMP,
        original_updated_at TIMESTAMP,
        INDEX idx_badge (badge),
        INDEX idx_original_id (original_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($query);
}

/**
 * Get all OUT residents
 */
function getAllOutResidents($db) {
    $query = "SELECT * FROM out_residents ORDER BY date_out DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $outResidents = $stmt->fetchAll();
    
    // Convert database fields to frontend format
    $formattedOutResidents = array_map('formatOutResident', $outResidents);
    
    sendJsonResponse([
        'success' => true,
        'data' => $formattedOutResidents,
        'count' => count($formattedOutResidents)
    ]);
}

/**
 * Get single OUT resident
 */
function getOutResident($db, $id) {
    $query = "SELECT * FROM out_residents WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    
    $resident = $stmt->fetch();
    
    if ($resident) {
        sendJsonResponse([
            'success' => true,
            'data' => formatOutResident($resident)
        ]);
    } else {
        sendJsonResponse(['error' => 'OUT resident not found'], 404);
    }
}

/**
 * Move resident from main table to OUT table
 */
function moveResidentToOut($db) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['residentId'])) {
        sendJsonResponse(['error' => 'Resident ID is required'], 400);
    }
    
    $residentId = $data['residentId'];
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Get the resident from main table
        $getQuery = "SELECT * FROM residents WHERE id = :id";
        $getStmt = $db->prepare($getQuery);
        $getStmt->bindValue(':id', $residentId, PDO::PARAM_INT);
        $getStmt->execute();
        $resident = $getStmt->fetch();
        
        if (!$resident) {
            throw new Exception('Resident not found');
        }
        
        // Insert into out_residents table
        $insertQuery = "INSERT INTO out_residents (
            original_id, badge, first_name, last_name, room,
            nationality, ov_number, register_number, date_of_birth, age, gender,
            reference_person, date_in, days_of_stay, status, remarks, room_remarks,
            original_created_at, original_updated_at
        ) VALUES (
            :original_id, :badge, :first_name, :last_name, :room,
            :nationality, :ov_number, :register_number, :date_of_birth, :age, :gender,
            :reference_person, :date_in, :days_of_stay, 'OUT', :remarks, :room_remarks,
            :original_created_at, :original_updated_at
        )";
        
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindValue(':original_id', $resident['id'], PDO::PARAM_INT);
        $insertStmt->bindValue(':badge', $resident['badge'], PDO::PARAM_INT);
        $insertStmt->bindValue(':first_name', $resident['first_name']);
        $insertStmt->bindValue(':last_name', $resident['last_name']);
        $insertStmt->bindValue(':room', $resident['room']);
        $insertStmt->bindValue(':nationality', $resident['nationality']);
        $insertStmt->bindValue(':ov_number', $resident['ov_number']);
        $insertStmt->bindValue(':register_number', $resident['register_number']);
        $insertStmt->bindValue(':date_of_birth', $resident['date_of_birth']);
        $insertStmt->bindValue(':age', $resident['age'], PDO::PARAM_INT);
        $insertStmt->bindValue(':gender', $resident['gender']);
        $insertStmt->bindValue(':reference_person', $resident['reference_person']);
        $insertStmt->bindValue(':date_in', $resident['date_in']);
        $insertStmt->bindValue(':days_of_stay', $resident['days_of_stay'], PDO::PARAM_INT);
        $insertStmt->bindValue(':remarks', $resident['remarks']);
        $insertStmt->bindValue(':room_remarks', $resident['room_remarks']);
        $insertStmt->bindValue(':original_created_at', $resident['created_at']);
        $insertStmt->bindValue(':original_updated_at', $resident['updated_at']);
        
        if (!$insertStmt->execute()) {
            throw new Exception('Failed to insert into out_residents table');
        }
        
        // Delete from main residents table
        $deleteQuery = "DELETE FROM residents WHERE id = :id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindValue(':id', $residentId, PDO::PARAM_INT);
        
        if (!$deleteStmt->execute()) {
            throw new Exception('Failed to delete from residents table');
        }
        
        // Commit transaction
        $db->commit();
        
        $newOutId = $db->lastInsertId();
        getOutResident($db, $newOutId);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Delete OUT resident permanently
 */
function deleteOutResident($db, $id) {
    $query = "DELETE FROM out_residents WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':id', $id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        sendJsonResponse([
            'success' => true,
            'message' => 'OUT resident deleted permanently'
        ]);
    } else {
        sendJsonResponse(['error' => 'Failed to delete OUT resident'], 500);
    }
}

/**
 * Format OUT resident data for frontend
 */
function formatOutResident($resident) {
    return [
        'id' => (int)$resident['id'],
        'originalId' => (int)$resident['original_id'],
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
        'dateOut' => $resident['date_out'],
        'originalCreatedAt' => $resident['original_created_at'],
        'originalUpdatedAt' => $resident['original_updated_at']
    ];
}