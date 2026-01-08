<?php
require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database connection
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
    echo "Connected to database successfully.\n";

    // Read SQL file
    $sqlFile = __DIR__ . '/database/migrations/create_customer_activity_logs_table.sql';
    if (!file_exists($sqlFile)) {
        die("SQL file not found at $sqlFile\n");
    }

    $sql = file_get_contents($sqlFile);

    // Execute SQL
    $pdo->exec($sql);
    echo "Migration executed successfully: customer_activity_logs table created.\n";

} catch (\PDOException $e) {
    die("Database error: " . $e->getMessage() . "\n");
}
