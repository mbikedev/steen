<?php
/**
 * Direct Database Test Script
 * Tests database connection and resident operations
 */

// Direct configuration (not through API)
$host = "localhost";
$dbname = "u734544155_mikaty";
$user = "u734544155_oscar";
$password = "2#^HT?v2kI";

header('Content-Type: application/json; charset=utf-8');

try {
    // Create connection
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ];
    
    $db = new PDO($dsn, $user, $password, $options);
    
    $results = [];
    
    // 1. Test connection
    $stmt = $db->query("SELECT 1 as test");
    $results['connection'] = $stmt->fetch()['test'] == 1 ? 'SUCCESS' : 'FAILED';
    
    // 2. Check if residents table exists
    $stmt = $db->query("SHOW TABLES LIKE 'residents'");
    $table = $stmt->fetch();
    $results['residents_table_exists'] = $table ? 'YES' : 'NO';
    
    // 3. Count existing residents
    if ($table) {
        $stmt = $db->query("SELECT COUNT(*) as count FROM residents");
        $count = $stmt->fetch();
        $results['current_resident_count'] = $count['count'];
        
        // 4. Try to insert a test resident
        $testBadge = 99999; // Test badge number
        $testData = [
            ':badge' => $testBadge,
            ':first_name' => 'Test',
            ':last_name' => 'User',
            ':room' => '101',
            ':nationality' => 'Test',
            ':ov_number' => 'TEST123',
            ':register_number' => 'REG123',
            ':date_of_birth' => '1990-01-01',
            ':age' => 34,
            ':gender' => 'M',
            ':reference_person' => 'Test Ref',
            ':date_in' => date('Y-m-d'),
            ':days_of_stay' => 1,
            ':status' => 'active',
            ':remarks' => 'Test resident created by test script',
            ':room_remarks' => 'Test room remarks'
        ];
        
        // First, delete any existing test resident
        $deleteStmt = $db->prepare("DELETE FROM residents WHERE badge = :badge");
        $deleteStmt->execute([':badge' => $testBadge]);
        
        // Insert test resident
        $insertQuery = "INSERT INTO residents (
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
        
        $stmt = $db->prepare($insertQuery);
        $insertSuccess = $stmt->execute($testData);
        
        if ($insertSuccess) {
            $newId = $db->lastInsertId();
            $results['test_insert'] = [
                'success' => true,
                'new_id' => $newId,
                'message' => 'Test resident created successfully'
            ];
            
            // Verify the insert
            $verifyStmt = $db->prepare("SELECT * FROM residents WHERE id = :id");
            $verifyStmt->execute([':id' => $newId]);
            $insertedResident = $verifyStmt->fetch();
            
            if ($insertedResident) {
                $results['test_insert']['verification'] = 'VERIFIED';
                $results['test_insert']['resident_data'] = [
                    'id' => $insertedResident['id'],
                    'badge' => $insertedResident['badge'],
                    'name' => $insertedResident['first_name'] . ' ' . $insertedResident['last_name'],
                    'room' => $insertedResident['room']
                ];
                
                // Clean up - delete test resident
                $cleanupStmt = $db->prepare("DELETE FROM residents WHERE id = :id");
                $cleanupStmt->execute([':id' => $newId]);
                $results['test_insert']['cleanup'] = 'Test resident deleted';
            }
        } else {
            $results['test_insert'] = [
                'success' => false,
                'error' => 'Failed to insert test resident'
            ];
        }
        
        // 5. Get last 3 residents to see recent data
        $stmt = $db->query("SELECT id, badge, first_name, last_name, created_at FROM residents ORDER BY created_at DESC LIMIT 3");
        $recentResidents = $stmt->fetchAll();
        $results['recent_residents'] = $recentResidents;
    }
    
    // 6. Check database info
    $stmt = $db->query("SELECT DATABASE() as current_db, USER() as current_user");
    $dbInfo = $stmt->fetch();
    $results['database_info'] = $dbInfo;
    
    // Output results
    echo json_encode([
        'success' => true,
        'message' => 'Database test completed',
        'results' => $results,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error',
        'message' => $e->getMessage(),
        'code' => $e->getCode(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'General error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
}
?>