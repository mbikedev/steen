<?php
// Staff Assignments (Toewijzingen) API
if (!defined('API_ACCESS')) {
    exit('Direct access denied');
}

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetStaffAssignments();
        break;
    case 'POST':
        handleCreateStaffAssignment();
        break;
    case 'PUT':
        handleUpdateStaffAssignment();
        break;
    case 'DELETE':
        handleDeleteStaffAssignment();
        break;
    default:
        sendJsonResponse([
            'success' => false,
            'error' => 'Method not allowed',
            'message' => 'Only GET, POST, PUT, DELETE methods are supported'
        ], 405);
}

function handleGetStaffAssignments() {
    validateApiKey();
    
    try {
        $db = Database::getInstance()->getConnection();
        
        // Get assignment date filter if provided
        $assignmentDate = $_GET['date'] ?? date('Y-m-d');
        
        // Get staff assignments with resident details
        $stmt = $db->prepare("
            SELECT 
                sa.id,
                sa.resident_id,
                sa.staff_name,
                sa.assignment_date,
                sa.assignment_type,
                sa.color_code,
                sa.position_row,
                sa.position_col,
                sa.status as assignment_status,
                sa.notes,
                r.badge,
                r.first_name,
                r.last_name,
                r.room,
                r.status as resident_status
            FROM staff_assignments sa
            LEFT JOIN residents r ON sa.resident_id = r.id
            WHERE sa.assignment_date = ? AND sa.status = 'active'
            ORDER BY sa.position_row, sa.position_col, sa.staff_name
        ");
        
        $stmt->execute([$assignmentDate]);
        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get staff list with assignment counts
        $stmt = $db->prepare("
            SELECT 
                staff_name,
                COUNT(*) as assignment_count,
                GROUP_CONCAT(CONCAT(r.first_name, ' ', r.last_name) SEPARATOR ', ') as assigned_residents
            FROM staff_assignments sa
            LEFT JOIN residents r ON sa.resident_id = r.id
            WHERE sa.assignment_date = ? AND sa.status = 'active'
            GROUP BY staff_name
            ORDER BY staff_name
        ");
        
        $stmt->execute([$assignmentDate]);
        $staffSummary = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        sendJsonResponse([
            'success' => true,
            'data' => [
                'assignments' => $assignments,
                'staff_summary' => $staffSummary,
                'assignment_date' => $assignmentDate,
                'total_assignments' => count($assignments)
            ]
        ]);
        
    } catch (Exception $e) {
        logError("Get staff assignments error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'error' => 'Failed to retrieve staff assignments',
            'message' => $e->getMessage()
        ], 500);
    }
}

function handleCreateStaffAssignment() {
    validateApiKey();
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            throw new Exception('Invalid JSON input');
        }
        
        // Handle bulk save operation
        if (isset($input['action']) && $input['action'] === 'bulk_save') {
            $assignments = isset($input['assignments']) ? $input['assignments'] : [];
            return handleBulkSave($assignments);
        }
        
        // Validate required fields for single assignment
        $requiredFields = ['resident_id', 'staff_name', 'assignment_date'];
        foreach ($requiredFields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                throw new Exception("Field '$field' is required");
            }
        }
        
        $db = Database::getInstance()->getConnection();
        
        // Check if resident exists
        $stmt = $db->prepare("SELECT id FROM residents WHERE id = ? AND status = 'active'");
        $stmt->execute([$input['resident_id']]);
        if (!$stmt->fetch()) {
            throw new Exception('Resident not found or inactive');
        }
        
        // Check for existing assignment (prevent duplicates)
        $stmt = $db->prepare("
            SELECT id FROM staff_assignments 
            WHERE resident_id = ? AND assignment_date = ? AND status = 'active'
        ");
        $stmt->execute([$input['resident_id'], $input['assignment_date']]);
        if ($stmt->fetch()) {
            throw new Exception('Resident already has an assignment for this date');
        }
        
        // Create new assignment
        $stmt = $db->prepare("
            INSERT INTO staff_assignments (
                resident_id, staff_name, assignment_date, assignment_type, 
                color_code, position_row, position_col, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $input['resident_id'],
            $input['staff_name'],
            $input['assignment_date'],
            $input['assignment_type'] ?? 'regular',
            $input['color_code'] ?? 'white',
            $input['position_row'] ?? null,
            $input['position_col'] ?? null,
            $input['notes'] ?? null
        ]);
        
        $assignmentId = $db->lastInsertId();
        
        // Log activity
        logActivity('create', 'staff_assignment', $assignmentId, [
            'resident_id' => $input['resident_id'],
            'staff_name' => $input['staff_name'],
            'assignment_date' => $input['assignment_date']
        ]);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Staff assignment created successfully',
            'data' => ['id' => $assignmentId]
        ]);
        
    } catch (Exception $e) {
        logError("Create staff assignment error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'error' => 'Failed to create staff assignment',
            'message' => $e->getMessage()
        ], 400);
    }
}

function handleBulkSave($assignments) {
    $db = null;
    try {
        // Allow empty assignments (for clearing all)
        if (!is_array($assignments)) {
            throw new Exception('Assignments must be an array');
        }
        
        // If no assignments, just return success
        if (empty($assignments)) {
            sendJsonResponse([
                'success' => true,
                'message' => 'No assignments to save',
                'data' => [
                    'successful' => 0,
                    'errors' => 0,
                    'error_details' => []
                ]
            ]);
            return;
        }
        
        $db = Database::getInstance()->getConnection();
        $db->beginTransaction();
        
        $successCount = 0;
        $errorCount = 0;
        $errors = [];
        
        foreach ($assignments as $assignment) {
            try {
                // Find resident by name
                $residentId = null;
                if (isset($assignment['resident_name'])) {
                    $nameParts = explode(' ', trim($assignment['resident_name']), 2);
                    $firstName = $nameParts[0];
                    $lastName = isset($nameParts[1]) ? $nameParts[1] : '';
                    
                    // Try to find resident
                    $stmt = $db->prepare("
                        SELECT id FROM residents 
                        WHERE (first_name LIKE ? AND last_name LIKE ?) 
                           OR CONCAT(first_name, ' ', last_name) LIKE ?
                           OR CONCAT(last_name, ' ', first_name) LIKE ?
                        AND status = 'active'
                        LIMIT 1
                    ");
                    $stmt->execute(["%$firstName%", "%$lastName%", "%{$assignment['resident_name']}%", "%{$assignment['resident_name']}%"]);
                    $resident = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($resident) {
                        $residentId = $resident['id'];
                    }
                }
                
                if (!$residentId) {
                    $errors[] = "Resident not found: {$assignment['resident_name']}";
                    $errorCount++;
                    continue;
                }
                
                // Check for existing assignment and update or create
                $stmt = $db->prepare("
                    SELECT id FROM staff_assignments 
                    WHERE resident_id = ? AND assignment_date = ? AND status = 'active'
                ");
                $stmt->execute([$residentId, $assignment['assignment_date']]);
                $existingAssignment = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existingAssignment) {
                    // Update existing assignment
                    $stmt = $db->prepare("
                        UPDATE staff_assignments 
                        SET staff_name = ?, assignment_type = ?, color_code = ?, 
                            position_row = ?, position_col = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $assignment['staff_name'],
                        $assignment['assignment_type'] ?? 'regular',
                        $assignment['color_code'] ?? 'white',
                        $assignment['position_row'] ?? null,
                        $assignment['position_col'] ?? null,
                        $assignment['notes'] ?? null,
                        $existingAssignment['id']
                    ]);
                } else {
                    // Create new assignment
                    $stmt = $db->prepare("
                        INSERT INTO staff_assignments (
                            resident_id, staff_name, assignment_date, assignment_type, 
                            color_code, position_row, position_col, notes
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $residentId,
                        $assignment['staff_name'],
                        $assignment['assignment_date'],
                        $assignment['assignment_type'] ?? 'regular',
                        $assignment['color_code'] ?? 'white',
                        $assignment['position_row'] ?? null,
                        $assignment['position_col'] ?? null,
                        $assignment['notes'] ?? null
                    ]);
                }
                
                $successCount++;
                
            } catch (Exception $e) {
                $errors[] = "Error processing {$assignment['resident_name']}: " . $e->getMessage();
                $errorCount++;
            }
        }
        
        $db->commit();
        
        // Log bulk activity
        logActivity('bulk_save', 'staff_assignments', null, [
            'total_assignments' => count($assignments),
            'successful' => $successCount,
            'errors' => $errorCount
        ]);
        
        sendJsonResponse([
            'success' => true,
            'message' => "Bulk save completed: $successCount successful, $errorCount errors",
            'data' => [
                'successful' => $successCount,
                'errors' => $errorCount,
                'error_details' => $errors
            ]
        ]);
        
    } catch (Exception $e) {
        if ($db) {
            $db->rollback();
        }
        logError("Bulk save error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'error' => 'Failed to save assignments',
            'message' => $e->getMessage()
        ], 400);
    }
}

function handleUpdateStaffAssignment() {
    validateApiKey();
    
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            throw new Exception('Assignment ID is required');
        }
        
        $db = Database::getInstance()->getConnection();
        
        // Check if assignment exists
        $stmt = $db->prepare("SELECT id FROM staff_assignments WHERE id = ?");
        $stmt->execute([$input['id']]);
        if (!$stmt->fetch()) {
            throw new Exception('Assignment not found');
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [];
        
        $allowedFields = [
            'staff_name', 'assignment_date', 'assignment_type', 
            'color_code', 'position_row', 'position_col', 'notes', 'status'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (empty($updateFields)) {
            throw new Exception('No fields to update');
        }
        
        $params[] = $input['id'];
        
        $stmt = $db->prepare("
            UPDATE staff_assignments 
            SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $stmt->execute($params);
        
        // Log activity
        logActivity('update', 'staff_assignment', $input['id'], $input);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Staff assignment updated successfully'
        ]);
        
    } catch (Exception $e) {
        logError("Update staff assignment error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'error' => 'Failed to update staff assignment',
            'message' => $e->getMessage()
        ], 400);
    }
}

function handleDeleteStaffAssignment() {
    validateApiKey();
    
    try {
        $assignmentId = $_GET['id'] ?? null;
        
        if (!$assignmentId) {
            throw new Exception('Assignment ID is required');
        }
        
        $db = Database::getInstance()->getConnection();
        
        // Check if assignment exists
        $stmt = $db->prepare("SELECT id FROM staff_assignments WHERE id = ?");
        $stmt->execute([$assignmentId]);
        if (!$stmt->fetch()) {
            throw new Exception('Assignment not found');
        }
        
        // Soft delete (set status to inactive)
        $stmt = $db->prepare("
            UPDATE staff_assignments 
            SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ");
        
        $stmt->execute([$assignmentId]);
        
        // Log activity
        logActivity('delete', 'staff_assignment', $assignmentId);
        
        sendJsonResponse([
            'success' => true,
            'message' => 'Staff assignment deleted successfully'
        ]);
        
    } catch (Exception $e) {
        logError("Delete staff assignment error: " . $e->getMessage());
        sendJsonResponse([
            'success' => false,
            'error' => 'Failed to delete staff assignment',
            'message' => $e->getMessage()
        ], 400);
    }
}

function logActivity($action, $entityType, $entityId, $details = null) {
    try {
        $db = Database::getInstance()->getConnection();
        
        $stmt = $db->prepare("
            INSERT INTO activity_log (user, action, entity_type, entity_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            'system', // Or get from auth context
            $action,
            $entityType,
            $entityId,
            $details ? json_encode($details) : null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) {
        // Log silently, don't fail the main operation
        error_log("Activity log error: " . $e->getMessage());
    }
}

function logError($message) {
    error_log("[Staff Assignments API] " . $message);
}

?>