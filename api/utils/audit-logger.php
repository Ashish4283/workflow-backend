<?php
// api/utils/audit-logger.php

function log_audit($action, $userId = null, $metadata = null, $severity = 'info') {
    global $pdo;
    
    if (!$pdo) {
        require_once __DIR__ . '/../db-config.php';
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO audit_logs (user_id, action, metadata, severity) VALUES (?, ?, ?, ?)");
        $metaStr = is_string($metadata) ? $metadata : json_encode($metadata);
        $stmt->execute([$userId, $action, $metaStr, $severity]);
        return true;
    } catch (Throwable $e) {
        error_log("Audit Log Failure: " . $e->getMessage());
        return false;
    }
}
