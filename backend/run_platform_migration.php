<?php
require __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
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
    
    $sql = file_get_contents(__DIR__ . '/database/migrations/add_allowed_platforms.sql');
    
    // Check if column exists first to avoid error
    $check = $pdo->query("SHOW COLUMNS FROM channels LIKE 'allowed_platforms'");
    if ($check->rowCount() == 0) {
        $pdo->exec($sql);
        echo "Migration applied: allowed_platforms column added.\n";
    } else {
        echo "Column allowed_platforms already exists. Skipping.\n";
    }

} catch (\PDOException $e) {
    echo "Migration failed: " . $e->getMessage();
    exit(1);
}
