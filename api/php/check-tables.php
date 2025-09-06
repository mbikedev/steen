<?php
/**
 * Check if database tables exist and their structure
 */

// Direct configuration
$host = "localhost";
$dbname = "u734544155_mikaty";
$user = "u734544155_oscar";
$password = "2#^HT?v2kI";

header('Content-Type: application/json; charset=utf-8');

try {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ];
    
    $db = new PDO($dsn, $user, $password, $options);
    
    $results = [
        'database' => $dbname,
        'connection' => 'SUCCESS',
        'tables' => []
    ];
    
    // Get all tables
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($tables as $table) {
        $tableInfo = [
            'name' => $table,
            'columns' => [],
            'row_count' => 0
        ];
        
        // Get table structure
        $stmt = $db->query("DESCRIBE `$table`");
        $columns = $stmt->fetchAll();
        
        foreach ($columns as $column) {
            $tableInfo['columns'][] = [
                'field' => $column['Field'],
                'type' => $column['Type'],
                'null' => $column['Null'],
                'key' => $column['Key']
            ];
        }
        
        // Get row count
        $stmt = $db->query("SELECT COUNT(*) as count FROM `$table`");
        $count = $stmt->fetch();
        $tableInfo['row_count'] = $count['count'];
        
        $results['tables'][] = $tableInfo;
    }
    
    // Special check for residents table
    $hasResidentsTable = in_array('residents', $tables);
    $results['residents_table_exists'] = $hasResidentsTable;
    
    if ($hasResidentsTable) {
        // Get sample data from residents table
        $stmt = $db->query("SELECT id, badge, first_name, last_name, room, created_at 
                           FROM residents 
                           ORDER BY created_at DESC 
                           LIMIT 5");
        $results['recent_residents'] = $stmt->fetchAll();
    }
    
    echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage(),
        'code' => $e->getCode()
    ], JSON_PRETTY_PRINT);
}