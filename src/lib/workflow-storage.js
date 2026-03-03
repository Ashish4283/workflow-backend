import {
    getWorkflows as fetchWorkflows,
    saveWorkflow as uploadWorkflow,
    pushWorkflow,
    rollbackWorkflow
} from '../services/api.js';

/**
 * Storage Adapter Interface
 * 
 * Designed to allow future replacement with GCS/S3/NodeFS/API
 * without changing the builder or engine code.
 */

class StorageAdapter {
    async saveWorkflow(id, workflowJson, userId) { throw new Error('Not implemented'); }
    async loadWorkflow(id) { throw new Error('Not implemented'); }
    async listWorkflows(userId) { throw new Error('Not implemented'); }
    async deleteWorkflow(id) { throw new Error('Not implemented'); }
    async promoteWorkflow(id, targetEnvironment) { throw new Error('Not implemented'); }
}

/**
 * Filesystem-based Adapter Implementation (Browser Simulation)
 * 
 * Since we are in a browser environment, we cannot write directly to disk at /storage/workflows/.
 * We simulate this filesystem structure using LocalStorage with path-based keys.
 */
export class LocalBrowserAdapter extends StorageAdapter {
    constructor(basePath = 'storage/workflows/') {
        super();
        this.basePath = basePath;
    }

    _getKey(id) {
        return `${this.basePath}${id}.json`;
    }

    async saveWorkflow(id, workflowJson, userId = null) {
        try {
            const key = this._getKey(id);

            // Overwrite on save - No partial updates
            const metadata = {
                id,
                updatedAt: new Date().toISOString(),
                name: workflowJson.name || 'Untitled Workflow',
                version: workflowJson.version || 1,
                ownerId: userId || workflowJson.ownerId || 'public',
                environment: workflowJson.environment || 'draft'
            };

            const dataToSave = {
                ...workflowJson,
                ...metadata
            };

            localStorage.setItem(key, JSON.stringify(dataToSave));
            return dataToSave;
        } catch (error) {
            console.error("Storage Error:", error);
            throw new Error("Failed to save workflow locally.");
        }
    }

    async promoteWorkflow(id, targetEnvironment) {
        const workflow = await this.loadWorkflow(id);

        // Clean ID generation: Strip previous env suffix if present
        let baseId = id.replace(/_(test|draft|production)$/, '');

        const targetId = `${baseId}_${targetEnvironment}`;

        const promotedData = {
            ...workflow,
            id: targetId,
            environment: targetEnvironment,
            updatedAt: new Date().toISOString(),
            originalId: id
        };

        const key = this._getKey(targetId);
        localStorage.setItem(key, JSON.stringify(promotedData));
        return promotedData;
    }

    async loadWorkflow(id) {
        const key = this._getKey(id);
        const data = localStorage.getItem(key);
        if (!data) throw new Error(`Workflow ${id} not found.`);
        return JSON.parse(data);
    }

    async listWorkflows(userId = null) {
        const workflows = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.basePath)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    // Filter by user access if userId is provided
                    if (!userId || !data.ownerId || data.ownerId === 'public' || data.ownerId === userId) {
                        workflows.push(data);
                    }
                } catch (e) {
                    console.warn("Corrupt workflow file:", key);
                }
            }
        }
        return workflows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    async deleteWorkflow(id) {
        const key = this._getKey(id);
        localStorage.removeItem(key);
    }
}

/**
 * File System Access API Adapter (Real Local Disk)
 */
export class FileSystemAdapter extends StorageAdapter {
    constructor(directoryHandle) {
        super();
        this.directoryHandle = directoryHandle;
    }

    _getFilename(id) {
        return `${id}.json`;
    }

    async saveWorkflow(id, workflowJson, userId = null) {
        try {
            const filename = this._getFilename(id);
            const fileHandle = await this.directoryHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();

            const metadata = {
                id,
                updatedAt: new Date().toISOString(),
                name: workflowJson.name || 'Untitled Workflow',
                version: workflowJson.version || 1,
                ownerId: userId || workflowJson.ownerId || 'public',
                environment: workflowJson.environment || 'draft'
            };

            const dataToSave = { ...workflowJson, ...metadata };

            await writable.write(JSON.stringify(dataToSave, null, 2));
            await writable.close();
            return dataToSave;
        } catch (error) {
            console.error("FileSystem Save Error:", error);
            throw new Error("Failed to save to local folder.");
        }
    }

    async promoteWorkflow(id, targetEnvironment) {
        const workflow = await this.loadWorkflow(id);
        let baseId = id.replace(/_(test|draft|production)$/, '');
        const targetId = `${baseId}_${targetEnvironment}`;
        const promotedData = {
            ...workflow,
            id: targetId,
            environment: targetEnvironment,
            updatedAt: new Date().toISOString()
        };
        return this.saveWorkflow(targetId, promotedData, workflow.ownerId);
    }

    async loadWorkflow(id) {
        const filename = this._getFilename(id);
        const fileHandle = await this.directoryHandle.getFileHandle(filename);
        const file = await fileHandle.getFile();
        return JSON.parse(await file.text());
    }

    async listWorkflows(userId = null) {
        const workflows = [];
        for await (const entry of this.directoryHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                try {
                    const file = await entry.getFile();
                    const data = JSON.parse(await file.text());
                    if (data.id && data.nodes) {
                        if (!userId || !data.ownerId || data.ownerId === 'public' || data.ownerId === userId) workflows.push(data);
                    }
                } catch (e) { console.warn("Skipping invalid file:", entry.name); }
            }
        }
        return workflows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    async deleteWorkflow(id) {
        await this.directoryHandle.removeEntry(this._getFilename(id));
    }
}

/**
 * Node.js Filesystem Adapter (Server-side / Electron)
 */
export class NodeFSAdapter extends StorageAdapter {
    constructor(basePath = 'storage/workflows') {
        super();
        this.basePath = basePath;
        this.fs = null;
        this.path = null;
        this.initPromise = null;
    }

    async _ensureInit() {
        if (!this.initPromise) {
            this.initPromise = (async () => {
                // Dynamic imports to avoid bundling errors in browser environments
                this.fs = await import('node:fs/promises');
                this.path = await import('node:path');

                // Ensure directory exists
                try {
                    await this.fs.access(this.basePath);
                } catch {
                    await this.fs.mkdir(this.basePath, { recursive: true });
                }
            })();
        }
        await this.initPromise;
    }

    _getWorkflowDir(id) {
        return this.path.resolve(this.basePath, id);
    }

    async saveWorkflow(id, workflowJson, userId = null) {
        await this._ensureInit();
        try {
            const workflowDir = this._getWorkflowDir(id);

            // Ensure workflow directory exists
            try {
                await this.fs.access(workflowDir);
            } catch {
                await this.fs.mkdir(workflowDir, { recursive: true });
            }

            // Use provided version or default to 1.0
            const newVersion = String(workflowJson.version || '1.0');

            const filename = `${newVersion}.json`;
            const filePath = this.path.join(workflowDir, filename);

            const metadata = {
                id,
                updatedAt: new Date().toISOString(),
                name: workflowJson.name || 'Untitled Workflow',
                version: newVersion,
                ownerId: userId || workflowJson.ownerId || 'public',
                environment: workflowJson.environment || 'draft'
            };

            const dataToSave = { ...workflowJson, ...metadata };
            await this.fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2));
            return dataToSave;
        } catch (error) {
            console.error("NodeFS Save Error:", error);
            throw new Error("Failed to save to local disk.");
        }
    }

    async promoteWorkflow(id, targetEnvironment) {
        const workflow = await this.loadWorkflow(id);
        let baseId = id.replace(/_(test|draft|production)$/, '');
        const targetId = `${baseId}_${targetEnvironment}`;
        const promotedData = {
            ...workflow,
            id: targetId,
            environment: targetEnvironment,
            updatedAt: new Date().toISOString()
        };
        return this.saveWorkflow(targetId, promotedData, workflow.ownerId);
    }

    async loadWorkflow(id) {
        await this._ensureInit();
        const workflowDir = this._getWorkflowDir(id);

        // Get all files, filter for .json, sort by version to find latest
        const files = await this.fs.readdir(workflowDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));

        if (jsonFiles.length === 0) throw new Error("Workflow not found");

        // Sort versions descending (e.g. 1.10 > 1.2)
        jsonFiles.sort((a, b) => {
            const vA = a.replace('.json', '').split('.').map(Number);
            const vB = b.replace('.json', '').split('.').map(Number);
            if (vA[0] !== vB[0]) return vB[0] - vA[0];
            return (vB[1] || 0) - (vA[1] || 0);
        });

        const latestFile = jsonFiles[0];
        const content = await this.fs.readFile(this.path.join(workflowDir, latestFile), 'utf-8');
        return JSON.parse(content);
    }

    async listWorkflows(userId = null) {
        await this._ensureInit();
        try {
            const entries = await this.fs.readdir(this.basePath, { withFileTypes: true });

            const workflowPromises = entries
                .filter(entry => entry.isDirectory())
                .map(async (entry) => {
                    try {
                        return await this.loadWorkflow(entry.name);
                    } catch (e) {
                        return null;
                    }
                });

            const workflows = (await Promise.all(workflowPromises)).filter(w => {
                if (w === null) return false;
                return !userId || !w.ownerId || w.ownerId === 'public' || w.ownerId === userId;
            });
            return workflows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } catch (e) {
            return [];
        }
    }

    async deleteWorkflow(id) {
        await this._ensureInit();
        const workflowDir = this._getWorkflowDir(id);
        await this.fs.rm(workflowDir, { recursive: true, force: true });
    }
}

/**
 * Backend API Adapter (PHP/MySQL)
 */
export class ApiAdapter extends StorageAdapter {
    async saveWorkflow(id, workflowJson, userId = 1) {
        try {
            // Improved ID detection: IDs from DB are always numeric strings or integers
            const isNumericId = id && /^\d+$/.test(String(id));

            const payload = {
                user_id: userId,
                name: workflowJson.name || 'Untitled Workflow',
                builder_json: workflowJson,
                environment: workflowJson.environment || 'draft',
                version: workflowJson.version || 1
            };

            if (isNumericId) {
                payload.id = parseInt(id, 10);
            }

            const response = await uploadWorkflow(payload);
            const savedId = response.id;

            return {
                ...workflowJson,
                id: savedId, // Use the DB generated ID
                name: payload.name,
                ownerId: userId,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error("API Save Error:", error);
            throw new Error("Failed to save workflow to API.");
        }
    }

    async loadWorkflow(id) {
        try {
            const response = await fetchWorkflows(1); // default user_id = 1
            const workflow = response.data.find(w => String(w.id) === String(id));
            if (!workflow) throw new Error(`Workflow ${id} not found.`);
            return {
                ...workflow.builder_json,
                id: workflow.id,
                name: workflow.name,
                updatedAt: workflow.updated_at,
                environment: workflow.environment,
                version: workflow.version,
                parent_id: workflow.parent_id
            };
        } catch (e) {
            console.error("API Load Error:", e);
            throw new Error("Failed to load workflow from API.");
        }
    }

    async listWorkflows(userId = 1) {
        try {
            const response = await fetchWorkflows(userId);
            return response.data.map(w => ({
                ...w.builder_json,
                id: w.id,
                name: w.name,
                updatedAt: w.updated_at
            }));
        } catch (e) {
            console.error("API List Error:", e);
            return [];
        }
    }

    async deleteWorkflow(id) {
        console.warn("API deleteWorkflow not implemented on backend.");
    }

    async promoteWorkflow(id, targetEnvironment) {
        const response = await pushWorkflow(id, targetEnvironment);
        if (response.status === 'success') {
            return this.loadWorkflow(response.data.id);
        }
        throw new Error(response.message || "Failed to promote workflow.");
    }

    async rollbackWorkflow(id) {
        const response = await rollbackWorkflow(id);
        if (response.status === 'success') {
            return this.loadWorkflow(id);
        }
        throw new Error(response.message || "Rollback failed.");
    }
}

class StorageManager extends StorageAdapter {
    constructor() {
        super();
        // Use ApiAdapter by default to integrate with backend
        this.adapter = new ApiAdapter();
        // Fallback to local browser storage if API is unreachable can be managed here if needed
    }

    saveWorkflow(...args) { return this.adapter.saveWorkflow(...args); }
    loadWorkflow(...args) { return this.adapter.loadWorkflow(...args); }
    listWorkflows(...args) { return this.adapter.listWorkflows(...args); }
    deleteWorkflow(...args) { return this.adapter.deleteWorkflow(...args); }
    promoteWorkflow(...args) { return this.adapter.promoteWorkflow(...args); }
    rollbackWorkflow(...args) { return this.adapter.rollbackWorkflow(...args); }

    setFileSystem(handle) { this.adapter = new FileSystemAdapter(handle); return this; }
    setBrowser() { this.adapter = new LocalBrowserAdapter(); return this; }
    setNodeFS(basePath) { this.adapter = new NodeFSAdapter(basePath); return this; }
    setApi() { this.adapter = new ApiAdapter(); return this; }
}

export const storageAdapter = new StorageManager();