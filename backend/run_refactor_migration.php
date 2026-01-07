<?php
// Load .env
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[$name] = trim($value);
    }
}

$host = $_ENV['DB_HOST'] ?? 'localhost';
$db   = $_ENV['DB_DATABASE'] ?? 'nellaiiptv';
$user = $_ENV['DB_USERNAME'] ?? 'root';
$pass = $_ENV['DB_PASSWORD'] ?? '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    $sql = file_get_contents(__DIR__ . '/database/migrations/rename_is_paid_to_is_premium.sql');
    
    // Check if column exists first to avoid error if re-running
    $stmt = $pdo->query("SHOW COLUMNS FROM channels LIKE 'is_paid'");
    $exists = $stmt->fetch();
    
    if ($exists) {
        $pdo->exec($sql);
        echo "Migration successful: Renamed is_paid to is_premium.\n";
    } else {
        // Check if is_premium already exists
        $stmt = $pdo->query("SHOW COLUMNS FROM channels LIKE 'is_premium'");
        $existsPremium = $stmt->fetch();
        if ($existsPremium) {
            echo "Migration skipped: is_premium already exists.\n";
        } else {
            echo "Error: is_paid column not found and is_premium does not exist.\n";
        }
    }

} catch (\PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
