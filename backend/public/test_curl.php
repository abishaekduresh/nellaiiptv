<?php
// backend/public/test_curl.php

$url = $_GET['url'] ?? '';

if (empty($url)) {
    die('Please provide a URL parameter, e.g., ?url=http://example.com');
}

echo "<h2>Testing URL: " . htmlspecialchars($url) . "</h2>";

function test_curl($url, $method) {
    echo "<h3>Method: $method</h3>";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_NOBODY, $method === 'HEAD');
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    curl_setopt($ch, CURLOPT_ENCODING, ''); // Handle compression
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); // Force IPv4
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    
    if ($method === 'GET') {
        curl_setopt($ch, CURLOPT_RANGE, '0-1023');
    }

    $verbose = fopen('php://temp', 'w+');
    curl_setopt($ch, CURLOPT_STDERR, $verbose);

    $start = microtime(true);
    $result = curl_exec($ch);
    $end = microtime(true);
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);

    echo "<strong>HTTP Code:</strong> $httpCode<br>";
    echo "<strong>Time:</strong> " . round($end - $start, 4) . "s<br>";
    
    if ($errno) {
        echo "<strong style='color:red'>cURL Error ($errno):</strong> $error<br>";
    } else {
        echo "<strong style='color:green'>Success</strong><br>";
    }

    rewind($verbose);
    $verboseLog = stream_get_contents($verbose);
    echo "<pre style='background:#f0f0f0; padding:10px; border:1px solid #ccc'>" . htmlspecialchars($verboseLog) . "</pre>";
}

test_curl($url, 'HEAD');
test_curl($url, 'GET');
