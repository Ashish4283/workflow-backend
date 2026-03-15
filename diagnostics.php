<?php
header('Content-Type: application/json');
$files = [
    'index.html',
    'api/admin/list-all-users.php',
    'api/db-config.php',
    'assets'
];

$results = [];
foreach ($files as $file) {
    if (file_exists($file)) {
        $results[$file] = [
            'exists' => true,
            'size' => filesize($file),
            'modified' => date("Y-m-d H:i:s", filemtime($file)),
            'timestamp' => filemtime($file)
        ];
    } else {
        $results[$file] = ['exists' => false];
    }
}

echo json_encode([
    'server_time' => date("Y-m-d H:i:s"),
    'php_version' => PHP_VERSION,
    'cwd' => getcwd(),
    'files' => $results
], JSON_PRETTY_PRINT);
?>
