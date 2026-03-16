<?php
require_once '../db-config.php';
require_once '../auth-guard.php';

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // 1. Authenticate user via JWT
    $userPayload = authenticate_request();
    
    // 2. Allow Super Admin, Admin and Manager
    require_role($userPayload, ['super_admin', 'admin', 'manager']);
    $role = $userPayload['role'];

    // Fetch System-wide Stats
    $stats = [];
    $org_id = $userPayload['org_id'];
    
    if ($role === 'super_admin') {
        // ... (existing)
        // Total SaaS Users
        $userCountStmt = $pdo->query("SELECT COUNT(*) FROM users");
        $stats['total_users'] = (int)$userCountStmt->fetchColumn();
        
        // Total Admins
        $adminCountStmt = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
        $stats['total_admins'] = (int)$adminCountStmt->fetchColumn();

        // Total Workflows
        $workflowCountStmt = $pdo->query("SELECT COUNT(*) FROM workflows");
        $stats['total_workflows'] = (int)$workflowCountStmt->fetchColumn();

        // Total Organizations
        $orgCountStmt = $pdo->query("SELECT COUNT(*) FROM organizations");
        $stats['total_orgs'] = (int)$orgCountStmt->fetchColumn();

        // Fetch Recent SaaS Users + Org Context
        $recentUsersSql = "SELECT u.id, u.name, u.email, u.role, u.created_at, o.name as org_name 
                           FROM users u 
                           LEFT JOIN organizations o ON u.org_id = o.id 
                           ORDER BY u.created_at DESC LIMIT 50";
        $recentUsersStmt = $pdo->query($recentUsersSql);
        $recentUsers = $recentUsersStmt->fetchAll(PDO::FETCH_ASSOC);

        $orgsStmt = $pdo->query("SELECT * FROM organizations ORDER BY created_at DESC");
        $organizations = $orgsStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($organizations as &$org) {
            $cStmt = $pdo->prepare("SELECT id, name, (SELECT COUNT(*) FROM workflows WHERE cluster_id = clusters.id) as workflow_count FROM clusters WHERE org_id = ?");
            $cStmt->execute([$org['id']]);
            $org['clusters'] = $cStmt->fetchAll(PDO::FETCH_ASSOC);
        }
    } elseif ($role === 'admin') {
        // Restricted view for Admins: Show Org data if they have one, else show their managed data
        if ($org_id) {
            // Total Users in Org
            $uStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE org_id = ?");
            $uStmt->execute([$org_id]);
            $stats['total_users'] = (int)$uStmt->fetchColumn();

            // Total Workflows in Org
            $wStmt = $pdo->prepare("SELECT COUNT(*) FROM workflows WHERE cluster_id IN (SELECT id FROM clusters WHERE org_id = ?)");
            $wStmt->execute([$org_id]);
            $stats['total_workflows'] = (int)$wStmt->fetchColumn();

            // Recent Users in Org
            $rStmt = $pdo->prepare("SELECT u.id, u.name, u.email, u.role, u.created_at, o.name as org_name 
                                    FROM users u 
                                    JOIN organizations o ON u.org_id = o.id 
                                    WHERE u.org_id = ?
                                    ORDER BY u.created_at DESC LIMIT 50");
            $rStmt->execute([$org_id]);
            $recentUsers = $rStmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch self-org details
            $oStmt = $pdo->prepare("SELECT * FROM organizations WHERE id = ?");
            $oStmt->execute([$org_id]);
            $org = $oStmt->fetch(PDO::FETCH_ASSOC);
            if ($org) {
                $cStmt = $pdo->prepare("SELECT id, name, (SELECT COUNT(*) FROM workflows WHERE cluster_id = clusters.id) as workflow_count FROM clusters WHERE org_id = ?");
                $cStmt->execute([$org_id]);
                $org['clusters'] = $cStmt->fetchAll(PDO::FETCH_ASSOC);
                $organizations = [$org];
            } else {
                $organizations = [];
            }
        } else {
            // Admin with no Org: fallback to managed users
            $uStmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE manager_id = ?");
            $uStmt->execute([$userPayload['id']]);
            $stats['total_users'] = (int)$uStmt->fetchColumn();
            
            $stats['total_workflows'] = 0;
            $recentUsers = [];
            $organizations = [];
        }
    } elseif ($role === 'manager') {
        // Restricted view for Managers (Cluster Scoped)
        $userId = $userPayload['id'];
        
        // Total Users in Manager's Clusters
        $uStmt = $pdo->prepare("SELECT COUNT(DISTINCT user_id) FROM cluster_members WHERE cluster_id IN (SELECT cluster_id FROM cluster_members WHERE user_id = ? AND role = 'manager')");
        $uStmt->execute([$userId]);
        $stats['total_users'] = (int)$uStmt->fetchColumn();

        // Total Workflows in Manager's Clusters
        $wStmt = $pdo->prepare("SELECT COUNT(*) FROM workflows WHERE cluster_id IN (SELECT cluster_id FROM cluster_members WHERE user_id = ? AND role = 'manager')");
        $wStmt->execute([$userId]);
        $stats['total_workflows'] = (int)$wStmt->fetchColumn();

        // Recent Users in Manager's Clusters
        $rStmt = $pdo->prepare("SELECT u.id, u.name, u.email, u.role, u.created_at, o.name as org_name 
                                FROM users u 
                                LEFT JOIN organizations o ON u.org_id = o.id 
                                WHERE u.id IN (SELECT user_id FROM cluster_members WHERE cluster_id IN (SELECT cluster_id FROM cluster_members WHERE user_id = ?))
                                ORDER BY u.created_at DESC LIMIT 50");
        $rStmt->execute([$userId]);
        $recentUsers = $rStmt->fetchAll(PDO::FETCH_ASSOC);
        $organizations = [];
    }

    // 4. Global Audit Logs (Most recent 20)
    $auditStmt = $pdo->query("SELECT a.*, u.name as user_name FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT 20");
    $auditLogs = $auditStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "stats" => $stats,
            "recent_users" => $recentUsers,
            "organizations" => $organizations,
            "audit_logs" => $auditLogs
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Admin Dashboard Error: " . $e->getMessage());
    echo json_encode(["status" => "error", "message" => "Could not fetch dashboard metrics."]);
}
?>
