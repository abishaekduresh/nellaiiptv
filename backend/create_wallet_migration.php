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
     
     echo "Applying Wallet Migration...\n";
     
     // 1. Add wallet_balance to customers
     try {
         $sql1 = "ALTER TABLE customers ADD COLUMN wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER subscription_expires_at";
         $pdo->exec($sql1);
         echo "Added wallet_balance column.\n";
     } catch (\PDOException $e) {
         if ($e->getCode() == '42S21') {
             echo "wallet_balance column already exists.\n";
         } else {
             // 42000 often means dup column too in some versions
             echo "Info (Column add): " . $e->getMessage() . "\n";
         }
     }

     // 2. Create wallet_transactions table WITHOUT FK first to avoid blocking errors
     // We use INT(11) to match customers
     $sql2 = "CREATE TABLE IF NOT EXISTS wallet_transactions (
         id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
         customer_id INT(11) NOT NULL,
         type ENUM('credit', 'debit') NOT NULL,
         amount DECIMAL(10,2) NOT NULL,
         description VARCHAR(255) DEFAULT NULL,
         reference_id VARCHAR(100) DEFAULT NULL,
         balance_after DECIMAL(10,2) DEFAULT 0.00,
         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
         INDEX (customer_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
     
     $pdo->exec($sql2);
     echo "wallet_transactions table created.\n";
     
     echo "Migration completed successfully!\n";
} catch (\PDOException $e) {
     echo "Migration failed: " . $e->getMessage() . "\n";
}
