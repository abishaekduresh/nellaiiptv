<?php
require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load .env
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$db   = $_ENV['DB_DATABASE'];
$user = $_ENV['DB_USERNAME'];
$pass = $_ENV['DB_PASSWORD'];
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
     
     echo "Applying migration...\n";
     
     $sql = "ALTER TABLE subscription_plans 
             ADD COLUMN reseller_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER price,
             ADD COLUMN features JSON DEFAULT NULL AFTER platform_access";
     
     $pdo->exec($sql);
     
     echo "Migration applied successfully!\n";
} catch (\PDOException $e) {
     if ($e->getCode() == '42S21') {
         echo "Columns already exist.\n";
     } else {
         echo "Migration failed: " . $e->getMessage() . "\n";
     }
}
