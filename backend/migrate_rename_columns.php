<?php
require __DIR__ . '/vendor/autoload.php';

// Load Env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Database Connection
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
    echo "Connected to Database.\n";

    // Rename thumbnail_url to thumbnail_path
    $pdo->exec("ALTER TABLE channels CHANGE thumbnail_url thumbnail_path VARCHAR(255) NULL DEFAULT NULL");
    echo "Renamed thumbnail_url to thumbnail_path.\n";

    // Rename logo_url to logo_path
    $pdo->exec("ALTER TABLE channels CHANGE logo_url logo_path VARCHAR(255) NULL DEFAULT NULL");
    echo "Renamed logo_url to logo_path.\n";

    echo "Migration Successful.\n";

} catch (\PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    // Check if columns already exist/renamed roughly
    if (strpos($e->getMessage(), "Unknown column") !== false) {
        echo "Columns might be already renamed or missing.\n";
    }
}
