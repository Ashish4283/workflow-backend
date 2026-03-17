import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Brain, Webhook, FileText, FileJson, GitBranch, GitMerge, Play, Save, Settings, ChevronLeft, ChevronRight, History, Activity, Download, Cloud, Monitor, Wand2, AlertTriangle, FolderOpen, Upload, Copy, Trash2, Check, HardDrive, ExternalLink, Plus, X, Code, FileCode, ArrowRight, ArrowLeft, FileVideo, Shield, Phone, MessageSquare, Clock, Users, Search, ArrowRightLeft, Building, Cpu, CheckCircle, Database, Info, BookOpen, Book, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import Inspector from './Inspector';
import AIWorkflowPlanner from './AIWorkflowPlanner';
import { storageAdapter } from '@/lib/workflow-storage';
import { workflowEngine } from '@/lib/workflow-engine';
import WorkflowNode from '../workflow/nodes';
import SchemaDesigner from './SchemaDesigner';
import { listOrganizations, listClusters } from '@/services/api';

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
  widgetNode: { required: ['widgetType'], defaults: { widgetType: 'counter', title: 'New Widget', color: '#3b82f6' } },
  mappingNode: { required: ['mappingRules'], defaults: { mappingRules: [], autoMatch: true } },
  qaNode: { required: ['priority'], defaults: { priority: 'medium', allowBulkEdit: true, reviewType: 'grid' } },
  billingNode: { required: ['ratePerUnit'], defaults: { ratePerUnit: 0.1, resourceCost: 0.02, currency: 'USD' } },
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
  const { user, isAuthenticated } = useAuth();
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
  const [isSchemaVisible, setIsSchemaVisible] = useState(false);
  const [workflowId, setWorkflowId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || 'wf_' + Math.random().toString(36).substr(2, 9);
  });
  const [workflowMeta, setWorkflowMeta] = useState({ 
    name: 'Untitled Workflow', 
    version: 0, 
    environment: 'draft', 
    tags: [], 
    isActive: false, 
    is_public: false,
    org_id: null,
    cluster_id: null
  });
  const [orgs, setOrgs] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false); // New: track unsaved changes
  const [storageMode, setStorageMode] = useState('browser');
  const [schema, setSchema] = useState({
    root: { id: 'root', label: 'Base Configuration', fields: [] },
    children: []
  });

  const workflow = useMemo(() => ({
    ...workflowMeta,
    id: workflowId,
    nodes,
    edges,
    schema
  }), [workflowMeta, workflowId, nodes, edges, schema]);
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
  const [isKBOpen, setIsKBOpen] = useState(false);
  const [kbDocs, setKbDocs] = useState([]);

  // --- CONTEXT LOAD PROTOCOL (Orgs/Clusters) ---
  
  useEffect(() => {
    const loadContexts = async () => {
      try {
        const [orgsRes, clustersRes] = await Promise.all([
          listOrganizations(),
          listClusters()
        ]);
        
        if (orgsRes.status === 'success') {
          setOrgs(orgsRes.data);
          
          // Selection persistence
          if (workflowMeta.org_id) {
            const orgExists = orgsRes.data.find(o => o.id === workflowMeta.org_id);
            if (!orgExists) setWorkflowMeta(prev => ({ ...prev, org_id: null, cluster_id: null }));
          }
        }
        
        if (clustersRes.status === 'success') {
          setClusters(clustersRes.data);
        }
      } catch (err) {
        console.error("Failed to load context data:", err);
      }
    };
    if (isAuthenticated) loadContexts();
  }, [user, isAuthenticated]);

  useEffect(() => {
    // Load KB Docs
    const docs = [
      { id: 'ledger', title: 'Enterprise Ledger Blueprint', path: 'docs/ENTERPRISE_LEDGER_BLUEPRINT.md', category: 'Standards' },
      { id: 'billing', title: 'Enterprise Billing Model', path: 'docs/ENTERPRISE_BILLING_MODEL.md', category: 'Finance' },
      { id: 'walkthrough', title: 'Ledger Walkthrough', path: 'docs/ENTERPRISE_LEDGER_WALKTHROUGH.md', category: 'Training' },
      { id: 'pwa', title: 'Scoreboard PWA Walkthrough', path: 'docs/SCOREBOARD_PWA_WALKTHROUGH.md', category: 'Deployment' }
    ];
    setKbDocs(docs);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    // Numeric IDs indicate a remote workflow in the database
    if (id && !isNaN(id) && isAuthenticated) {
      handleLoad(id);
    }
  }, [isAuthenticated, reactFlowInstance]);

  useEffect(() => {
    document.documentElement.classList.add('dark');

    // --- Template Ingestion Sequence ---
    const templateData = sessionStorage.getItem('selected_template');
    if (templateData) {
      try {
        const template = JSON.parse(templateData);
        // Marketplace items store nodes/edges in builder_json
        const nodesSource = template.builder_json?.nodes || template.nodes || initialNodes;
        const edgesSource = template.builder_json?.edges || template.edges || [];
        
        setNodes(nodesSource);
        setEdges(edgesSource);
        setWorkflowMeta(prev => ({ 
          ...prev, 
          name: template.name, 
          category: template.category,
          is_public: false // Deployed clones start as private
        }));
        setWorkflowId('wf_' + Math.random().toString(36).substr(2, 9)); // New ID for clone
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
                  isActive: draft.isActive || false,
                  is_public: draft.is_public || false
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
    console.log("DEBUG: listWorkflows response:", list);
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
      schema,
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
        title: "Process Synced",
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
        isActive: data.isActive || false,
        org_id: data.org_id || null,
        cluster_id: data.cluster_id || null
      });
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
      if (data.schema) setSchema(data.schema);
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
    try {
      if (confirm("Are you sure you want to delete this workflow? This action cannot be undone.")) {
        await storageAdapter.setApi().deleteWorkflow(id);
        toast({ title: "Workflow Deleted", description: "Remote architecture purged." });
        loadWorkflowList();
      }
    } catch (err) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
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
    <div className="h-full flex flex-col bg-background overflow-hidden font-sans">
      {/* Top Bar - Enterprise Professionalized Hierarchy */}
      <div className="h-16 border-b border-white/5 flex items-center px-4 justify-between bg-slate-950/90 backdrop-blur-2xl z-40 shrink-0 gap-6">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 rounded-2xl hover:bg-white/10 text-slate-400 shrink-0 shadow-lg border border-white/5 group"
            onClick={() => navigate('/dashboard/workflows')}
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Button>

          <div className="flex items-center gap-3 bg-white/5 p-1 px-4 rounded-[1.25rem] border border-white/5 shadow-inner">
            <div className="flex flex-col border-r border-white/10 pr-4">
              <input
                className="bg-transparent border-none focus:outline-none text-[13px] font-black text-white placeholder:text-slate-600 w-48 tracking-tight"
                value={workflowMeta.name}
                onChange={(e) => {
                  setWorkflowMeta(prev => ({ ...prev, name: e.target.value }));
                  setIsDraftDirty(true);
                }}
                placeholder="PRO-PROCESS-01"
              />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Build v{workflowMeta.version}</span>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                    workflowMeta.environment === 'production' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    workflowMeta.environment === 'test' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-500/10 text-slate-500 border border-white/5'
                )}>
                    {workflowMeta.environment || 'DRAFT'}
                </span>
              </div>
            </div>

            {/* Architecture Context Cluster */}
            <div className="flex items-center gap-6 pl-2 py-1">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Organization</span>
                    <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-blue-500/60" />
                        <select 
                            value={workflowMeta.org_id || ''} 
                            onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                setWorkflowMeta(prev => ({ ...prev, org_id: val, cluster_id: null }));
                                setIsDraftDirty(true);
                            }}
                            className="bg-transparent text-[11px] font-black text-slate-300 focus:outline-none border-none cursor-pointer hover:text-white transition-colors uppercase tracking-tight"
                        >
                            <option value="" className="bg-slate-900 text-slate-500">Global Ledger</option>
                            {orgs.map(org => (
                                <option key={org.id} value={org.id} className="bg-slate-900 text-slate-200">{org.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-col border-l border-white/5 pl-6">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Process Cluster</span>
                    <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-emerald-500/60" />
                        <select 
                            value={workflowMeta.cluster_id || ''} 
                            onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                setWorkflowMeta(prev => ({ ...prev, cluster_id: val }));
                                setIsDraftDirty(true);
                            }}
                            className="bg-transparent text-[11px] font-black text-slate-300 focus:outline-none border-none cursor-pointer hover:text-white transition-colors uppercase tracking-tight"
                        >
                            <option value="" className="bg-slate-900 text-slate-500">Main Sector</option>
                            {clusters
                              .filter(cluster => !workflowMeta.org_id || Number(cluster.org_id) === Number(workflowMeta.org_id))
                              .map(cluster => (
                                <option key={cluster.id} value={cluster.id} className="bg-slate-900 text-slate-200">{cluster.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Global Controls Cluster */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5">
             {/* Promotion Logic View */}
             <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-white/10 shrink-0">
                {workflowMeta.environment === 'test' && (
                  <Button size="sm" variant="ghost" onClick={() => handlePromote('draft')} className="h-9 px-3 text-amber-500 hover:bg-amber-500/10 text-[10px] font-black uppercase tracking-widest">
                    Revoke
                  </Button>
                )}
                {(workflowMeta.environment === 'draft' || !workflowMeta.environment) && (
                  <Button size="sm" variant="ghost" onClick={() => handlePromote('test')} className="h-9 px-4 text-blue-400 hover:bg-blue-400/10 text-[10px] font-black uppercase tracking-widest gap-2 group">
                    Staging <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                )}
                {workflowMeta.environment === 'test' && (
                  <Button size="sm" variant="ghost" onClick={() => handlePromote('production')} className="h-9 px-4 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest gap-2 group">
                    Promote <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                )}
             </div>

             <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsAIPlannerOpen(true)}
                className="h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-tighter text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 gap-2"
              >
                <Wand2 className="w-4 h-4 animate-pulse" /> AI Optimizer
              </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              className="h-11 px-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all font-black text-[11px] uppercase tracking-[0.2em] gap-3"
              onClick={runWorkflow}
            >
              <Play className="w-4 h-4 fill-white" /> Execute
            </Button>

            <Button
              size="sm"
              variant="outline"
              className={cn(
                "h-11 px-6 rounded-2xl border-white/5 bg-slate-900 border transition-all duration-300 font-black text-[11px] uppercase tracking-widest group shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
                isDraftDirty ? "border-amber-500/40 text-amber-500 shadow-amber-500/5 ring-1 ring-amber-500/10" : "text-emerald-500 hover:text-emerald-400"
              )}
              onClick={() => handleSave(false)}
            >
              <Save className={cn("w-4 h-4 mr-2 group-hover:scale-110 transition-transform", isDraftDirty && "animate-pulse")} /> 
              {isDraftDirty ? "Sync Local" : "Secure"}
            </Button>
          </div>

          <div className="w-[1px] h-6 bg-white/10 mx-1" />

          {/* Utility Hub */}
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-slate-400" onClick={() => setIsKBOpen(true)} title="Master Knowledge Base">
              <BookOpen className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-slate-400" onClick={() => setIsHistoryOpen(true)} title="Execution Logs">
              <History className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-slate-400" onClick={() => setIsCodeViewOpen(true)} title="Process Source (Editable)">
              <FileCode className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/10 text-slate-400" onClick={() => document.getElementById('import-workflow-input').click()} title="Import Blueprint">
              <Upload className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden relative">
        {/* Toolbox - Business Logic Inventory */}
        <aside
          className={`border-r border-white/5 bg-slate-950/50 backdrop-blur-md flex flex-col transition-all duration-500 z-30 ${isToolboxCollapsed ? 'w-16' : 'w-72'}`}
          style={isToolboxFloating ? { position: 'absolute', left: `${toolboxPos.x}px`, top: `${toolboxPos.y}px`, zIndex: 60, width: isToolboxCollapsed ? '64px' : '280px' } : {}}
        >
          <div
            className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]"
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
            {!isToolboxCollapsed && <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Components</h3>}
            <div className="flex gap-1 ml-auto">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5" onClick={() => setIsToolboxCollapsed(!isToolboxCollapsed)}>
                {isToolboxCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/5" onClick={() => setIsToolboxFloating(f => !f)} title="Toggle Floating Window">
                <Monitor className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </div>

          <div className="p-4 space-y-8 overflow-y-auto flex-grow custom-scrollbar">
            {/* Logic Group */}
            <div>
              {!isToolboxCollapsed && <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Core Architecture</h4>}
              <div className="space-y-2">
                {[
                  { icon: Activity, label: 'Start Trigger', type: 'default', color: 'text-blue-500' },
                  { icon: GitBranch, label: 'Conditional Gate', type: 'ifNode', color: 'text-indigo-500' },
                  { icon: HardDrive, label: 'Process Memory', type: 'memoryNode', color: 'text-amber-500' },
                  { icon: Wand2, label: 'Recursive Tool', type: 'workflowToolNode', color: 'text-violet-500' },
                ].map((item) => (
                  <div
                    key={item.type}
                    className={cn(
                        "p-3 rounded-2xl border border-white/5 cursor-grab shadow-sm transition-all flex items-center gap-3 group relative overflow-hidden",
                        isToolboxCollapsed ? "justify-center" : "bg-white/[0.03] hover:bg-white/[0.08] hover:border-blue-500/40"
                    )}
                    onDragStart={(event) => onDragStart(event, 'workflowNode', item.label, item.type)}
                    draggable
                  >
                    <div className={cn("shrink-0 p-2 rounded-lg bg-slate-900", item.color.replace('text-', 'bg-').replace('500', '500/10'))}>
                        <item.icon className={cn("w-4 h-4", item.color)} />
                    </div>
                    {!isToolboxCollapsed && <span className="text-xs font-bold text-slate-300">{item.label}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Plugin Inventory */}
            <div>
              {!isToolboxCollapsed && <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Enterprise Plugins</h4>}
              <div className="space-y-2">
                {[
                  { icon: Brain, label: 'AI Intelligence', type: 'aiNode', color: 'text-purple-500' },
                  { icon: Phone, label: 'BPO Agent', type: 'vapiBpoNode', color: 'text-indigo-400' },
                  { icon: Monitor, label: 'UI Widget', type: 'appNode', color: 'text-pink-500' },
                  { icon: Search, label: 'Web Intelligence', type: 'browserNode', color: 'text-orange-400' },
                  { icon: Webhook, label: 'External API', type: 'apiNode', color: 'text-blue-500' },
                  { icon: Code, label: 'Custom Runner', type: 'customNode', color: 'text-indigo-500' },
                  { icon: FileCode, label: 'Python Engine', type: 'pythonNode', color: 'text-yellow-500' },
                  { icon: ArrowRightLeft, label: 'Data Mapper', type: 'mappingNode', color: 'text-emerald-500' },
                  { icon: CheckCircle, label: 'Quality Control', type: 'qaNode', color: 'text-amber-500' },
                  { icon: Activity, label: 'Billing Ledger', type: 'billingNode', color: 'text-rose-500' },
                ].map((item) => (
                  <div
                    key={item.type}
                    className={cn(
                        "p-3 rounded-2xl border border-white/5 cursor-grab shadow-sm transition-all flex items-center gap-3 group relative overflow-hidden",
                        isToolboxCollapsed ? "justify-center" : "bg-white/[0.03] hover:bg-white/[0.08] hover:border-emerald-500/40"
                    )}
                    onDragStart={(event) => onDragStart(event, 'workflowNode', item.label, item.type)}
                    draggable
                  >
                    <div className={cn("shrink-0 p-2 rounded-lg bg-slate-900", item.color.replace('text-', 'bg-').replace('500', '500/10'))}>
                        <item.icon className={cn("w-4 h-4", item.color)} />
                    </div>
                    {!isToolboxCollapsed && <span className="text-xs font-bold text-slate-300">{item.label}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Workspace Canvas */}
        <div ref={reactFlowWrapper} className="flex-grow relative bg-slate-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeWithHistory}
            onEdgesChange={onEdgesChangeWithHistory}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#6366f1', strokeWidth: 2 }
            }}
          >
            <Background color="#334155" gap={20} />
            <Controls className="!bg-slate-900 !border-white/5 !text-white rounded-xl overflow-hidden" />
            <MiniMap className="!bg-slate-900/80 !border-white/5 rounded-2xl overflow-hidden shadow-2xl" maskColor="rgba(0,0,0,0.5)" />
            
            <Panel position="top-right">
              <div className="flex gap-2 p-1.5 bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl">
                <Button size="sm" variant="ghost" onClick={() => setIsSchemaVisible(!isSchemaVisible)} className={cn("h-8 text-[10px] font-black uppercase tracking-widest gap-2", isSchemaVisible ? "bg-blue-600/20 text-blue-400" : "text-slate-400")}>
                  <Database className="w-3.5 h-3.5" /> Architecture
                </Button>
                <div className="w-[1px] h-4 bg-white/10 my-auto" />
                <Button size="sm" variant="ghost" onClick={() => setIsInspectorVisible(!isInspectorVisible)} className={cn("h-8 text-[10px] font-black uppercase tracking-widest gap-2", isInspectorVisible ? "bg-emerald-600/20 text-emerald-400" : "text-slate-400")}>
                  <Settings className="w-3.5 h-3.5" /> Inspector
                </Button>
              </div>
            </Panel>
          </ReactFlow>

          {/* Absolute Overlays (Clipped to Canvas) */}
          <AnimatePresence>
            {isSchemaVisible && (
              <motion.div 
                initial={{ x: -450 }} animate={{ x: 0 }} exit={{ x: -450 }}
                className="absolute top-0 left-0 h-full w-[450px] z-40"
              >
                 <SchemaDesigner workflow={workflow} onUpdate={setSchema} />
                 <button onClick={() => setIsSchemaVisible(false)} className="absolute -right-6 top-1/2 -translate-y-1/2 h-20 w-6 bg-slate-900/90 border-y border-r border-white/10 flex items-center justify-center text-slate-500 hover:text-white rounded-r-lg shadow-2xl backdrop-blur-md">
                    <ChevronLeft className="w-4 h-4" />
                 </button>
              </motion.div>
            )}

            {isInspectorVisible && selectedNode && (
              <motion.div 
                initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
                className="absolute top-0 right-0 h-full w-80 z-40"
              >
                <Inspector
                  selectedNode={nodes.find(n => n.id === selectedNode.id) || selectedNode}
                  setNodes={setNodesWithHistory}
                  setSelectedNode={setSelectedNode}
                  nodeResults={executionResults[selectedNode.id]}
                  savedWorkflows={savedWorkflows}
                  workflow={workflow}
                  setIsSchemaVisible={setIsSchemaVisible}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
                        environment: data.environment || 'draft',
                        is_public: data.is_public !== undefined ? data.is_public : workflowMeta.is_public
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

      <AIWorkflowPlanner
        open={isAIPlannerOpen}
        onOpenChange={setIsAIPlannerOpen}
        onPlanApplied={handleAIPlan}
      />

      {/* Code View Modal */}
      {isCodeViewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-8">
           <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/20 rounded-2xl"><FileCode className="w-6 h-6 text-blue-500" /></div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Advanced Process Source</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Manual JSON Override & Diagnostic Port</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsCodeViewOpen(false)} className="h-12 w-12 rounded-2xl hover:bg-white/10"><X className="w-6 h-6 text-slate-500" /></Button>
              </div>
              <div className="flex-grow p-0 relative">
                 <textarea
                   className="w-full h-full bg-black/40 p-10 font-mono text-[13px] text-blue-400/80 resize-none focus:outline-none custom-scrollbar"
                   value={codeViewContent}
                   onChange={(e) => setCodeViewContent(e.target.value)}
                 />
                 <div className="absolute bottom-10 right-10 flex gap-4">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 h-12 font-black uppercase tracking-widest shadow-2xl" onClick={() => {
                      try {
                        const data = JSON.parse(codeViewContent);
                        recordHistory();
                        setNodes(data.nodes || []);
                        setEdges(data.edges || []);
                        setIsCodeViewOpen(false);
                        toast({ title: "Blueprint Applied", description: "Internal logic state synchronized." });
                      } catch (e) { toast({ title: "Parse Error", description: e.message, variant: "destructive" }); }
                    }}>Apply Blueprint</Button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Load Workflow Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-semibold text-slate-200 uppercase tracking-widest text-xs">Saved Processes</h3>
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
      )}

      {/* Execution History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-semibold text-slate-200 uppercase tracking-widest text-xs">Execution History</h3>
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
                        {run.timestamp?.toLocaleTimeString()} • {Object.keys(run.results || {}).length} nodes processed
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setExecutionResults(run.results || {}); setIsHistoryOpen(false); toast({ description: "Loaded past run results" }); }}>
                    View Results
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      {isKBOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-8">
           <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50 text-white">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/20 rounded-2xl"><BookOpen className="w-6 h-6 text-blue-500" /></div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">Enterprise Knowledge Base</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Standard Protocols & Technical Sovereignty</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsKBOpen(false)} className="h-12 w-12 rounded-2xl hover:bg-white/10"><X className="w-6 h-6 text-slate-500" /></Button>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <aside className="w-80 border-r border-white/5 bg-black/20 p-8 space-y-4 overflow-y-auto">
                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Internal Literature</h4>
                    {kbDocs.map(doc => (
                      <button key={doc.id} className="w-full text-left p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/40 transition-all group">
                         <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">{doc.category}</div>
                         <div className="text-sm font-bold text-slate-200 group-hover:text-white">{doc.title}</div>
                      </button>
                    ))}
                 </aside>
                 <main className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                    <div className="max-w-3xl mx-auto opacity-40 text-center py-20 italic">
                       <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-20" />
                       <p className="text-white">Select a protocol from the left to load enterprise documentation.</p>
                    </div>
                 </main>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <WorkflowBuilder />
  </ReactFlowProvider>
);