<?php
require __DIR__ . '/vendor/autoload.php';

// Try to load env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use Illuminate\Database\Capsule\Manager as Capsule;

$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => 'mysql',
    'host'      => $_ENV['DB_HOST'],
    'database'  => $_ENV['DB_DATABASE'],
    'username'  => $_ENV['DB_USERNAME'],
    'password'  => $_ENV['DB_PASSWORD'],
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

$setting = Capsule::table('settings')->where('setting_key', 'is_open_access')->first();

if ($setting) {
    echo "SETTING FOUND:\n";
    echo "Key: " . $setting->setting_key . "\n";
    echo "Value: [" . $setting->setting_value . "]\n";
    echo "Type: " . gettype($setting->setting_value) . "\n";
} else {
    echo "SETTING NOT FOUND: is_open_access\n";
}
