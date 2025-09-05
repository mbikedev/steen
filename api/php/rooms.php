<?php
// Rooms API endpoint
define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
validateApiKey();

try {
    $db = Database::getInstance()->getConnection();
    
    $view = $_GET['view'] ?? 'all';
    
    switch ($view) {
        case 'occupancy':
            // Get room occupancy data
            $stmt = $db->prepare("
                SELECT 
                    r.id,
                    r.room_number,
                    r.capacity as bed_count,
                    COUNT(res.id) as occupied_beds,
                    (r.capacity - COUNT(res.id)) as available_beds
                FROM rooms r
                LEFT JOIN residents res ON r.room_number = res.room AND res.status = 'active'
                GROUP BY r.id, r.room_number, r.capacity
                ORDER BY r.room_number
            ");
            $stmt->execute();
            $rooms = $stmt->fetchAll();
            
            sendJsonResponse([
                'success' => true,
                'data' => $rooms,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        case 'all':
        default:
            // Get all rooms
            $stmt = $db->prepare("SELECT * FROM rooms ORDER BY room_number");
            $stmt->execute();
            $rooms = $stmt->fetchAll();
            
            sendJsonResponse([
                'success' => true,
                'data' => $rooms,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
    }
    
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'error' => 'Failed to fetch rooms data',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], 500);
}
?>
