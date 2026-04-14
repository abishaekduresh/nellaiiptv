<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=nellaiiptv', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $pdo->exec('ALTER TABLE channels ADD COLUMN share_code VARCHAR(6) UNIQUE AFTER channel_number;');
    echo "Added share_code column.\n";
} catch (Exception $e) {
    echo "Column might already exist: " . $e->getMessage() . "\n";
}

$pdo->exec("UPDATE channels SET share_code = LPAD(FLOOR(RAND() * 900000 + 100000), 6, '0') WHERE share_code IS NULL;");
echo "Updated share_codes.\n";
