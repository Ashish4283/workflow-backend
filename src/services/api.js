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

export const register = async (name, email, password) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
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

// --- WORKFLOW API ---

export const getWorkflows = async (page = 1, limit = 50) => {
    try {
        // Uses the authenticated fetch mapping to current user
        return await fetchWithAuth(`/get-workflows.php?page=${page}&limit=${limit}`);
    } catch (error) {
        console.error("Error fetching workflows:", error);
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

export const addUser = async (userData) => {
    return await fetchWithAuth(`/admin/add-user.php`, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

export const generateInvite = async (type, workflowId = null) => {
    return await fetchWithAuth(`/invite/generate.php`, {
        method: 'POST',
        body: JSON.stringify({ type, workflow_id: workflowId }),
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

// --- GROUPS API ---
export const listGroups = async () => {
    return await fetchWithAuth(`/admin/groups.php`);
};

export const createGroup = async (name, description) => {
    return await fetchWithAuth(`/admin/groups.php`, {
        method: 'POST',
        body: JSON.stringify({ name, description }),
    });
};

export const updateGroup = async (id, name, description) => {
    return await fetchWithAuth(`/admin/groups.php`, {
        method: 'PUT',
        body: JSON.stringify({ id, name, description }),
    });
};

export const deleteGroup = async (id) => {
    return await fetchWithAuth(`/admin/groups.php?id=${id}`, {
        method: 'DELETE',
    });
};

export const assignUsersToGroup = async (userIds, groupId) => {
    return await fetchWithAuth(`/admin/assign-group.php`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: userIds, group_id: groupId }),
    });
};
