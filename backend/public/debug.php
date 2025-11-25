<?php
// public/debug.php

echo "<h1>Debug Info</h1>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";

require __DIR__ . '/../vendor/autoload.php';

echo "Autoload loaded.<br>";

if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "Opcache reset.<br>";
} else {
    echo "Opcache not enabled or function unavailable.<br>";
}

if (class_exists('Dotenv\Dotenv')) {
    echo "SUCCESS: Dotenv class found.<br>";
} else {
    echo "ERROR: Dotenv class NOT found.<br>";
}

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    echo "Dotenv instantiated.<br>";
} catch (Throwable $e) {
    echo "Dotenv instantiation failed: " . $e->getMessage() . "<br>";
}
