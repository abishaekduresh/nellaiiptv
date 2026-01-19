<?php
// migrate_logo.php

// Database credentials (assuming defaults for WAMP based on typical setup or trying to load env)
$host = 'localhost';
$db   = 'nellai_iptv';
$user = 'root'; // WAMP default
$pass = '';     // WAMP default is often empty, or check .env if this fails
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    echo "Connected to database.\n";
    
    // Check if column exists first to avoid error
    $stmt = $pdo->query("SHOW COLUMNS FROM channels LIKE 'logo_url'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        echo "Column 'logo_url' already exists.\n";
    } else {
        $sql = "ALTER TABLE channels ADD COLUMN logo_url VARCHAR(255) DEFAULT NULL AFTER thumbnail_url";
        $pdo->exec($sql);
        echo "Column 'logo_url' added successfully.\n";
    }

} catch (\PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
