import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Brain, Webhook, FileText, FileJson, GitBranch, GitMerge, Play, Save, Settings, ChevronLeft, ChevronRight, History, Activity, Download, Cloud, Monitor, Wand2, AlertTriangle, FolderOpen, Upload, Copy, Trash2, Check, HardDrive, ExternalLink, Plus, X, Code, FileCode, ArrowRight, ArrowLeft, FileVideo, Shield, Phone, MessageSquare, Clock, Users, Search, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import Inspector from './Inspector';
import AIWorkflowPlanner from './AIWorkflowPlanner';
import { storageAdapter } from '@/lib/workflow-storage';
import { workflowEngine } from '@/lib/workflow-engine';
import WorkflowNode from '../workflow/nodes';

const NODE_POLICIES = {
  fileNode: { required: ['fileName'], defaults: { fileName: '', fileSize: '' } },
  driveNode: { required: ['fileId'], defaults: { oauthConnected: false } },
  dataNode: { required: ['operation'], defaults: { operation: 'mapping' } },
  apiNode: { required: ['url'], defaults: { url: 'https://api.example.com', method: 'GET' } },
  aiNode: { required: ['config'], defaults: { taskType: 'custom', config: 'You are a helpful assistant.' } },
  appNode: { required: ['appTitle'], defaults: { appTitle: 'New App', fields: [] } },
  customNode: { required: ['code'], defaults: { code: '// Access previous data via `data` variable\n// Return an object to pass to next node\nreturn { result: true };' } },
  pythonNode: { required: ['code'], defaults: { code: '# Access previous data via `data` variable\n# Return a dictionary to pass to next node\ndef main(data):\n    # Train your model here\n    return { "status": "success" }', requirements: 'pandas\nnumpy', backendUrl: 'https://workflow-backend-8uwh.onrender.com/execute' } },
  logicNode: { required: ['conditionVar', 'conditionOp', 'conditionVal'], defaults: { conditionOp: '==' } },
  ifNode: { required: ['value1', 'operator', 'value2'], defaults: { value1: '', operator: '==', value2: '' } },
  memoryNode: { required: ['key', 'operation'], defaults: { operation: 'get', key: '', value: '' } },
  workflowToolNode: { required: ['workflowId'], defaults: { workflowId: '', inputMapping: {} } },
  exportNode: { required: ['destination'], defaults: { destination: 'drive', format: 'csv' } },
  mediaConvert: { required: [], defaults: { targetFormat: 'pdf' } },
  waitNode: { required: ['delay'], defaults: { delay: 5, unit: 'seconds' } },
  mergeNode: { required: ['mode'], defaults: { mode: 'append' } },
  batchNode: { required: ['batchSize'], defaults: { batchSize: 10 } },
  vapiBpoNode: { required: ['agentId'], defaults: { agentId: '', agentName: 'Global Support Agent' } },
  smsNode: { required: ['to', 'message'], defaults: { to: '', message: '' } },
  delayNode: { required: ['seconds'], defaults: { seconds: 5 } },
  crmNode: { required: ['lookupField'], defaults: { lookupField: 'email' } },
  browserNode: { required: ['url', 'action'], defaults: { url: '', action: 'scrape' } },
  conditionNode: { required: ['key', 'value'], defaults: { key: '', value: '' } },
  default: { required: [], defaults: {} }
};

const initialNodes = [
  {
    id: '1',
    type: 'workflowNode',
    data: { label: 'Start Trigger', type: 'default' },
    position: { x: 250, y: 5 },
    entry: true,
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

const WorkflowBuilder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isToolboxCollapsed, setIsToolboxCollapsed] = useState(false);
  const [isToolboxFloating, setIsToolboxFloating] = useState(false);
  const [toolboxPos, setToolboxPos] = useState({ x: 24, y: 92 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, initX: 0, initY: 0 });
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [isAIPlannerOpen, setIsAIPlannerOpen] = useState(false);
  const [workflowId, setWorkflowId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'wf_' + Math.random().toString(36).substr(2, 9);
  });
  const [workflowMeta, setWorkflowMeta] = useState({ name: 'Untitled Workflow', version: 0, environment: 'draft', tags: [], isActive: false });
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false); // New: track unsaved changes
  const [storageMode, setStorageMode] = useState('browser');
  const [contextMenu, setContextMenu] = useState(null);
  const [clipBoard, setClipBoard] = useState([]);
  const [executionResults, setExecutionResults] = useState({});
  const [runHistory, setRunHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCodeViewOpen, setIsCodeViewOpen] = useState(false);
  const [isInspectorVisible, setIsInspectorVisible] = useState(true);
  const [codeViewContent, setCodeViewContent] = useState('');
  const [logs, setLogs] = useState([]);
  const isJustLoaded = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');

    // --- Template Ingestion Protocol ---
    const templateData = sessionStorage.getItem('selected_template');
    if (templateData) {
      try {
        const template = JSON.parse(templateData);
        setNodes(template.nodes || initialNodes);
        setEdges(template.edges || []);
        setWorkflowMeta(prev => ({ ...prev, name: template.name, category: template.category }));
        toast({ title: "Blueprint Ingested", description: `Successfully loaded "${template.name}" architecture.` });
        sessionStorage.removeItem('selected_template'); // Clear after ingest
      } catch (err) {
        console.error("Template ingest failure:", err);
      }
    }
  }, []);

  // --- DRAFT RECOVERY PROTOCOL ---
  useEffect(() => {
    if (!workflowId) return;

    const draftKey = `draft_history_${workflowId}`;
    const draftData = localStorage.getItem(draftKey);

    if (draftData) {
      try {
        const draft = JSON.parse(draftData);
        // Show toast if draft found
        toast({
          title: "Draft Detected",
          description: "Unsynced changes found in local protocol.",
          action: (
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                setNodes(draft.nodes || []);
                setEdges(draft.edges || []);
                setWorkflowMeta(prev => ({
                  ...prev,
                  name: draft.name,
                  version: draft.version,
                  tags: draft.tags || [],
                  isActive: draft.isActive || false
                }));
                setIsDraftDirty(true);
              }}
            >
              Restore
            </Button>
          ),
        });
      } catch (e) {
        console.error("Draft recovery failure:", e);
      }
    }
  }, [workflowId]);

  // Auto-fit canvas on resize / container change
  useEffect(() => {
    if (!reactFlowInstance) return;

    let timer = null;
    const handle = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          reactFlowInstance.fitView({ padding: 0.12 });
        } catch (e) {
          // ignore
        }
      }, 180);
    };

    // Observe wrapper size changes (modern browsers)
    let ro = null;
    try {
      ro = new ResizeObserver(handle);
      if (reactFlowWrapper.current) ro.observe(reactFlowWrapper.current);
    } catch (e) {
      // ResizeObserver not supported; we'll fall back to window resize
    }

    window.addEventListener('resize', handle);
    // initial fit
    handle();

    return () => {
      window.removeEventListener('resize', handle);
      if (ro && reactFlowWrapper.current) ro.unobserve(reactFlowWrapper.current);
      if (timer) clearTimeout(timer);
    };
  }, [reactFlowInstance]);

  const nodeTypes = useMemo(() => ({
    workflowNode: WorkflowNode,
  }), []);

  const recordHistory = useCallback(() => {
    setPast((prev) => [...prev, { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    setFuture((prev) => [{ nodes, edges }, ...prev]);
    setPast(newPast);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [past, nodes, edges, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, { nodes, edges }]);
    setFuture(newFuture);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  // --- Keyboard Shortcuts (Undo/Redo/Copy/Paste/Duplicate) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore shortcuts if user is typing in an input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      // Undo / Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          // Windows Redo often uses Ctrl+Y
          e.preventDefault();
          redo();
        }
      }

      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          setClipBoard(selected);
          toast({ description: `Copied ${selected.length} nodes to clipboard` });
        }
      }

      // Paste (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipBoard.length > 0) {
          recordHistory();
          const newNodes = clipBoard.map(n => ({
            ...n,
            id: getId(),
            position: { x: n.position.x + 50, y: n.position.y + 50 },
            selected: true,
            data: { ...n.data } // Deep copy data to avoid reference issues
          }));
          setNodes(nds => nds.map(node => ({ ...node, selected: false })).concat(newNodes));
        }
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          recordHistory();
          const newNodes = selected.map(n => ({
            ...n,
            id: getId(),
            position: { x: n.position.x + 20, y: n.position.y + 20 },
            selected: true,
            data: { ...n.data }
          }));
          setNodes(nds => nds.map(node => ({ ...node, selected: false })).concat(newNodes));
        }
      }

      // Delete (Backspace/Delete)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = nodes.filter(n => n.selected);
        const selectedEdges = edges.filter(e => e.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
          e.preventDefault();
          recordHistory();

          if (selectedNodes.length > 0) {
            const selectedIds = new Set(selectedNodes.map(n => n.id));
            setNodes((nds) => nds.filter((n) => !selectedIds.has(n.id)));
            setEdges((eds) => eds.filter((e) => !selectedIds.has(e.source) && !selectedIds.has(e.target)));

            if (selectedNode && selectedIds.has(selectedNode.id)) {
              setSelectedNode(null);
            }
          }

          if (selectedEdges.length > 0) {
            setEdges((eds) => eds.filter((e) => !e.selected));
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, nodes, edges, clipBoard, recordHistory, setNodes, setEdges, selectedNode, setSelectedNode]);

  const onConnect = useCallback((params) => {
    recordHistory();
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges, recordHistory]);

  const onNodesChangeWithHistory = useCallback((changes) => {
    if (changes.some(c => c.type === 'remove')) {
      recordHistory();
    }
    onNodesChange(changes);
  }, [onNodesChange, recordHistory]);

  const onEdgesChangeWithHistory = useCallback((changes) => {
    if (changes.some(c => c.type === 'remove')) {
      recordHistory();
    }
    onEdgesChange(changes);
  }, [onEdgesChange, recordHistory]);

  const setNodesWithHistory = useCallback((update) => {
    recordHistory();
    setNodes(update);
  }, [recordHistory, setNodes]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      const customType = event.dataTransfer.getData('application/customType');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const policy = NODE_POLICIES[customType] || { defaults: {} };
      recordHistory();
      const newNode = {
        id: getId(),
        type: 'workflowNode', // Force custom node type
        position,
        data: { label: `${label}`, type: customType, ...policy.defaults },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, recordHistory]
  );

  const onDragStart = (event, nodeType, label, customType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    if (customType) {
      event.dataTransfer.setData('application/customType', customType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  // --- Context Menu Handlers ---
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      type: 'node',
      nodeId: node.id
    });
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      type: 'pane'
    });
  }, []);

  const handleCloseContextMenu = () => setContextMenu(null);

  const handleDuplicateNode = (id) => {
    const node = nodes.find(n => n.id === id);
    if (node) {
      recordHistory();
      const newNode = {
        ...node,
        id: getId(),
        position: { x: node.position.x + 20, y: node.position.y + 20 },
        selected: true,
        data: { ...node.data }
      };
      setNodes(nds => nds.map(n => ({ ...n, selected: false })).concat(newNode));
    }
    handleCloseContextMenu();
  };

  const handleDeleteNode = (id) => {
    recordHistory();
    setNodes(nds => nds.filter(n => n.id !== id));
    handleCloseContextMenu();
  };

  const addNodeAtLocation = (type, label, contextMenuEvent) => {
    const position = reactFlowInstance.screenToFlowPosition({
      x: contextMenuEvent.mouseX,
      y: contextMenuEvent.mouseY,
    });
    const policy = NODE_POLICIES[type] || { defaults: {} };
    recordHistory();
    const newNode = {
      id: getId(),
      type: 'workflowNode',
      position,
      data: { label, type, ...policy.defaults },
    };
    setNodes((nds) => nds.concat(newNode));
    handleCloseContextMenu();
  };

  const validateWorkflow = useCallback(() => {
    const nodeErrors = {};
    const errorMessages = [];

    // 1. Connectivity Check
    const connectedTargetIds = new Set(edges.map(e => e.target));
    const startNodeClass = nodes.find(n => n.data.type === 'default' || n.data.type === 'webhookNode');

    if (!startNodeClass && nodes.length > 0) {
      errorMessages.push("Workflow is missing a Start Trigger.");
    }

    nodes.forEach((node) => {
      const { type } = node.data;

      // Check if node is disconnected (not a start node, and has no incoming edges)
      if (!node.data.isEntry && !connectedTargetIds.has(node.id) && type !== 'default' && type !== 'webhookNode') {
        nodeErrors[node.id] = nodeErrors[node.id] || [];
        nodeErrors[node.id].push("Node is disconnected from the workflow flow.");
        errorMessages.push(`${node.data.label} (Disconnected)`);
      }

      if (!type || type === 'default') return;

      // 2. Configuration Check
      const policy = NODE_POLICIES[type];
      if (policy) {
        const missing = policy.required.filter(field => {
          const val = node.data[field];
          return val === undefined || val === null || val === '';
        });
        if (missing.length > 0) {
          nodeErrors[node.id] = [...(nodeErrors[node.id] || []), ...missing.map(m => `Missing: ${m}`)];
          errorMessages.push(`${node.data.label} (Missing Config: ${missing.join(', ')})`);
        }
      }
    });

    return { isValid: Object.keys(nodeErrors).length === 0, nodeErrors, errorMessages };
  }, [nodes, edges]);

  const runWorkflow = async () => {
    // 1. Validation Layer
    const { isValid, nodeErrors } = validateWorkflow();

    if (!isValid) {
      // Auto-focus the first invalid node
      const firstErrorId = Object.keys(nodeErrors)[0];
      const firstNode = nodes.find(n => n.id === firstErrorId);

      if (firstNode) {
        setSelectedNode(firstNode);
        if (reactFlowInstance) {
          // Center view on the error node
          reactFlowInstance.setCenter(firstNode.position.x + 140, firstNode.position.y + 50, { zoom: 1, duration: 800 });
        }
      }

      toast({
        title: "Workflow Validation Failed",
        description: `Please fix configuration in ${Object.keys(nodeErrors).length} node(s).`,
        variant: "destructive",
      });

      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            status: nodeErrors[n.id] ? 'error' : 'idle',
            errorMessage: nodeErrors[n.id] ? nodeErrors[n.id].join(', ') : null
          }
        }))
      );
      return;
    }

    // Execution Layer: Real Engine
    try {
      // 1. Save current state so engine can load it
      await handleSave(true);

      // 2. Reset UI
      setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, status: 'running' } })));
      setExecutionResults({});

      toast({ title: "Workflow Execution Started", description: "Running on local engine..." });

      // 3. Construct Payload
      const payload = {
        _meta: { timestamp: new Date().toISOString(), source: 'builder_run' }
      };

      // 4. Execute
      // Execute with real user settings
      setLogs([]); // Clear previous logs
      const resultContext = await workflowEngine.execute(workflowId, payload, {
        userId: user?.id,
        onLog: (l) => {
          console.log(`[Engine] ${l.message}`);
          setLogs(prev => [...prev, l]);
        },
        config: user?.engine_prefs || {}
      });

      // 5. Update UI with Results
      setExecutionResults(resultContext.results);
      setRunHistory(prev => [{
        id: Date.now(),
        timestamp: new Date(),
        status: resultContext.status,
        results: resultContext.results,
        nodeStatus: resultContext.nodeStatus
      }, ...prev]);

      // Auto-select the last node that produced a result to show the Inspector
      const resultKeys = Object.keys(resultContext.results);
      if (resultKeys.length > 0) {
        const lastNodeId = resultKeys[resultKeys.length - 1];
        const lastNode = nodes.find(n => n.id === lastNodeId);
        if (lastNode) setSelectedNode(lastNode);
      }

      setNodes(nds => nds.map(n => {
        const status = resultContext.nodeStatus[n.id];
        let uiStatus = 'idle';
        if (status === 'completed') uiStatus = 'success';
        if (status === 'failed') uiStatus = 'error';
        if (status === 'running') uiStatus = 'running';
        return {
          ...n,
          data: { ...n.data, status: uiStatus }
        };
      }));

      // Check for export outputs
      const exportNodes = nodes.filter(n => n.data.type === 'exportNode');
      let hasExport = false;
      exportNodes.forEach(node => {
        const result = resultContext.results[node.id];
        if (result && result.url) {
          hasExport = true;
          toast({
            title: "File Ready",
            description: `Output generated from ${node.data.label}`,
            action: <Button size="sm" variant="outline" onClick={() => window.open(result.url, '_blank')} className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"><Download className="w-3 h-3 mr-1" /> Download</Button>,
            duration: 8000,
          });
        }
      });

      if (!hasExport) {
        toast({ title: "Execution Complete", description: "Check Node Inspector for outputs." });
        const hasAppNode = nodes.some(n => n.data.type === 'appNode');
        if (hasAppNode) {
          toast({
            title: "Backend Test Complete",
            description: "Logic executed successfully. To test the interface, click 'Preview App'.",
            action: <Button size="sm" variant="outline" onClick={() => window.open(`/app?id=${workflowId}`, '_blank')} className="border-white/20 hover:bg-white/20">Launch App</Button>
          });
        } else {
          toast({ title: "Execution Complete", description: "Results loaded in Inspector (Debug Tab)." });
        }
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Execution Failed", description: error.message, variant: "destructive" });

      // Mark failed nodes
      setNodes(nds => nds.map(n => ({
        ...n,
        data: { ...n.data, status: n.data.status === 'running' ? 'error' : n.data.status }
      })));
    }
  };

  // --- Storage & Persistence Logic ---

  const loadWorkflowList = async () => {
    const list = await storageAdapter.setApi().listWorkflows(user?.id);
    setSavedWorkflows(list);
  };

  useEffect(() => {
    if (isLoadModalOpen) {
      loadWorkflowList();
    }
  }, [isLoadModalOpen]);

  const handleSave = async (isAutosave = false) => {
    // Determine new version: Increment ONLY on manual save if user wants versioning, or keep existing for update
    const currentVersion = Number(workflowMeta.version) || 0;
    const newVersion = isAutosave ? currentVersion : currentVersion + 1;

    const workflowData = {
      id: workflowId,
      ...workflowMeta,
      version: newVersion,
      nodes,
      edges,
      viewport: reactFlowInstance?.getViewport()
    };

    try {
      if (isAutosave) {
        // --- TEMP HISTORY PROTOCOL (Browser Cache) ---
        // We save to a specific "draft" key in localStorage to avoid DB bloat
        const draftKey = `draft_history_${workflowId}`;
        localStorage.setItem(draftKey, JSON.stringify({
          ...workflowData,
          draftAt: new Date().toISOString()
        }));
        setLastSaved(new Date());
        setIsDraftDirty(true);
        return;
      }

      // --- PERSISTENCE PROTOCOL (Database/FileSystem) ---
      // Force API adapter for manual saves to ensure it hits the DB
      const result = await storageAdapter.setApi().saveWorkflow(workflowId, workflowData, user?.id);

      // CRITICAL: Update the workflowId to the one returned by the DB (which will be numeric)
      // This ensures subsequent saves update the same row instead of inserting new ones
      if (result.id && result.id !== workflowId) {
        setWorkflowId(result.id);
        // Update URL without reloading
        window.history.replaceState(null, '', `?id=${result.id}`);
        // Clean up draft since it's now synced
        localStorage.removeItem(`draft_history_${workflowId}`);
      }

      setWorkflowMeta(prev => ({ ...prev, version: newVersion }));
      setLastSaved(new Date());
      setIsDraftDirty(false);

      toast({
        title: "Protocol Synced",
        description: `Workflow "${workflowMeta.name}" version ${newVersion} is now live in the master ledger.`
      });

    } catch (error) {
      console.error("Save failed:", error);
      toast({ title: "Sync Failure", description: error.message, variant: "destructive" });
    }
  };

  // Autosave Logic (2s Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isJustLoaded.current) {
        isJustLoaded.current = false;
        return;
      }
      if (nodes.length > 0) {
        handleSave(true); // Trigger Autosave (LocalStorage Only)
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [nodes, edges, workflowMeta.name]);

  const handleLoad = async (id) => {
    try {
      const data = await storageAdapter.loadWorkflow(id);
      setWorkflowId(data.id);
      setWorkflowMeta({
        name: data.name,
        version: data.version,
        environment: data.environment || 'draft',
        tags: data.tags || [],
        isActive: data.isActive || false
      });
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      if (data.viewport && reactFlowInstance) {
        reactFlowInstance.setViewport(data.viewport);
      }
      isJustLoaded.current = true;
      setIsLoadModalOpen(false);
      toast({ title: "Workflow Loaded", description: `Loaded "${data.name}" (v${data.version})` });
    } catch (error) {
      toast({ title: "Load Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await storageAdapter.deleteWorkflow(id);
    loadWorkflowList();
  };

  const handleClone = () => {
    const newId = 'wf_' + Math.random().toString(36).substr(2, 9);
    setWorkflowId(newId);
    setWorkflowMeta(prev => ({ ...prev, name: `${prev.name} (Copy)`, version: 0 }));
    toast({ title: "Workflow Cloned", description: "Created a new copy. Saving will create a new file." });
  };

  const handlePromote = async (targetEnv) => {
    await handleSave(true);
    try {
      const newWorkflow = await storageAdapter.promoteWorkflow(workflowId, targetEnv);
      setWorkflowId(newWorkflow.id);
      window.history.replaceState(null, '', `?id=${newWorkflow.id}`);
      setWorkflowMeta({
        name: newWorkflow.name,
        version: newWorkflow.version,
        environment: newWorkflow.environment
      });
      setNodes(newWorkflow.nodes || []);
      setEdges(newWorkflow.edges || []);
      toast({ title: "Environment Changed", description: `Moved to ${targetEnv}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to change environment.", variant: "destructive" });
    }
  };

  const handleAIPlan = useCallback((newNodes, newEdges) => {
    recordHistory();
    setNodes(newNodes);
    setEdges(newEdges);
    setIsAIPlannerOpen(false);
    toast({ title: "AI Plan Applied", description: "Workflow generated successfully." });
  }, [recordHistory, setNodes, setEdges]);

  const handleExport = () => {
    const data = {
      id: workflowId,
      ...workflowMeta,
      nodes,
      edges
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowMeta.name.replace(/\s+/g, '_')}_v${workflowMeta.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        // Always generate new ID for imports to avoid overwriting existing files
        setWorkflowId('wf_' + Math.random().toString(36).substr(2, 9));
        setWorkflowMeta({ name: (data.name || 'Imported Workflow') + ' (Imported)', version: 1 });
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        if (data.viewport && reactFlowInstance) {
          reactFlowInstance.setViewport(data.viewport);
        }
        isJustLoaded.current = true;
        toast({ title: "Workflow Imported", description: "Workflow loaded from file." });
      } catch (error) {
        console.error("Import failed:", error);
        toast({ title: "Import Failed", description: "Invalid workflow file.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input to allow re-importing same file
  };

  const connectLocalFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      storageAdapter.setFileSystem(handle);
      setStorageMode('filesystem');
      toast({ title: "Local Storage Connected", description: `Saving to: ${handle.name}` });
    } catch (err) {
      // User cancelled
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Top Bar - Refined for Pro Connectivity */}
      <div className="h-14 border-b border-white/5 flex items-center px-4 justify-between bg-card/40 backdrop-blur-xl z-20 shrink-0 gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-[10px] hidden sm:inline">Back</span>
          </Button>

          <div className="h-6 w-[1px] bg-white/10" />

          <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto">
            <div className="relative group shrink-0">
              <input
                className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-lg px-2 py-1 text-sm font-bold text-white transition-all w-40"
                value={workflowMeta.name}
                onChange={(e) => setWorkflowMeta(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Name engine..."
              />
              <div className="absolute bottom-0 left-2 right-2 h-[1px] bg-white/5 group-focus-within:bg-primary/40 transition-colors" />
            </div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5 shrink-0">v{workflowMeta.version}</span>

            <div className="flex items-center gap-1 overflow-hidden">
              {workflowMeta.tags?.map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 truncate max-w-[60px]">{tag}</span>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 bg-white/5 hover:bg-white/10 text-slate-500"
                onClick={() => {
                  const tag = prompt("Enter tag name:");
                  if (tag) setWorkflowMeta(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded border-2 uppercase font-black tracking-[0.1em]",
              workflowMeta.environment === 'production' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                workflowMeta.environment === 'test' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-slate-800 text-slate-400 border-slate-700'
            )}>
              {workflowMeta.environment || 'DRAFT'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Publish Toggle - Enterprise Ready */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 mr-2">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", workflowMeta.isActive ? "text-emerald-400" : "text-slate-500")}>
              {workflowMeta.isActive ? "Active" : "Inactive"}
            </span>
            <button
              onClick={() => setWorkflowMeta(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={cn(
                "w-10 h-5 rounded-full relative transition-all duration-300",
                workflowMeta.isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : "bg-slate-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300",
                workflowMeta.isActive ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          {/* Environment Promotion Cluster */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 mr-2">
            {workflowMeta.environment === 'test' && (
              <Button size="sm" variant="ghost" onClick={() => handlePromote('draft')} className="h-8 text-amber-400 hover:bg-amber-500/10 text-[10px] font-bold uppercase">
                Revoke
              </Button>
            )}
            {workflowMeta.environment === 'production' && (
              <Button size="sm" variant="ghost" onClick={() => handlePromote('test')} className="h-8 text-rose-400 hover:bg-rose-500/10 text-[10px] font-bold uppercase">
                Revoke to Test
              </Button>
            )}
            {(workflowMeta.environment === 'draft' || !workflowMeta.environment) && (
              <Button size="sm" variant="ghost" onClick={() => handlePromote('test')} className="h-8 text-accent hover:bg-accent/10 text-[10px] font-bold uppercase gap-2">
                Push to Test <ArrowRight className="w-3 h-3" />
              </Button>
            )}
            {workflowMeta.environment === 'test' && (
              <Button size="sm" variant="ghost" onClick={() => handlePromote('production')} className="h-8 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-bold uppercase gap-2">
                Deploy Prod <ArrowRight className="w-3 h-3" />
              </Button>
            )}
            {workflowMeta.environment && workflowMeta.environment !== 'draft' && (
              <Button size="sm" variant="ghost" onClick={async () => {
                if (confirm("Rollback to previous version?")) {
                  try {
                    const rolled = await storageAdapter.rollbackWorkflow(workflowId);
                    setNodes(rolled.nodes || []);
                    setEdges(rolled.edges || []);
                    setWorkflowMeta({
                      name: rolled.name,
                      version: rolled.version,
                      environment: rolled.environment
                    });
                    toast({ title: "Rollback Successful", description: `Reverted to Version ${rolled.version}` });
                  } catch (e) {
                    toast({ title: "Rollback Failed", description: e.message, variant: "destructive" });
                  }
                }
              }} className="h-8 text-slate-400 hover:bg-white/5 text-[10px] font-bold uppercase gap-1">
                <History className="w-3 h-3" /> Rollback
              </Button>
            )}
          </div>

          <Button size="sm" variant="secondary" onClick={() => setIsAIPlannerOpen(true)} className="h-9 px-4 rounded-xl gap-2 text-primary font-bold bg-primary/10 hover:bg-primary/20 border border-primary/20 shadow-lg shadow-primary/5 transition-all active:scale-95 group">
            <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" /> AI Optimizer
          </Button>

          <Button size="sm" variant="outline" onClick={() => window.open(`/app?id=${workflowId}`, '_blank')} className="h-9 px-4 rounded-xl border-white/5 hover:bg-white/5 text-slate-300 font-bold transition-all">
            Live Preview
          </Button>

          <div className="w-[1px] h-6 bg-white/5 mx-1" />

          <Button size="sm" onClick={runWorkflow} className="h-9 px-5 rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
            <Play className="w-4 h-4 fill-current" /> Execute
          </Button>

          <div className="w-[1px] h-6 bg-white/5 mx-1" />

          {/* SYNC CLUSTER */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSave(false)}
              className={cn(
                "h-10 px-6 rounded-xl gap-2 font-bold shadow-xl transition-all active:scale-95 group",
                isDraftDirty ? "bg-primary hover:bg-primary/90 text-white shadow-primary/20" : "bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5"
              )}
            >
              <Save className={cn("w-4 h-4", isDraftDirty && "animate-pulse")} />
              {isDraftDirty ? "Sync to DB" : "Synced"}
            </Button>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <Cloud className={cn("w-3 h-3", isDraftDirty ? "text-amber-500" : "text-emerald-500")} />
                <span className="text-[9px] font-black uppercase text-slate-500 whitespace-nowrap leading-none">
                  {isDraftDirty ? "Unsynced Draft" : "Ledger Accurate"}
                </span>
              </div>
              {lastSaved && (
                <span className="text-[8px] text-slate-600 font-mono italic leading-none mt-1">
                  Node Sync: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="w-[1px] h-6 bg-white/5 mx-1" />

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-white/5 text-slate-400" onClick={() => setIsLoadModalOpen(true)} title="Load Workflow Architecture (Open Saved)">
              <FolderOpen className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-white/5 text-slate-400" onClick={() => setIsHistoryOpen(true)} title="Execution History">
              <History className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-white/5 text-slate-400" onClick={() => { setCodeViewContent(JSON.stringify({ id: workflowId, ...workflowMeta, nodes, edges, viewport: reactFlowInstance?.getViewport() }, null, 2)); setIsCodeViewOpen(true); }} title="Workflow Source Code">
              <Code className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-white/5 text-slate-400" onClick={handleExport} title="Export Workflow (JSON)">
              <Download className="w-5 h-5" />
            </Button>
            <div className="relative group">
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-white/5 text-slate-400" onClick={() => document.getElementById('import-workflow-input').click()} title="Import Workflow (JSON)">
                <Upload className="w-5 h-5" />
              </Button>
              <input
                id="import-workflow-input"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
            <Button size="sm" variant="ghost" className={cn("h-9 w-9 p-0 rounded-xl hover:bg-white/5 text-slate-400", storageMode === 'filesystem' && "text-emerald-500 bg-emerald-500/10")} onClick={connectLocalFolder} title="Connect Local Folder (Dev Mode)">
              <HardDrive className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Toolbox */}
        <div
          className={`border-r border-border bg-muted/30 flex flex-col transition-all duration-300 ${isToolboxCollapsed ? 'w-0 md:w-16' : 'w-48 md:w-64'}`}
          style={isToolboxFloating ? { position: 'absolute', left: `${toolboxPos.x}px`, top: `${toolboxPos.y}px`, zIndex: 60, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', width: isToolboxCollapsed ? '64px' : '256px' } : {}}
        >
          <div
            className="p-2 flex justify-end border-b border-border/50 cursor-move"
            onMouseDown={(e) => {
              if (!isToolboxFloating) return;
              dragRef.current.dragging = true;
              dragRef.current.startX = e.clientX;
              dragRef.current.startY = e.clientY;
              dragRef.current.initX = toolboxPos.x;
              dragRef.current.initY = toolboxPos.y;
              const onMove = (ev) => {
                if (!dragRef.current.dragging) return;
                const nx = dragRef.current.initX + (ev.clientX - dragRef.current.startX);
                const ny = dragRef.current.initY + (ev.clientY - dragRef.current.startY);
                setToolboxPos({ x: Math.max(8, nx), y: Math.max(48, ny) });
              };
              const onUp = () => {
                dragRef.current.dragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          >
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 toolbox-collapse-button" onClick={() => setIsToolboxCollapsed(!isToolboxCollapsed)}>
                {isToolboxCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsToolboxFloating(f => !f)} title="Undock Toolbox">
                <Monitor className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 space-y-6 overflow-y-auto flex-grow">
            {/* Core Logic Group */}
            <div>
              {!isToolboxCollapsed && <h3 className="font-semibold text-[10px] uppercase text-slate-500 mb-3 px-1 tracking-[0.2em] font-black">Core Logic</h3>}
              <div className="space-y-2">
                {[
                  { icon: Activity, label: 'Start Trigger', type: 'default', color: 'text-slate-500' },
                  { icon: GitBranch, label: 'If / Else', type: 'ifNode', color: 'text-indigo-500' },
                  { icon: HardDrive, label: 'Context Memory', type: 'memoryNode', color: 'text-amber-500' },
                  { icon: Wand2, label: 'Recruit Workflow', type: 'workflowToolNode', color: 'text-violet-500' },
                ].map((item, i) => (
                  <div
                    key={item.type}
                    className={`p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-white/5 cursor-grab shadow-sm hover:shadow-lg hover:border-primary/30 transition-all flex items-center gap-3 ${isToolboxCollapsed ? 'justify-center px-0' : ''}`}
                    onDragStart={(event) => onDragStart(event, 'workflowNode', item.label, item.type)}
                    draggable
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    {!isToolboxCollapsed && <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{item.label}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Flow Control Group */}
            <div>
              {!isToolboxCollapsed && <h3 className="font-semibold text-[10px] uppercase text-slate-500 mb-3 px-1 tracking-[0.2em] font-black">Flow Control</h3>}
              <div className="space-y-2">
                {[
                  { icon: Clock, label: 'Wait / Delay', type: 'waitNode', color: 'text-rose-500' },
                  { icon: ArrowRightLeft, label: 'Merge Paths', type: 'mergeNode', color: 'text-cyan-500' },
                  { icon: Activity, label: 'Split In Batches', type: 'batchNode', color: 'text-emerald-500' },
                ].map((item, i) => (
                  <div
                    key={item.type}
                    className={`p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-white/5 cursor-grab shadow-sm hover:shadow-lg hover:border-primary/30 transition-all flex items-center gap-3 ${isToolboxCollapsed ? 'justify-center px-0' : ''}`}
                    onDragStart={(event) => onDragStart(event, 'workflowNode', item.label, item.type)}
                    draggable
                  >
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    {!isToolboxCollapsed && <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{item.label}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Plugins Group */}
            <div>
              {!isToolboxCollapsed && <h3 className="font-semibold text-xs uppercase text-muted-foreground mb-3 px-1 tracking-wider">System Plugins</h3>}
              <div className="space-y-2">
                {[
                  { icon: Brain, label: 'AI Model', type: 'aiNode', color: 'text-purple-500' },
                  { icon: Phone, label: 'AI BPO Agent', type: 'vapiBpoNode', color: 'text-indigo-400' },
                  { icon: Monitor, label: 'User App', type: 'appNode', color: 'text-pink-500' },
                  { icon: MessageSquare, label: 'Send SMS', type: 'smsNode', color: 'text-green-500' },
                  { icon: Users, label: 'CRM Lookup', type: 'crmNode', color: 'text-blue-400' },
                  { icon: Search, label: 'Web Scraper', type: 'browserNode', color: 'text-orange-400' },
                  { icon: Cloud, label: 'Google Drive', type: 'driveNode', color: 'text-blue-500' },
                  { icon: FileText, label: 'File System', type: 'fileNode', color: 'text-orange-500' },
                  { icon: FileJson, label: 'Data Store', type: 'dataNode', color: 'text-yellow-500' },
                  { icon: Webhook, label: 'External API', type: 'apiNode', color: 'text-blue-500' },
                  { icon: Code, label: 'Custom Function', type: 'customNode', color: 'text-indigo-500' },
                  { icon: FileCode, label: 'Python Script', type: 'pythonNode', color: 'text-yellow-500' },
                  { icon: Download, label: 'Save / Export', type: 'exportNode', color: 'text-emerald-500' },
                  { icon: FileVideo, label: 'Media Converter', type: 'mediaConvert', color: 'text-pink-600' },
                ].map((item, i) => (
                  <div
                    key={item.type}
                    className={`p-3 bg-white dark:bg-slate-800 rounded-lg border border-border cursor-grab shadow-sm hover:shadow-md transition-all flex items-center gap-3 ${isToolboxCollapsed ? 'justify-center px-0' : ''}`}
                    onDragStart={(event) => onDragStart(event, 'workflowNode', item.label, item.type)}
                    draggable
                    title={isToolboxCollapsed ? item.label : ''}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    {!isToolboxCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div ref={reactFlowWrapper} className="flex-grow relative bg-background">
          <ReactFlow
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChangeWithHistory}
            onEdgesChange={onEdgesChangeWithHistory}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={setReactFlowInstance}
            onNodeDragStart={recordHistory}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            minZoom={0.1}
            maxZoom={2}
            snapToGrid={true}
            snapGrid={[20, 20]}
            fitView
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.8 },
              className: 'react-flow__edge-premium'
            }}
          >
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 shadow-xl rounded-lg overflow-hidden" />
            <MiniMap
              className="!bg-slate-900/80 !border-slate-800 backdrop-blur-md shadow-2xl rounded-xl overflow-hidden"
              maskColor="rgba(0, 0, 0, 0.4)"
              nodeColor={(n) => {
                if (n.data?.status === 'running') return '#3b82f6';
                if (n.data?.status === 'error') return '#ef4444';
                if (n.data?.status === 'success') return '#10b981';
                return '#475569';
              }}
            />
            <Background variant="dots" gap={24} size={1.5} color="rgba(138, 43, 226, 0.2)" className="hero-pattern opacity-50" />
            <Panel position="top-right">
              <div className="workflow-toolbar flex gap-2 p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
                <Button size="sm" variant="ghost" onClick={() => reactFlowInstance && reactFlowInstance.fitView({ padding: 0.12 })} title="Fit View to Screen" className="hover:bg-slate-700">
                  <span className="text-xs font-bold">Fit</span>
                </Button>
                <div className="w-[1px] bg-slate-700" />
                <Button size="sm" variant="ghost" onClick={() => reactFlowInstance && reactFlowInstance.zoomIn()} title="Zoom In" className="hover:bg-slate-700">+</Button>
                <Button size="sm" variant="ghost" onClick={() => reactFlowInstance && reactFlowInstance.zoomOut()} title="Zoom Out" className="hover:bg-slate-700">−</Button>
                <div className="w-[1px] bg-slate-700" />
                <Button size="sm" variant="ghost" onClick={() => setIsInspectorVisible(v => !v)} title="Toggle Inspector Panel" className={`hover:bg-slate-700 ${isInspectorVisible ? 'bg-slate-700' : ''}`}>
                  <span className="text-xs font-bold">Inspector</span>
                </Button>
                <div className="w-[1px] bg-slate-700" />
                <Button size="sm" variant="ghost" onClick={() => setIsToolboxCollapsed(!isToolboxCollapsed)} title={isToolboxCollapsed ? 'Show Toolbox' : 'Hide Toolbox'} className="hover:bg-slate-700">
                  {isToolboxCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>
            </Panel>
          </ReactFlow>

          {/* Inspector */}
          <div className={`absolute top-0 right-0 h-full w-80 bg-background border-l border-border shadow-xl z-20 transition-transform duration-300 ease-in-out transform ${isInspectorVisible && selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
            {selectedNode && (
              <Inspector
                selectedNode={nodes.find(n => n.id === selectedNode.id) || selectedNode}
                setNodes={setNodesWithHistory}
                setSelectedNode={setSelectedNode}
                nodeResults={executionResults[selectedNode.id]}
                savedWorkflows={savedWorkflows}
              />
            )}
          </div>

          {/* Fixed Inspector Toggle - Remains visible even when inspector is closed */}
          {selectedNode && (
            <button
              onClick={() => setIsInspectorVisible(v => !v)}
              className={cn(
                "fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-primary text-white rounded-l-xl p-2 shadow-2xl transition-all duration-300 group",
                isInspectorVisible ? "mr-80" : "mr-0"
              )}
            >
              {isInspectorVisible ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:scale-110" />}
            </button>
          )}

          {/* Context Menu */}
          {contextMenu && (
            <div
              style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
              className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              {contextMenu.type === 'node' ? (
                <>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => handleDuplicateNode(contextMenu.nodeId)}>
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2" onClick={() => handleDeleteNode(contextMenu.nodeId)}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </>
              ) : (
                <>
                  <div className="px-3 py-2 text-xs text-slate-500 font-medium uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">Add Node</div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('aiNode', 'AI Model', contextMenu)}>
                      <Brain className="w-4 h-4 text-purple-500" /> AI Model
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('vapiBpoNode', 'AI BPO Agent', contextMenu)}>
                      <Phone className="w-4 h-4 text-indigo-400" /> AI BPO Agent
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('apiNode', 'External API', contextMenu)}>
                      <Webhook className="w-4 h-4 text-blue-500" /> External API
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('logicNode', 'Logic Gate', contextMenu)}>
                      <GitBranch className="w-4 h-4 text-cyan-500" /> Logic Gate
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('ifNode', 'If / Else', contextMenu)}>
                      <GitBranch className="w-4 h-4 text-indigo-500" /> If / Else
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('pythonNode', 'Python Script', contextMenu)}>
                      <FileCode className="w-4 h-4 text-yellow-500" /> Python Script
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('driveNode', 'Google Drive', contextMenu)}>
                      <Cloud className="w-4 h-4 text-blue-500" /> Google Drive
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-2" onClick={() => addNodeAtLocation('browserNode', 'Web Scraper', contextMenu)}>
                      <Search className="w-4 h-4 text-orange-400" /> Web Scraper
                    </button>
                  </div>
                </>
              )}
              {/* Close Overlay */}
              <div className="fixed inset-0 z-[-1]" onClick={handleCloseContextMenu} />
            </div>
          )}
        </div>
      </div>

      <AIWorkflowPlanner
        open={isAIPlannerOpen}
        onOpenChange={setIsAIPlannerOpen}
        onPlanApplied={handleAIPlan}
      />

      {/* Code View Modal */}
      {
        isCodeViewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="font-semibold text-slate-200">Workflow Source Code (Editable)</h3>
                    <p className="text-xs text-slate-500">Edit the JSON below to manually fix or update your workflow.</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsCodeViewOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white"><X className="w-4 h-4" /></Button>
              </div>
              <div className="flex-grow overflow-hidden relative bg-slate-950 p-0 group">
                <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="gap-2 shadow-lg" onClick={() => {
                    navigator.clipboard.writeText(codeViewContent);
                    toast({ title: "Copied to Clipboard", description: "Ready to paste into your AI assistant." });
                  }}>
                    <Copy className="w-4 h-4" /> Copy
                  </Button>
                  <Button size="sm" className="gap-2 shadow-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                    try {
                      const data = JSON.parse(codeViewContent);
                      recordHistory();
                      if (data.id) setWorkflowId(data.id);
                      setWorkflowMeta({
                        name: data.name || workflowMeta.name,
                        version: data.version || workflowMeta.version,
                        environment: data.environment || 'draft'
                      });
                      setNodes(data.nodes || []);
                      setEdges(data.edges || []);
                      if (data.viewport && reactFlowInstance) {
                        reactFlowInstance.setViewport(data.viewport);
                      }
                      setIsCodeViewOpen(false);
                      toast({ title: "Workflow Updated", description: "Code changes applied successfully." });
                    } catch (error) {
                      toast({ title: "Invalid JSON", description: error.message, variant: "destructive" });
                    }
                  }}>
                    <Check className="w-4 h-4" /> Apply
                  </Button>
                </div>
                <textarea
                  className="w-full h-full p-4 bg-slate-950 text-xs font-mono text-blue-300/90 leading-relaxed selection:bg-blue-500/30 resize-none focus:outline-none border-none"
                  value={codeViewContent}
                  onChange={(e) => setCodeViewContent(e.target.value)}
                  spellCheck="false"
                />
              </div>
            </div>
          </div>
        )
      }

      {/* Load Workflow Modal */}
      {
        isLoadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h3 className="font-semibold text-slate-200">Saved Workflows</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsLoadModalOpen(false)}><ChevronRight className="w-4 h-4 rotate-90" /></Button>
              </div>
              <div className="p-2 overflow-y-auto space-y-1">
                {savedWorkflows.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">No saved workflows found.</div>}
                {savedWorkflows.map(wf => (
                  <div key={wf.id} onClick={() => handleLoad(wf.id)} className="p-3 hover:bg-slate-800 rounded-lg cursor-pointer group flex items-center justify-between transition-colors">
                    <div>
                      <div className="font-medium text-slate-200 text-sm">{wf.name}</div>
                      <div className="text-xs text-slate-500">v{wf.version} • {new Date(wf.updatedAt).toLocaleDateString()}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(wf.id, e)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Execution History Modal */}
      {
        isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                <h3 className="font-semibold text-slate-200">Execution History</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2">
                {runHistory.length === 0 && <div className="text-center text-slate-500 py-8">No runs yet.</div>}
                {runHistory.map((run) => (
                  <div key={run.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${run.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          {run.status === 'completed' ? 'Success' : 'Failed'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {run.timestamp.toLocaleTimeString()} • {Object.keys(run.results).length} nodes processed
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setExecutionResults(run.results); setIsHistoryOpen(false); toast({ description: "Loaded past run results" }); }}>
                      Load Results
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default () => (
  <ReactFlowProvider>
    <WorkflowBuilder />
  </ReactFlowProvider>
);