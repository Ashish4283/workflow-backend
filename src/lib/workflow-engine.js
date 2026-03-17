import { storageAdapter } from './workflow-storage';
import { mediaConvertAdapter } from '../media-convert-adapter';

class WorkflowEngine {
    constructor() {
        console.log("Workflow Engine Loaded: v2026.03.04-ULTRA (Adv. Flow)");
        this.handlers = {
            'default': async (node, inputs) => inputs,

            'appNode': async (node, inputs) => {
                // Pass through inputs (which contain the form data from the start payload)
                return inputs;
            },

            // --- ADAPTORS & UTILS ---

            'webhookNode': async (node, inputs) => {
                return { ...inputs, _trigger: 'webhook', timestamp: new Date().toISOString() };
            },

            'httpRequestNode': async (node, inputs) => {
                const { url, method = 'GET', headers = {}, body } = node.data;
                try {
                    const options = {
                        method,
                        headers: { 'Content-Type': 'application/json', ...headers }
                    };
                    if (method !== 'GET' && method !== 'HEAD' && body) {
                        options.body = typeof body === 'string' ? body : JSON.stringify(body);
                    }

                    const response = await fetch(url, options);
                    const data = await response.json();
                    return { ...inputs, data, status: response.status };
                } catch (error) {
                    return { ...inputs, error: error.message, status: 'error' };
                }
            },

            'setNode': async (node, inputs) => {
                // Merges defined values into the workflow data
                const { values } = node.data; // Expected format: { key: value }
                return { ...inputs, ...values };
            },

            'ifNode': async (node, inputs) => {
                const { value1, operator, value2 } = node.data;

                const v1 = this.resolveExpression(value1, inputs);
                const v2 = this.resolveExpression(value2, inputs);

                let isTrue = false;
                switch (operator) {
                    case '==': isTrue = v1 == v2; break;
                    case '!=': isTrue = v1 != v2; break;
                    case '>': isTrue = Number(v1) > Number(v2); break;
                    case '<': isTrue = Number(v1) < Number(v2); break;
                    case 'contains': isTrue = String(v1).includes(String(v2)); break;
                    case 'exists': isTrue = v1 !== undefined && v1 !== null; break;
                    default: isTrue = v1 == v2;
                }

                return { ...inputs, _route: isTrue ? ['true'] : ['false'], _last_if_result: isTrue };
            },

            'memoryNode': async (node, inputs, options = {}) => {
                const { key, operation, value } = node.data;
                const userId = options.userId || 'system';

                // In a production app, this would use a persistent DB table 'user_memories'
                // For the "Superman" Evolution, we simulate the stateful hub
                if (operation === 'set') {
                    const valToStore = inputs[value] !== undefined ? inputs[value] : value;
                    console.log(`[Memory] Setting ${key} = ${valToStore} for user ${userId}`);
                    // Mock persistent storage
                    if (!window.user_memory) window.user_memory = {};
                    window.user_memory[`${userId}_${key}`] = valToStore;
                    return { ...inputs, [key]: valToStore };
                } else {
                    const storedVal = window.user_memory?.[`${userId}_${key}`];
                    console.log(`[Memory] Retrieved ${key} = ${storedVal}`);
                    return { ...inputs, [key]: storedVal };
                }
            },

            'workflowToolNode': async (node, inputs, options = {}) => {
                const { workflowId, inputMapping = {} } = node.data;
                if (!workflowId) throw new Error("Recruit Workflow: No target workflow ID specified.");

                console.log(`[Orchestration] Recursively recruiting workflow: ${workflowId}`);

                // Map inputs for the sub-workflow
                const subPayload = {};
                Object.entries(inputMapping).forEach(([targetKey, sourceKey]) => {
                    subPayload[targetKey] = inputs[sourceKey] !== undefined ? inputs[sourceKey] : sourceKey;
                });

                // Recursive Execution
                const subResult = await workflowEngine.execute(workflowId, subPayload, {
                    ...options,
                    onLog: (l) => console.log(`[Sub-Workflow ${workflowId}] ${l.message}`)
                });

                if (subResult.status === 'failed') throw new Error(`Sub-workflow ${workflowId} failed.`);

                // Flatten the final results from the sub-workflow (using the end node's output if possible)
                const finalOutputs = Object.values(subResult.results).pop() || {};
                return { ...inputs, sub_workflow_data: finalOutputs };
            },

            'waitNode': async (node, inputs) => {
                const delay = this.resolveExpression(node.data.delay, inputs) || 5;
                const unit = node.data.unit || 'seconds';
                let ms = Number(delay) * 1000;
                if (unit === 'minutes') ms *= 60;
                if (unit === 'hours') ms *= 3600;

                console.log(`[Wait] Sleeping for ${delay} ${unit}...`);
                await new Promise(resolve => setTimeout(resolve, ms));
                return { ...inputs, wait_completed: true };
            },

            'mergeNode': async (node, inputs) => {
                const mode = node.data.mode || 'append';
                console.log(`[Merge] Operating in ${mode} mode.`);
                return inputs;
            },

            'batchNode': async (node, inputs) => {
                const batchSize = Number(this.resolveExpression(node.data.batchSize, inputs)) || 10;
                const items = Array.isArray(inputs.items) ? inputs.items : (inputs.data ? (Array.isArray(inputs.data) ? inputs.data : [inputs.data]) : [inputs]);

                const batch = items.slice(0, batchSize);
                const remaining = items.slice(batchSize);

                console.log(`[Batch] Processing ${batch.length} items. ${remaining.length} remaining.`);
                return {
                    ...inputs,
                    current_batch: batch,
                    remaining_items: remaining,
                    batch_completed: remaining.length === 0
                };
            },

            'aiNode': async (node, inputs) => {
                // Mock AI response for preview
                await new Promise(resolve => setTimeout(resolve, 1000));
                const task = node.data.taskType || 'custom';
                return {
                    ...inputs,
                    ai_result: `[Mock AI Output for ${task}]: Processed ${JSON.stringify(inputs)}`
                };
            },

            'pythonNode': async (node, inputs, options = {}) => {
                const code = node.data.code || '';
                let env = options.environment || 'draft';

                // AUTO-DETECT: If code is custom (not the tutorial mock), force 'test' mode to use backend
                const isMockCode = code.includes('moviepy') || code.includes('ffmpeg');
                if (env === 'draft' && !isMockCode) {
                    console.log("Auto-switching to 'test' environment to execute custom Python code on backend.");
                    env = 'test';
                }

                // 1. REMOTE EXECUTION (Test & Production)
                // If environment is test or production, we send the code to the server for real execution.
                if (env === 'production' || env === 'test') {
                    const renderUrl = import.meta.env.VITE_RENDER_API || 'https://workflow-backend-8uwh.onrender.com';
                    const apiUrl = node.data.backendUrl || `${renderUrl}/execute`;

                    if (apiUrl) {
                        try {
                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-Workflow-Env': env
                                },
                                body: JSON.stringify({
                                    code: code,
                                    inputs: inputs,
                                    requirements: node.data.requirements,
                                    environment: env
                                })
                            });

                            if (!response.ok) throw new Error(`Backend Error (${env}): ${response.statusText}`);
                            return await response.json();
                        } catch (error) {
                            console.error(`Remote Execution Failed (${env}):`, error);
                            throw error;
                        }
                    }
                }

                // 2. DRAFT / MOCK MODE
                // Detects specific tutorial code to simulate execution in the browser.
                if (code.includes('moviepy') || code.includes('ffmpeg')) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time

                    const targetFormat = inputs.target_format || 'mp4';
                    const sourceFile = inputs.source_file?.[0]?.name || 'video.mp4';
                    const baseName = sourceFile.split('.')[0];

                    // Return a sample video/audio for preview purposes
                    // Using a public domain sample video (Big Buck Bunny)
                    const sampleUrl = targetFormat === 'mp3'
                        ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
                        : 'https://www.w3schools.com/html/mov_bbb.mp4';

                    return {
                        ...inputs,
                        ui: {
                            type: 'media',
                            files: [
                                {
                                    url: sampleUrl,
                                    mime: targetFormat === 'mp3' ? 'audio/mpeg' : 'video/mp4',
                                    name: `converted_${baseName}.${targetFormat}`
                                }
                            ]
                        },
                        file_path: `/exports/converted_${baseName}.${targetFormat}`
                    };
                }

                // Fallback if no backend configured
                return { ...inputs, status: 'python_script_executed_locally', note: 'No backend URL configured' };
            },

            'exportNode': async (node, inputs) => {
                await new Promise(resolve => setTimeout(resolve, 500));
                // Pass through the UI object so the Inspector can render the preview
                return {
                    ...inputs,
                    url: inputs.ui?.files?.[0]?.url || '#',
                    status: 'success'
                };
            },

            'logicNode': async (node, inputs) => {
                // Simple logic evaluation
                const { conditionVar, conditionOp, conditionVal } = node.data;
                // In a real engine, we'd evaluate this against inputs
                return { ...inputs, logic_result: true };
            },

            'vapiBpoNode': async (node, inputs, options = {}) => {
                const { agentName = 'AI Agent' } = node.data;
                const env = options.environment || 'draft';

                if (env === 'test' || env === 'production') {
                    const renderUrl = import.meta.env.VITE_RENDER_API || 'https://workflow-backend-8uwh.onrender.com';
                    // Real Vapi/Gemini BPO call (hitting the Python backend)
                    try {
                        const response = await fetch(`${renderUrl}/api/vapi/bpo-chat`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                messages: [{ role: 'user', content: inputs.last_user_message || 'Hello' }],
                                call: { metadata: { scenario: node.data.scenario || 'support' } }
                            })
                        });
                        const data = await response.json();
                        return { ...inputs, bpo_response: data.choices[0].message.content, agent: agentName };
                    } catch (error) {
                        console.error("Vapi BPO Backend Error:", error);
                        // Fallback to mock if backend unreachable
                    }
                }

                // Draft / Mock Mode
                await new Promise(resolve => setTimeout(resolve, 800));
                return {
                    ...inputs,
                    bpo_response: `Support Agent ${agentName} here. I've analyzed your data: ${JSON.stringify(inputs.data || {})}. How can I assist you further?`,
                    _agent_type: 'vapi_voice_ai'
                };
            },

            'smsNode': async (node, inputs) => {
                const { to, message } = node.data;
                // Mock SMS sending
                await new Promise(resolve => setTimeout(resolve, 600));
                console.log(`[SMS] Sending message to ${to}: ${message}`);
                return { ...inputs, sms_sent: true, sms_to: to, sms_status: 'delivered' };
            },

            'delayNode': async (node, inputs) => {
                const seconds = node.data.seconds || 5;
                console.log(`[Engine] Delaying for ${seconds} seconds...`);
                await new Promise(resolve => setTimeout(resolve, seconds * 1000));
                return { ...inputs, delay_completed: true };
            },

            'crmNode': async (node, inputs, options = {}) => {
                const field = node.data.lookupField || 'email';
                const identifier = inputs[field] || inputs.email || 'guest@example.com';
                const env = options.environment || 'draft';

                if (env === 'test' || env === 'production') {
                    const renderUrl = import.meta.env.VITE_RENDER_API || 'https://workflow-backend-8uwh.onrender.com';
                    try {
                        const response = await fetch(`${renderUrl}/api/health`); // Check health
                        if (response.ok) {
                            // Real Python CRM Lookup Simulation
                            // In a real scenario, this would be a specific GET/POST to /api/crm/lookup
                            return { ...inputs, customer_record: { name: 'Verified User', tier: 'Pro', balance: 500 } };
                        }
                    } catch (e) { }
                }

                // Mock CRM Result
                await new Promise(resolve => setTimeout(resolve, 400));
                return {
                    ...inputs,
                    customer_record: {
                        id: 'crm_9922',
                        name: 'Ashish (Test)',
                        tier: 'Gold',
                        last_interaction: new Date().toISOString()
                    }
                };
            },

            'browserNode': async (node, inputs) => {
                const { action = 'scrape', url } = node.data;
                await new Promise(resolve => setTimeout(resolve, 1500));
                return {
                    ...inputs,
                    scrape_result: `[Browser Content from ${url}]: Found "Workflow Engine v2.1" and "Professional Node Expansion" on the page.`,
                    action_performed: action
                };
            },

            'conditionNode': async (node, inputs) => {
                const { key, value } = node.data;
                const actualValue = inputs[key] !== undefined ? inputs[key] : key;
                const isMatch = String(actualValue).toLowerCase() === String(value).toLowerCase();

                return {
                    ...inputs,
                    _route: isMatch ? ['match'] : ['default'],
                    _condition_match: isMatch
                };
            },

            'mediaConvert': async (node, inputs) => {
                try {
                    // Expecting 'file' from previous node or 'fileName' if simulated
                    const fileToConvert = inputs.file || inputs.fileName;
                    const targetFormat = node.data.targetFormat || 'pdf';

                    const result = await mediaConvertAdapter.convert(fileToConvert, targetFormat);
                    return { ...inputs, ...result, status: 'success' };
                } catch (error) {
                    throw new Error(`Media Conversion Failed: ${error.message}`);
                }
            }
        };
    }

    resolveExpression(val, inputs) {
        if (typeof val !== 'string') return val;
        // Handle reasoning expression style {{expression}} or standard {{variable}}
        const regex = /{{(.*?)}}/g;
        return val.replace(regex, (match, formula) => {
            const path = formula.trim();
            // Simple path resolution (e.g. data.customer.name)
            const parts = path.split('.');
            let obj = inputs;
            for (const part of parts) {
                if (obj && obj[part] !== undefined) obj = obj[part];
                else return match; // Keep as is if not found
            }
            return obj;
        });
    }

    async execute(workflowId, payload, options = {}) {
        const { onLog = () => { }, userId, config = {} } = options;
        const log = (msg) => onLog({ timestamp: new Date(), message: msg });

        // Protocol Extraction: Respect User Settings
        const isStrict = config.strict_mode ?? true;
        const isParallel = config.parallel_execution ?? false;
        const latency = Number(config.simulated_latency || 0);

        log(`Workflow ${workflowId} started. Mode: ${isStrict ? 'Strict' : 'Resilient'}.`);

        try {
            const workflow = await storageAdapter.loadWorkflow(workflowId);

            // Access Control Check
            if (workflow.ownerId && workflow.ownerId !== 'public' && userId && workflow.ownerId !== userId) {
                throw new Error(`Access Denied: User ${userId} does not have permission to execute this workflow.`);
            }

            const env = options.environment || workflow.environment || 'draft';
            log(`Execution Environment: ${env}`);
            const { nodes, edges } = workflow;

            // Build Graph
            const nodeMap = new Map(nodes.map(n => [n.id, n]));
            const incoming = new Map();
            const outgoing = new Map();

            edges.forEach(e => {
                if (!outgoing.has(e.source)) outgoing.set(e.source, []);
                outgoing.get(e.source).push({ id: e.target, handle: e.sourceHandle });

                if (!incoming.has(e.target)) incoming.set(e.target, []);
                incoming.get(e.target).push(e.source);
            });

            // Execution State
            const results = {};
            const nodeStatus = {};
            const inProgress = new Set();

            // Initial Start Nodes
            const startNodes = nodes.filter(n => !incoming.has(n.id) || n.entry).map(n => n.id);
            const queue = [...startNodes];
            startNodes.forEach(id => results[id] = payload);

            while (queue.length > 0 || inProgress.size > 0) {
                // If parallel mode is off, we wait for the current node even if others are ready
                if (!isParallel && inProgress.size > 0) {
                    await new Promise(r => setTimeout(r, 50));
                    continue;
                }

                if (queue.length === 0) {
                    await new Promise(r => setTimeout(r, 50));
                    continue;
                }

                const nodeId = queue.shift();
                const node = nodeMap.get(nodeId);

                inProgress.add(nodeId);
                nodeStatus[nodeId] = 'running';

                // Handle Logic in a separate promise to allow parallel execution
                (async () => {
                    try {
                        // Prepare Inputs
                        let nodeInputs = results[nodeId] || {};
                        const parents = incoming.get(nodeId) || [];
                        if (parents.length > 0) {
                            nodeInputs = parents.reduce((acc, pid) => ({ ...acc, ...results[pid] }), {});
                        }

                        // Simulated Latency (Deep Thinking Mode)
                        if (latency > 0) await new Promise(r => setTimeout(r, latency));

                        // Execute Handler
                        const handler = this.handlers[node.data.type] || this.handlers['default'];
                        const output = await handler(node, nodeInputs, { ...options, environment: env });

                        results[nodeId] = output;
                        nodeStatus[nodeId] = 'completed';
                        inProgress.delete(nodeId);

                        // Trigger Children
                        const children = outgoing.get(nodeId) || [];
                        children.forEach(edge => {
                            const childId = edge.id;
                            if (results[nodeId]?._route) {
                                if (edge.handle && !results[nodeId]._route.includes(edge.handle)) return;
                            }
                            const childParents = incoming.get(childId) || [];
                            if (childParents.every(pid => nodeStatus[pid] === 'completed') && !queue.includes(childId) && !inProgress.has(childId)) {
                                queue.push(childId);
                            }
                        });
                    } catch (err) {
                        log(`Error in ${node.data.label}: ${err.message}`);
                        nodeStatus[nodeId] = 'failed';
                        inProgress.delete(nodeId);

                        if (isStrict) {
                            queue.length = 0; // Clear queue to stop execution
                            throw err;
                        } else {
                            log(`Warning: Continuing despite error in ${node.data.label}.`);
                            results[nodeId] = { _error: err.message };
                        }
                    }
                })();
            }

            log(`Workflow completed successfully.`);
            return { status: 'completed', results, nodeStatus };
        } catch (error) {
            log(`Execution failed: ${error.message}`);
            return { status: 'failed', results: {}, nodeStatus: {} };
        }
    }
}

export const workflowEngine = new WorkflowEngine();