<?php
$logFile = __DIR__ . '/debug_slim.log';
if (file_exists($logFile)) {
    echo file_get_contents($logFile);
} else {
    echo "Log file not found.";
}
