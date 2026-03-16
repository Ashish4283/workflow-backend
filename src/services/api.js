const VITE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin || 'http://localhost';
const API_BASE_URL = VITE_URL.replace(/\/api\/?$/, '') + '/api';

const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('saas_token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    console.debug(`[API] FETCH ${endpoint}`, { status: response.status });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
};

// --- AUTHENTICATION API ---
export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    } catch (e) {
        throw e;
    }
};

export const register = async (name, email, password, orgName = null, isPublicClient = false, visibility = 'private') => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                password,
                org_name: orgName,
                is_public_client: isPublicClient ? 1 : 0,
                visibility: visibility
            })
        });
        return await response.json();
    } catch (e) {
        throw e;
    }
};

export const googleLogin = async (credential) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/google.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential })
        });
        return await response.json();
    } catch (e) {
        throw e;
    }
};

export const verifyOTP = async (email, otp, rememberMe = false) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, rememberMe })
        });
        return await response.json();
    } catch (e) {
        throw e;
    }
};

export const resendOTP = async (email) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/resend-otp.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return await response.json();
    } catch (e) {
        throw e;
    }
};

// --- WORKFLOW API ---

export const getWorkflows = async (page = 1, limit = 50, environment = null) => {
    try {
        let url = `/get-workflows.php?page=${page}&limit=${limit}`;
        if (environment) url += `&env=${environment}`;
        return await fetchWithAuth(url);
    } catch (error) {
        console.error("Error fetching workflows:", error);
        throw error;
    }
};

export const pushWorkflow = async (id, targetEnv) => {
    try {
        return await fetchWithAuth(`/push-workflow.php`, {
            method: 'POST',
            body: JSON.stringify({ id, target_env: targetEnv }),
        });
    } catch (error) {
        console.error("Error pushing workflow:", error);
        throw error;
    }
};

export const rollbackWorkflow = async (id) => {
    try {
        return await fetchWithAuth(`/rollback-workflow.php`, {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
    } catch (error) {
        console.error("Error rolling back workflow:", error);
        throw error;
    }
};

export const deleteWorkflow = async (id) => {
    try {
        return await fetchWithAuth(`/delete-workflow.php?id=${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error("Error deleting workflow:", error);
        throw error;
    }
};

export const saveWorkflow = async (workflowData) => {
    try {
        return await fetchWithAuth(`/save-workflow.php`, {
            method: 'POST',
            body: JSON.stringify(workflowData),
        });
    } catch (error) {
        console.error("Error saving workflow:", error);
        throw error;
    }
};

// --- DASHBOARD API ---
export const getAdminDashboardStats = async () => {
    return await fetchWithAuth(`/admin/dashboard.php`);
};

export const getUserDashboardStats = async () => {
    return await fetchWithAuth(`/user/dashboard.php`);
};

export const updateUserSettings = async (settings) => {
    return await fetchWithAuth(`/user/update-settings.php`, {
        method: 'POST',
        body: JSON.stringify(settings),
    });
};

export const addUser = async (userData) => {
    return await fetchWithAuth(`/admin/add-user.php`, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

export const generateInvite = async (type, workflowId = null, clusterId = null, targetRole = null) => {
    return await fetchWithAuth(`/invite/generate.php`, {
        method: 'POST',
        body: JSON.stringify({ type, workflow_id: workflowId, cluster_id: clusterId, target_role: targetRole }),
    });
};

export const processInvite = async (token, method = 'POST') => {
    if (method === 'GET') {
        const response = await fetch(`${API_BASE_URL}/invite/process.php?token=${token}`);
        return await response.json();
    }
    return await fetchWithAuth(`/invite/process.php?token=${token}`, {
        method: 'POST'
    });
};

export const listAllUsers = async () => {
    return await fetchWithAuth(`/admin/list-all-users.php`);
};

export const updateUserRole = async (userId, role) => {
    return await fetchWithAuth(`/admin/update-user.php`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, role }),
    });
};

export const deleteUser = async (userId) => {
    return await fetchWithAuth(`/admin/delete-user.php`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
    });
};

// --- CLUSTERS API (Normalized Groups) ---
export const listClusters = async () => {
    return await fetchWithAuth(`/admin/clusters.php`);
};

export const createCluster = async (name, description, orgId = null) => {
    return await fetchWithAuth(`/admin/clusters.php`, {
        method: 'POST',
        body: JSON.stringify({ name, description, org_id: orgId }),
    });
};

export const updateCluster = async (id, name, description) => {
    return await fetchWithAuth(`/admin/clusters.php`, {
        method: 'PUT',
        body: JSON.stringify({ id, name, description }),
    });
};

// Backwards-compatibility aliases: older code imports `listGroups/createGroup/deleteGroup`
export const listGroups = async () => {
    return await fetchWithAuth(`/admin/clusters.php`);
};

export const createGroup = async (name, description, orgId = null) => {
    return await fetchWithAuth(`/admin/clusters.php`, {
        method: 'POST',
        body: JSON.stringify({ name, description, org_id: orgId }),
    });
};

export const deleteGroup = async (id) => {
    return await fetchWithAuth(`/admin/clusters.php?id=${id}`, {
        method: 'DELETE',
    });
};

// --- ANALYTICS API ---
export const getUsageAnalytics = async () => {
    return await fetchWithAuth(`/analytics/usage.php`);
};

export const deleteCluster = async (id) => {
    return await fetchWithAuth(`/admin/clusters.php?id=${id}`, {
        method: 'DELETE',
    });
};

// --- EXECUTION MONITORING API ---
export const getExecutionLogs = async () => {
    return await fetchWithAuth(`/executions/list.php`);
};

export const logExecution = async (executionData) => {
    return await fetchWithAuth(`/executions/log.php`, {
        method: 'POST',
        body: JSON.stringify(executionData),
    });
};

// --- TASKS API ---

export const pickupTask = async (taskId) => {
    return await fetchWithAuth(`/tasks/pickup.php`, {
        method: 'POST',
        body: JSON.stringify({ id: taskId }),
    });
};

export const createTasks = async (workflowId, tasks) => {
    try {
        return await fetchWithAuth('/tasks/create.php', {
            method: 'POST',
            body: JSON.stringify({ workflow_id: workflowId, tasks }),
        });
    } catch (error) {
        console.error("Error creating tasks:", error);
        throw error;
    }
};

export const getTasks = async (status = null, clusterId = null) => {
    try {
        let url = `/tasks/list.php`;
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (clusterId) params.append('cluster_id', clusterId);
        const query = params.toString();
        if (query) url += `?${query}`;
        return await fetchWithAuth(url);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        throw error;
    }
};

export const completeTask = async (id, status, output = {}, duration = '0s') => {
    try {
        return await fetchWithAuth('/tasks/complete.php', {
            method: 'POST',
            body: JSON.stringify({ id, status, output, duration }),
        });
    } catch (error) {
        console.error("Error completing task:", error);
        throw error;
    }
};

// --- VAULT CREDENTIALS API ---
export const listCredentials = async () => {
    return await fetchWithAuth(`/credentials/list.php`);
};

export const saveCredential = async (credData) => {
    return await fetchWithAuth(`/credentials/save.php`, {
        method: 'POST',
        body: JSON.stringify(credData),
    });
};

export const assignUsersToCluster = async (userIds, clusterId) => {
    return await fetchWithAuth(`/admin/assign-cluster.php`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: userIds, cluster_id: clusterId }),
    });
};

export const createOrganization = async (name, billingTier = 'free', isPublicClient = false) => {
    return await fetchWithAuth(`/admin/create-org.php`, {
        method: 'POST',
        body: JSON.stringify({ name, billing_tier: billingTier, is_public_client: isPublicClient ? 1 : 0 }),
    });
};

export const assignUsersToOrg = async (userIds, orgId) => {
    return await fetchWithAuth(`/admin/assign-org.php`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: userIds, org_id: orgId }),
    });
};

export const assignClusterToOrg = async (clusterId, orgId) => {
    return await fetchWithAuth(`/admin/assign-cluster-org.php`, {
        method: 'POST',
        body: JSON.stringify({ cluster_id: clusterId, org_id: orgId }),
    });
};

export const listOrganizations = async () => {
    return await fetchWithAuth(`/orgs/list.php`);
};

export const deleteOrganization = async (orgId) => {
    return await fetchWithAuth(`/admin/delete-org.php`, {
        method: 'POST',
        body: JSON.stringify({ org_id: orgId }),
    });
};

export const updateOrganization = async (id, name, billingTier = 'free', isPublic = 0) => {
    return await fetchWithAuth(`/admin/update-org.php`, {
        method: 'PUT',
        body: JSON.stringify({ id, name, billing_tier: billingTier, is_public_client: isPublic }),
    });
};

export const requestToJoinOrg = async (orgId, message = '') => {
    return await fetchWithAuth(`/orgs/request.php`, {
        method: 'POST',
        body: JSON.stringify({ org_id: orgId, message }),
    });
};

export const listOrgRequests = async () => {
    return await fetchWithAuth(`/admin/org-requests.php`);
};

export const handleOrgRequest = async (requestId, action) => {
    return await fetchWithAuth(`/admin/org-requests.php`, {
        method: 'POST',
        body: JSON.stringify({ request_id: requestId, action }),
    });
};

export const assignWorkflow = async (workflowId, workerId) => {
    return await fetchWithAuth(`/admin/assign-workflow.php`, {
        method: 'POST',
        body: JSON.stringify({ workflow_id: workflowId, worker_id: workerId }),
    });
};

export const getInfrastructureMap = async () => {
    return await fetchWithAuth(`/admin/infrastructure-map.php`);
};

export const performBulkAction = async (action, userIds, extra = {}) => {
    return await fetchWithAuth(`/admin/bulk-actions.php`, {
        method: 'POST',
        body: JSON.stringify({ action, userIds, ...extra }),
    });
};
