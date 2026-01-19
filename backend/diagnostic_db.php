<?php
// diagnostic_db.php
$dsn = "mysql:host=localhost;charset=utf8mb4";
$user = 'root';
$pass = '';

try {
    $pdo = new PDO($dsn, $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to MySQL.\n";

    // List Databases
    $stmt = $pdo->query("SHOW DATABASES");
    $dbs = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    foreach ($dbs as $dbName) {
        if (in_array($dbName, ['information_schema', 'mysql', 'performance_schema', 'sys'])) continue;

        echo "\nChecking Database: $dbName\n";
        
        $pdo->query("USE `$dbName`");
        
        // Check for channels table
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE 'channels'");
            if ($stmt->fetch()) {
                echo "  - Table 'channels' FOUND.\n";
                // Check columns
                $stmt = $pdo->query("SHOW COLUMNS FROM channels");
                $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
                echo "  - Columns: " . implode(', ', $columns) . "\n";
                
                if (in_array('logo_url', $columns)) {
                    echo "  - [MATCH] 'logo_url' exists here.\n";
                } else {
                    echo "  - [FAIL] 'logo_url' MISSING here.\n";
                }
            } else {
                echo "  - Table 'channels' NOT found.\n";
            }
        } catch (Exception $e) {
            echo "  - Error checking tables: " . $e->getMessage() . "\n";
        }
    }

} catch (Exception $e) {
    echo "Connection Error: " . $e->getMessage() . "\n";
}
