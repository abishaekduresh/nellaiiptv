<?php

use DI\Container;
use DI\Bridge\Slim\Bridge as SlimAppFactory;
use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container as IlluminateContainer;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Psr\Log\LoggerInterface;

require __DIR__ . '/../vendor/autoload.php';

// Load Environment Variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Create Container
$container = new Container();

// Configure Database (Eloquent)
$container->set('db', function () {
    $capsule = new Capsule;
    $capsule->addConnection([
        'driver'    => $_ENV['DB_DRIVER'] ?? 'mysql',
        'host'      => $_ENV['DB_HOST'] ?? '127.0.0.1',
        'database'  => $_ENV['DB_DATABASE'] ?? 'nellai_iptv',
        'username'  => $_ENV['DB_USERNAME'] ?? 'root',
        'password'  => $_ENV['DB_PASSWORD'] ?? '',
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix'    => '',
    ]);

    $capsule->setEventDispatcher(new Dispatcher(new IlluminateContainer));
    $capsule->setAsGlobal();
    $capsule->bootEloquent();

    // Configure Paginator
    \Illuminate\Pagination\Paginator::currentPathResolver(function () {
        return isset($_SERVER['REQUEST_URI']) ? strtok($_SERVER['REQUEST_URI'], '?') : '/';
    });

    \Illuminate\Pagination\Paginator::currentPageResolver(function ($pageName = 'page') {
        $page = isset($_GET[$pageName]) ? $_GET[$pageName] : 1;
        return filter_var($page, FILTER_VALIDATE_INT) !== false && (int) $page >= 1 ? (int) $page : 1;
    });

    return $capsule;
});

// Configure Monolog
$container->set(LoggerInterface::class, function () {
    $logger = new Logger($_ENV['APP_NAME'] ?? 'NellaiIPTV');
    $logger->pushHandler(new StreamHandler(__DIR__ . '/../logs/app.log', Logger::DEBUG));
    return $logger;
});

// Create App
$app = SlimAppFactory::create($container);

// Initialize Database
$container->get('db');

return $app;
