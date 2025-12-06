<?php
// Test stream status directly without going through the full application
require __DIR__ . '/../vendor/autoload.php';

$url = $_GET['url'] ?? 'https://stream.thendraladz.com/hls/tv.m3u8';

header('Content-Type: application/json');

function checkStreamStatus($hlsUrl) {
    $hlsUrl = trim($hlsUrl);
    if (empty($hlsUrl)) {
        return ['success' => false, 'error' => 'Empty URL'];
    }

    $debugInfo = [];
    
    $check = function ($method) use ($hlsUrl, &$debugInfo) {
        $ch = curl_init($hlsUrl);
        curl_setopt($ch, CURLOPT_NOBODY, $method === 'HEAD');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        curl_setopt($ch, CURLOPT_ENCODING, '');
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

        if ($method === 'GET') {
            curl_setopt($ch, CURLOPT_RANGE, '0-1023');
        }

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        $debugInfo[] = [
            'method' => $method,
            'http_code' => $httpCode,
            'error' => $error
        ];

        return $httpCode;
    };

    $httpCode = $check('HEAD');
    if ($httpCode !== 200) {
        $httpCode = $check('GET');
    }

    $isOnline = ($httpCode >= 200 && $httpCode < 400);

    return [
        'success' => true,
        'url' => $hlsUrl,
        'is_online' => $isOnline,
        'debug' => $debugInfo
    ];
}

echo json_encode(checkStreamStatus($url), JSON_PRETTY_PRINT);
