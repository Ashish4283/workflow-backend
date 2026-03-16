import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getAdminDashboardStats,
    listAllUsers,
    updateUserRole,
    deleteUser,
    listClusters,
    createCluster,
    deleteCluster,
    assignUsersToCluster,
    createOrganization,
    assignUsersToOrg,
    assignClusterToOrg,
    listOrgRequests,
    handleOrgRequest,
    updateOrganization,
    generateInvite,
    getInfrastructureMap
} from '../../services/api';
import UserManagement from '../../components/dashboard/UserManagement';
import {
    Search, Trash2, Edit2, Shield, User, Briefcase, Settings, X,
    Check, Filter, Activity, Workflow, Layers, Plus, MoreVertical,
    ChevronRight, ChevronDown, Users, GripVertical, CheckSquare, Square,
    LayoutDashboard, Building, Send, UserPlus, Mail, Copy, ExternalLink,
    Cpu, Database, Network, Globe, Zap, Network as NetworkIcon,
    RefreshCw, MousePointer2, Sparkles, ShieldCheck, Command, Terminal,
    History, Eye, ArrowRight, Lock, Unlock, EyeOff, Fingerprint, BarChart3, PieChart, Bell
} from 'lucide-react';
import DelegationModal from '../../components/dashboard/DelegationModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    console.log(`DASHBOARD_ENGINE_LOADED: v3.5 - Hierarchical Sync Active [BUILD: ${new Date().toISOString()}]`);
    const [groups, setGroups] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedOrgId, setSelectedOrgId] = useState('all');
    const [selectedGroupId, setSelectedGroupId] = useState('all');
    const [activeTab, setActiveTab] = useState('identities'); // identities, infrastructure, organizations, requests
    const [infrastructure, setInfrastructure] = useState([]);

    // UI State
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [draggedUsers, setDraggedUsers] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    // Organization UI State
    const [isCreatingOrg, setIsCreatingOrg] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgTier, setNewOrgTier] = useState('free');
    const [newOrgPublic, setNewOrgPublic] = useState(false);

    // Cluster Management Enhancements
    const [creatingForOrgId, setCreatingForOrgId] = useState(null);
    const [editingClusterId, setEditingClusterId] = useState(null);
    const [editingClusterName, setEditingClusterName] = useState('');
    const [editingClusterDesc, setEditingClusterDesc] = useState('');

    // Organization Management Enhancements
    const [editingOrgId, setEditingOrgId] = useState(null);
    const [editingOrgName, setEditingOrgName] = useState('');
    const [editingOrgTier, setEditingOrgTier] = useState('free');
    const [editingOrgPublic, setEditingOrgPublic] = useState(false);

    const [joinRequests, setJoinRequests] = useState([]);
    const [isQuickAddingClusterToOrg, setIsQuickAddingClusterToOrg] = useState(null);
    const [isRefreshingRequests, setIsRefreshingRequests] = useState(false);

    // Invite State
    const [inviteCluster, setInviteCluster] = useState(null);
    const [inviteRole, setInviteRole] = useState('tech_user');
    const [inviteLink, setInviteLink] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [commandSearch, setCommandSearch] = useState('');
    const [auditLogs, setAuditLogs] = useState([]);
    const [isDelegatingUser, setIsDelegatingUser] = useState(null);
    const [infrastructureNodes, setInfrastructureNodes] = useState([]);
    const [operationalMode, setOperationalMode] = useState('standard'); // standard, locked, stealth
    const [inspectingNode, setInspectingNode] = useState(null);
    const [scanningRequestId, setScanningRequestId] = useState(null);
    const [expandedOrgIds, setExpandedOrgIds] = useState([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showStrategistHud, setShowStrategistHud] = useState(true);
    const [strategistInsight, setStrategistInsight] = useState({
        title: "Lattice Optimization",
        msg: "Infrastructure load is balanced. Suggesting stealth protocol for next sync.",
        type: "info"
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        console.log("Admin Portal: Initiating intelligence synchronization...");
        
        let currentStats = stats;
        let currentUsers = allUsers;
        let currentRequests = joinRequests;

        // 1. Fetch Primary Stats
        try {
            const statsRes = await getAdminDashboardStats();
            if (statsRes.status === 'success') {
                currentStats = statsRes.data;
                setStats(statsRes.data);
                if (statsRes.data.organizations) setOrganizations(statsRes.data.organizations);
            }
        } catch (e) {
            console.error("Dashboard Stats Sync Failed:", e);
        }

        // 2. Fetch Users
        try {
            const usersRes = await listAllUsers();
            if (usersRes.status === 'success') {
                currentUsers = usersRes.data;
                setAllUsers(usersRes.data);
            }
        } catch (e) {
            console.error("User Directory Sync Failed:", e);
        }

        // 3. Fetch Clusters
        try {
            const groupsRes = await listClusters();
            if (groupsRes.status === 'success') setGroups(groupsRes.data);
        } catch (e) {
            console.error("Cluster Sync Failed:", e);
        }

        // 4. Fetch Infrastructure
        try {
            const infraRes = await getInfrastructureMap();
            if (infraRes.status === 'success') {
                setInfrastructureNodes(infraRes.data);
                setInfrastructure(infraRes.data);
            }
        } catch (e) {
            console.warn("Infrastructure Map Offline:", e);
        }

        // 5. Fetch Vetted Join Requests
        try {
            const reqRes = await listOrgRequests();
            if (reqRes.status === 'success') {
                currentRequests = reqRes.data;
                const vetted = reqRes.data.map(r => ({
                    ...r,
                    trust_score: Math.floor(Math.random() * 40) + 60,
                    verified_domain: (r.user_email || '').split('@')[1] === 'creative4ai.com'
                }));
                setJoinRequests(vetted);
            }
        } catch (e) {
            console.error("Vetting Protocol Failed:", e);
        }

        // 6. Intelligence Update (AI Strategist)
        const unassigned = currentUsers.filter(u => !u.organization_id).length;
        const pending = currentRequests.length;
        
        if (pending > 0) {
            setStrategistInsight({
                title: "Inbound Identity Flux",
                msg: `${pending} untrusted requests detected. Authenticate or discard immediately to maintain lattice integrity.`,
                type: "warning"
            });
        } else if (unassigned > (currentStats.users || 0) * 0.3) {
            setStrategistInsight({
                title: "Resource Fragmentation",
                msg: `${unassigned} entities are currently unassigned. High fragmentation detected. Delegate to clusters to optimize sync.`,
                type: "alert"
            });
        } else {
            setStrategistInsight({
                title: "Lattice Optimal",
                msg: "Infrastructure is synchronized. All neural paths are clear. Stealth protocol recommended.",
                type: "info"
            });
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        
        // Command Palette Listener
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsCommandPaletteOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);

        // Simulated Audit Stream
        const simulation = setInterval(() => {
            const actions = [
                "Authorized access to Node Alpha",
                "Synchronized personnel directory",
                "New entity detected in requests",
                "Cluster Bridge established",
                "Security protocol update synchronized"
            ];
            const newLog = {
                id: Date.now(),
                msg: actions[Math.floor(Math.random() * actions.length)],
                time: new Date().toLocaleTimeString()
            };
            setAuditLogs(prev => [newLog, ...prev].slice(0, 5));
        }, 5000);

        // Simulated AI Insights
        const insightInterval = setInterval(() => {
            const insights = [
                { title: "Network Efficiency", msg: "Node Sigma is operating at peak performance. Clearance levels synchronized.", type: "success" },
                { title: "Anomaly Detected", msg: "External entity from unverified domain attempting handshake. Scanning initiated.", type: "warning" },
                { title: "Cluster Resource", msg: "Cluster Beta workflows exceed standard throughput. Optimization recommended.", type: "info" }
            ];
            setStrategistInsight(insights[Math.floor(Math.random() * insights.length)]);
        }, 15000);

        return () => {
            document.removeEventListener('keydown', down);
            clearInterval(simulation);
            clearInterval(insightInterval);
        };
    }, [fetchData]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            const orgId = creatingForOrgId || isQuickAddingClusterToOrg || null;
            const res = await createCluster(newGroupName, newGroupDesc, orgId);
            if (res.status === 'success') {
                toast({ title: "Cluster Created", description: `${newGroupName} is now active.` });
                setNewGroupName('');
                setNewGroupDesc('');
                setCreatingForOrgId(null);
                setIsCreatingGroup(false);
                setIsQuickAddingClusterToOrg(null);
                fetchData();
            }
        } catch (err) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleUpdateCluster = async () => {
        if (!editingClusterName.trim()) return;
        try {
            const res = await updateCluster(editingClusterId, editingClusterName, editingClusterDesc);
            if (res.status === 'success') {
                toast({ title: "Cluster Updated", description: "Protocol changes finalized." });
                setEditingClusterId(null);
                setEditingClusterName('');
                setEditingClusterDesc('');
                fetchData();
            }
        } catch (err) {
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleCreateOrg = async () => {
        if (!newOrgName.trim()) return;
        try {
            const res = await createOrganization(newOrgName, newOrgTier, newOrgPublic);
            if (res.status === 'success') {
                toast({ title: "Organization Created", description: `${newOrgName} is now active.` });
                setNewOrgName('');
                setNewOrgTier('free');
                setNewOrgPublic(false);
                setIsCreatingOrg(false);
                fetchData();
            }
        } catch (err) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleUpdateOrg = async () => {
        if (!editingOrgName.trim()) return;
        try {
            const res = await updateOrganization(editingOrgId, editingOrgName, editingOrgTier, editingOrgPublic);
            if (res.status === 'success') {
                toast({ title: "Protocol Updated", description: `${editingOrgName} configuration has been synchronized.` });
                setEditingOrgId(null);
                setEditingOrgName('');
                fetchData();
            }
        } catch (err) {
            toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteCluster = async (id, name) => {
        if (!confirm(`Are you sure you want to decommission cluster ${name}? All members will be detached.`)) return;
        try {
            const res = await deleteCluster(id);
            if (res.status === 'success') {
                toast({ title: "Cluster Decommissioned", description: `${name} has been removed from the directory.` });
                fetchData();
            }
        } catch (err) {
            toast({ title: "Operation Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteOrg = async (id, name) => {
        if (!confirm(`Are you sure you want to decommission ${name}? All users and clusters will be detached. This cannot be undone.`)) return;
        try {
            const res = await deleteOrganization(id);
            if (res.status === 'success') {
                toast({ title: "Organization Decommissioned", description: `${name} has been dissolved.` });
                fetchData();
            }
        } catch (err) {
            toast({ title: "Operation Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleBatchAssign = async (groupId) => {
        const usersToAssign = selectedUserIds.length > 0 ? selectedUserIds : draggedUsers;
        if (usersToAssign.length === 0) return;

        try {
            const res = await assignUsersToCluster(usersToAssign, groupId);
            if (res.status === 'success') {
                const groupName = groups.find(g => g.id === groupId)?.name || "selected group";
                toast({ title: "Protocol Executed", description: `Reassigned ${usersToAssign.length} entities to ${groupName}.` });
                setSelectedUserIds([]);
                setDraggedUsers([]);
                fetchData();
            }
        } catch (err) {
            toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleBatchAssignOrg = async (orgId) => {
        const usersToAssign = selectedUserIds.length > 0 ? selectedUserIds : draggedUsers;
        if (usersToAssign.length === 0) return;

        try {
            const res = await assignUsersToOrg(usersToAssign, orgId);
            if (res.status === 'success') {
                const orgName = organizations.find(o => o.id === orgId)?.name || "selected organization";
                toast({ title: "Infrastructure Synchronized", description: `Migrated ${usersToAssign.length} entities to ${orgName} hierarchy.` });
                setSelectedUserIds([]);
                setDraggedUsers([]);
                fetchData();
            }
        } catch (err) {
            toast({ title: "Migration Failed", description: err.message, variant: "destructive" });
        }
    };

    const processRequest = async (requestId, action) => {
        try {
            const res = await handleOrgRequest(requestId, action);
            if (res.status === 'success') {
                toast({ title: `Request ${action === 'approve' ? 'Approved' : 'Rejected'}`, description: res.message });
                fetchData();
            }
        } catch (err) {
            toast({ title: "Operation Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleAssignClusterToOrg = async (clusterId, orgId) => {
        try {
            const res = await assignClusterToOrg(clusterId, orgId);
            if (res.status === 'success') {
                toast({ title: "Cluster Reassigned", description: res.message });
                fetchData();
            }
        } catch (err) {
            toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
        }
    };

    const handleCreateInvite = async () => {
        if (!inviteCluster) return;
        setIsInviting(true);
        try {
            // For Admin Dashboard, we send the specific role picked in the modal
            const res = await generateInvite('agent_invite', null, inviteCluster.id, inviteRole);
            if (res.status === 'success' || res.data) {
                const token = res.token || res.data.token || res.data.invite_url.split('=')[1];
                setInviteLink(`${window.location.origin}/invite?token=${token}`);
                toast({ title: "Invitation Protocol Generated", description: "Strategic bridge access has been synchronized." });
            }
        } catch (err) {
            toast({ title: "Generation Failed", description: err.message, variant: "destructive" });
        } finally {
            setIsInviting(false);
        }
    };

    const copyInvite = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({ title: "Copied", description: "Access token saved to clipboard." });
    };

    // Drag and Drop Logic
    const onDragStart = (e, userId) => {
        const targets = selectedUserIds.includes(userId) ? selectedUserIds : [userId];
        setDraggedUsers(targets);
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', JSON.stringify(targets));
        // Visual ghosting effect
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragEnd = () => {
        setIsDragging(false);
    };

    const onDropOnGroup = (e, groupId) => {
        e.preventDefault();
        setIsDragging(false);
        handleBatchAssign(groupId);
    };

    const onDropOnOrg = (e, orgId) => {
        e.preventDefault();
        setIsDragging(false);
        handleBatchAssignOrg(orgId);
    };

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        
        // Organization Filter
        const directOrgId = u.org_id ? u.org_id.toString() : 'none';
        const clusterOrgIds = (u.cluster_org_ids || '').split(',').map(id => id.trim()).filter(id => id !== '');
        
        const matchesOrg = selectedOrgId === 'all' || 
                          directOrgId === selectedOrgId.toString() || 
                          clusterOrgIds.includes(selectedOrgId.toString()) ||
                          (u.role === 'super_admin' && selectedOrgId === 'all' && selectedGroupId === 'all');

        // Cluster Filter
        const cids = u.cluster_ids || u.cluster_id || u.CLUSTER_IDS || '';
        const userClusterIds = String(cids).split(',').map(id => id.trim()).filter(id => id !== '');
        const matchesGroup = selectedGroupId === 'all' || 
                           (selectedGroupId === 'none' ? userClusterIds.length === 0 : userClusterIds.includes(String(selectedGroupId)));
                           
        if (selectedOrgId !== 'all' || selectedGroupId !== 'all') {
            // console.debug(`User ${u.id} | DirectOrg: ${directOrgId} | ClusterOrgs: ${clusterOrgIds} | TargetOrg: ${selectedOrgId} | Group: ${userClusterIds} vs ${selectedGroupId} | Pass: ${matchesOrg && matchesGroup}`);
        }
                           
        return matchesSearch && matchesRole && matchesOrg && matchesGroup;
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Syncing Protocols...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "h-full overflow-y-auto p-6 lg:p-10 space-y-10 pb-20 custom-scrollbar transition-all duration-700 relative",
            "grid-tactical",
            operationalMode === 'locked' && "operational-alert",
            operationalMode === 'stealth' && "operational-stealth"
        )}>
            <div className="fixed inset-0 neural-flare pointer-events-none opacity-40 z-0" />
            
            <div className="relative z-10 space-y-10">
                {/* Admin Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
                <div className="relative group">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border animate-pulse-glow",
                            operationalMode === 'locked' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        )}>
                            {operationalMode === 'locked' ? "Critical Lockdown Mode" : operationalMode === 'stealth' ? "Stealth Protocol Active" : "Intelligence Command Center"}
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">Live Network</span>
                        </div>
                    </div>
                    <h1 className="text-5xl font-black font-outfit tracking-tighter text-white mb-2 leading-none group-hover:scale-[1.01] transition-transform">
                        Identity <span className="text-gradient">& Clusters</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-bold max-w-xl uppercase tracking-widest opacity-60">
                        Operational Grid Oversight & User Neural Mapping
                    </p>
                </div>
                
                <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-3">
                        <Button 
                            onClick={fetchData} 
                            variant="outline" 
                            className="rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] transition-all h-12 px-8 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} /> 
                            Re-Sync Matrix
                        </Button>
                        <Button 
                            onClick={() => setShowStrategistHud(!showStrategistHud)} 
                            variant="outline" 
                            className={cn(
                                "rounded-2xl border border-white/10 font-black uppercase tracking-widest text-[10px] h-12 px-6 transition-all gap-2",
                                showStrategistHud ? "bg-white/5 text-slate-400" : "bg-primary/20 text-primary border-primary/30 animate-pulse"
                            )}
                        >
                            {showStrategistHud ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showStrategistHud ? "Minimize HUD" : "Restore Intel"}
                        </Button>
                    </div>
                    {/* Pulse HUD */}
                    <div className="glass-effect px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-6 shadow-2xl relative overflow-hidden group/hud">
                        <div className="absolute inset-0 bg-primary/5 -translate-x-full group-hover/hud:translate-x-full transition-transform duration-[2s] pointer-events-none" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Pulse</span>
                            <div className="flex items-center gap-2 text-emerald-400 font-black font-mono">
                                <Zap className="w-3 h-3 animate-pulse" /> 98.4%
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Neural Load</span>
                            <div className="flex items-end gap-1 h-4 mt-1">
                                {[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: h * 100 + "%" }}
                                        animate={{ height: [h * 100 + "%", (Math.random() * 0.5 + 0.3) * 100 + "%", h * 100 + "%"] }}
                                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                        className="w-1 bg-primary rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="flex flex-col shrink-0">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Entities</span>
                            <div className="text-white font-black font-mono flex items-center gap-2">
                                <Users className="w-3 h-3 text-primary" /> {allUsers.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategist Tips (Gamification Guide) */}
            <AnimatePresence>
                {showStrategistHud && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-3 overflow-hidden"
                    >
                        {[
                            { icon: MousePointer2, text: "Drag users to clusters to reassign", color: "text-indigo-400", bg: "bg-indigo-400/10" },
                            { icon: Sparkles, text: "Click Organization badges to launch sub-protocols", color: "text-amber-400", bg: "bg-amber-400/10" },
                            { icon: ShieldCheck, text: "Super Admins have universal reasoning access", color: "text-emerald-400", bg: "bg-emerald-400/10" }
                        ].map((tip, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.2 }}
                                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 text-[10px] font-bold uppercase tracking-wider", tip.bg, tip.color)}
                            >
                                <tip.icon className="w-3.5 h-3.5" />
                                {tip.text}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs Switcher (Admin/Super Admin) */}
            {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager') && (
                <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl w-fit border border-white/10 shadow-xl">
                    <button
                        onClick={() => setActiveTab('identities')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'identities' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                    >
                        <Users className="w-4 h-4" /> Entities
                    </button>
                    {user?.role === 'super_admin' && (
                        <button
                            onClick={() => setActiveTab('organizations')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === 'organizations' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            <Building className="w-4 h-4" /> Organizations
                        </button>
                    )}
                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <button
                            onClick={() => setActiveTab('infrastructure')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === 'infrastructure' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            <Network className="w-4 h-4" /> Infrastructure
                        </button>
                    )}
                    {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
                                activeTab === 'requests' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            )}
                        >
                            <Activity className="w-4 h-4" /> Join Requests
                            {joinRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white shadow-lg">
                                    {joinRequests.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>
            )}

            {activeTab === 'identities' ? (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* 1. Group Sidebar (Protocol Clusters) */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 sticky top-24">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h3 className="text-lg font-black font-outfit text-white uppercase tracking-tighter flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-primary/20 animate-pulse-glow">
                                        <Layers className="w-5 h-5 text-primary" />
                                    </div>
                                    Clusters
                                    <span className="ml-2 text-[8px] opacity-30 font-mono tracking-widest bg-white/5 px-2 py-0.5 rounded-full h-glow">TREE_V3.5_STABLE</span>
                                </h3>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-lg bg-primary/10 text-primary hover:bg-primary transition-all"
                                    onClick={() => setIsCreatingGroup(true)}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {/* 1. Global View */}
                                <div className="space-y-1">
                                    <div className="px-3 mb-2">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Directory</span>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedOrgId('all'); setSelectedGroupId('all'); }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                                            selectedOrgId === 'all' && selectedGroupId === 'all' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4" />
                                            <span className="text-sm font-bold">All Organizations</span>
                                        </div>
                                        <span className="text-[10px] font-black opacity-40">{allUsers.length}</span>
                                    </button>

                                    <button
                                        onClick={() => { setSelectedOrgId('none'); setSelectedGroupId('all'); }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                                            selectedOrgId === 'none' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className="w-4 h-4" />
                                            <span className="text-sm font-bold">Detached Entities</span>
                                        </div>
                                        <span className="text-[10px] font-black opacity-40">{allUsers.filter(u => !u.org_id && (!u.cluster_org_ids || u.cluster_org_ids === '') && u.role !== 'super_admin').length}</span>
                                    </button>
                                </div>

                                <div className="h-px bg-white/5" />

                                {/* 2. Organization Tree */}
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="px-3">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Organization Clusters</span>
                                    </div>
                                    
                                    {organizations.map(org => {
                                        const isExpanded = expandedOrgIds.includes(org.id);
                                        const isSelected = selectedOrgId === org.id.toString() || selectedOrgId === org.id;

                                        return (
                                            <div key={org.id} className="space-y-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrgId(org.id);
                                                        setSelectedGroupId('all');
                                                        setExpandedOrgIds(prev =>
                                                            prev.includes(org.id) ? prev.filter(id => id !== org.id) : [...prev, org.id]
                                                        );
                                                    }}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        if (!isExpanded) {
                                                            setExpandedOrgIds(prev => [...new Set([...prev, org.id])]);
                                                        }
                                                    }}
                                                    onDrop={(e) => onDropOnOrg(e, org.id)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group relative overflow-hidden",
                                                        isDragging && !isExpanded && "scale-[1.02] border border-primary/40 bg-primary/5",
                                                        isSelected
                                                            ? "bg-white/10 text-white border border-white/10 h-glow"
                                                            : "text-slate-400 hover:bg-white/5"
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-primary/5 animate-scan pointer-events-none" />
                                                    )}
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <Building className={cn("w-4 h-4 transition-transform group-hover:scale-110", isSelected || (isDragging && !isExpanded) ? "text-emerald-400" : "text-slate-500")} />
                                                        <span className="text-sm font-bold tracking-tight">{org.name}</span>
                                                    </div>
                                                    {isExpanded ? <ChevronDown className="w-3 h-3 text-primary" /> : <ChevronRight className="w-3 h-3 opacity-20" />}
                                                </button>

                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        className="pl-6 space-y-1 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => { setSelectedOrgId(org.id); setSelectedGroupId('all'); }}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={(e) => onDropOnOrg(e, org.id)}
                                                            className={cn(
                                                                "w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs transition-all",
                                                                isDragging && "bg-white/5 border border-dashed border-white/10",
                                                                isSelected && selectedGroupId === 'all' ? "text-primary font-bold" : "text-slate-500 hover:text-slate-300"
                                                            )}
                                                        >
                                                            <span>Full Workforce</span>
                                                            <span className="opacity-40">{allUsers.filter(u => {
                                                                const directOrgId = u.org_id?.toString();
                                                                const clusterOrgIds = (u.cluster_org_ids || '').split(',').map(id => id.trim());
                                                                return directOrgId === org.id.toString() || clusterOrgIds.includes(org.id.toString());
                                                            }).length}</span>
                                                        </button>

                                                        {groups.filter(g => g.org_id?.toString() === org.id.toString()).map(group => (
                                                            <button
                                                                key={group.id}
                                                                onClick={() => { setSelectedOrgId(org.id); setSelectedGroupId(group.id); }}
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDrop={(e) => onDropOnGroup(e, group.id)}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs transition-all group/node",
                                                                    isDragging && "bg-primary/5 border-dashed border-primary/30",
                                                                    selectedGroupId === group.id.toString() || selectedGroupId === group.id
                                                                        ? "text-primary font-black bg-primary/10 neural-active border border-primary/20"
                                                                        : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn("w-2 h-2 rounded-full transition-all", selectedGroupId === group.id.toString() || selectedGroupId === group.id ? "bg-primary scale-110" : "bg-primary/20 group-hover/node:bg-primary/40")} />
                                                                    <span>{group.name}</span>
                                                                </div>
                                                                <span className="opacity-40 font-mono tracking-tighter">{group.user_count}</span>
                                                            </button>
                                                        ))}

                                                        <button
                                                            onClick={() => { setSelectedOrgId(org.id); setSelectedGroupId('none'); }}
                                                            onDragOver={(e) => e.preventDefault()}
                                                            onDrop={(e) => onDropOnOrg(e, org.id)}
                                                            className={cn(
                                                                "w-full flex items-center justify-between px-4 py-2 rounded-xl text-xs transition-all",
                                                                isDragging && "bg-emerald-500/5 text-emerald-400 border border-dashed border-emerald-500/20",
                                                                isSelected && selectedGroupId === 'none' ? "text-primary font-bold" : "text-slate-500 hover:text-slate-300"
                                                            )}
                                                        >
                                                            <span>Unassigned Entities</span>
                                                            <span className="opacity-40">
                                                                {allUsers.filter(u => {
                                                                    const directOrgId = u.org_id?.toString();
                                                                    const clusterOrgIds = (u.cluster_org_ids || '').split(',').map(id => id.trim());
                                                                    const isPartOfOrg = directOrgId === org.id.toString() || clusterOrgIds.includes(org.id.toString());
                                                                    
                                                                    const cids = u.cluster_ids || u.cluster_id || u.CLUSTER_IDS || '';
                                                                    return isPartOfOrg && (!cids || String(cids).trim() === '');
                                                                }).length}
                                                            </span>
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {isCreatingGroup && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 rounded-3xl bg-primary/5 border border-primary/20 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                                            {creatingForOrgId ? `New Org Cluster` : `New Detached Cluster`}
                                        </span>
                                        {creatingForOrgId && (
                                            <span className="text-[9px] font-bold text-slate-500 uppercase italic">
                                                For: {organizations.find(o => o.id === creatingForOrgId)?.name}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cluster Name"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleCreateGroup} size="sm" className="flex-1 bg-primary h-9 rounded-lg font-bold">Launch</Button>
                                        <Button onClick={() => { setIsCreatingGroup(false); setCreatingForOrgId(null); }} size="sm" variant="ghost" className="h-9 rounded-lg text-slate-400">Cancel</Button>
                                    </div>
                                </motion.div>
                            )}

                            {editingClusterId && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                                            Rename Cluster Protocol
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Identification"
                                        value={editingClusterName}
                                        onChange={(e) => setEditingClusterName(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <textarea
                                        placeholder="Description (Optional)"
                                        value={editingClusterDesc}
                                        onChange={(e) => setEditingClusterDesc(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 h-20 resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleUpdateCluster} size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 rounded-lg font-bold">Update</Button>
                                        <Button onClick={() => setEditingClusterId(null)} size="sm" variant="ghost" className="h-9 rounded-lg text-slate-400">Cancel</Button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* 2. Main Identity Table */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center group">
                            <div className="relative flex-1 w-full md:max-w-md group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search identities, emails, or clusters..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium text-white shadow-xl"
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-[600px] no-scrollbar shrink-0">
                                {['identities', 'infrastructure', 'organizations', 'requests'].filter(t => {
                                    if (user?.role === 'manager' && (t === 'organizations' || t === 'requests')) return false;
                                    return true;
                                }).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                            activeTab === t ? "bg-white text-zinc-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {activeTab === 'identities' && (
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
                                {['all', 'super_admin', 'admin', 'manager', 'tech_user', 'worker', 'agent'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRoleFilter(r)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            roleFilter === r ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Bulk Action Bar */}
                        <AnimatePresence>
                            {selectedUserIds.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="bg-indigo-600 rounded-3xl p-4 flex items-center justify-between shadow-2xl shadow-indigo-600/20 text-white"
                                >
                                    <div className="flex items-center gap-4 ml-4">
                                        <div className="bg-white/20 p-2 rounded-xl">
                                            <CheckSquare className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">{selectedUserIds.length} Entities Selected</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black uppercase tracking-widest opacity-60 mr-2">Drag to a cluster or</span>
                                        {user?.role === 'super_admin' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="h-10 px-4 rounded-xl border-white/10 bg-white/5 hover:bg-primary transition-all font-bold gap-2 text-white">
                                                        <Building className="w-4 h-4" /> Move to Org
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white rounded-xl shadow-2xl p-2 w-56">
                                                    <DropdownMenuItem onClick={() => handleBatchAssignOrg('none')} className="rounded-lg hover:bg-white/10 cursor-pointer font-bold gap-2 py-3 text-red-400">
                                                        <X className="w-4 h-4" /> Detach from Org
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-white/10 my-1 mx-2" />
                                                    {organizations.map(org => (
                                                        <DropdownMenuItem key={org.id} onClick={() => handleBatchAssignOrg(org.id)} className="rounded-lg hover:bg-white/10 cursor-pointer font-bold gap-2 py-3">
                                                            <Building className="w-4 h-4 text-emerald-400" /> {org.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                        <Button variant="ghost" className="h-10 px-6 rounded-xl bg-white/10 hover:bg-white text-white hover:text-indigo-600 font-bold" onClick={() => setSelectedUserIds([])}>
                                            Cancel Protocol
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Table Container */}
                        <div className="glass-effect rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black bg-white/[0.01]">
                                            <th className="px-8 py-6 w-12">
                                                <button
                                                    onClick={() => {
                                                        if (selectedUserIds.length === filteredUsers.length) setSelectedUserIds([]);
                                                        else setSelectedUserIds(filteredUsers.map(u => u.id));
                                                    }}
                                                    className="hover:text-primary transition-colors"
                                                >
                                                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                                </button>
                                            </th>
                                            <th className="px-8 py-6">Entity Core</th>
                                            {user?.role === 'super_admin' && <th className="px-8 py-6 text-primary">Master Entity (Org)</th>}
                                            <th className="px-8 py-6">Intelligence Cluster</th>
                                            <th className="px-8 py-6">Access Level</th>
                                            <th className="px-8 py-6 text-right">Ops</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 relative">
                                    <AnimatePresence mode="popLayout">
                                        {filteredUsers.map((u, idx) => (
                                            <motion.tr
                                                key={u.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onDragStart={(e) => onDragStart(e, u.id)}
                                                onDragEnd={onDragEnd}
                                                draggable
                                                className={cn(
                                                    "hover:bg-white/[0.03] transition-colors group/row cursor-grab active:cursor-grabbing matrix-load",
                                                    selectedUserIds.includes(u.id) && "bg-primary/5"
                                                )}
                                            >
                                                    <td className="px-8 py-6">
                                                        <button onClick={() => toggleUserSelection(u.id)} className="text-slate-600 hover:text-primary transition-colors">
                                                            {selectedUserIds.includes(u.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div 
                                                                className="relative cursor-pointer"
                                                                onClick={() => setSelectedEntityIntel(u)}
                                                            >
                                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-slate-400 group-hover:border-primary transition-all duration-500 relative overflow-hidden">
                                                                    {u.name?.charAt(0) || u.email?.charAt(0)}
                                                                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 p-1 bg-zinc-950 rounded-lg border border-white/5 group-hover:border-primary/50 transition-colors">
                                                                    <Fingerprint className="w-3 h-3 text-primary animate-pulse" />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-100 group-hover:text-white transition-colors capitalize">{u.name || 'Anonymous Entity'}</span>
                                                                    {u.is_verified === 1 && (
                                                                        <div className="p-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20" title="Identity Verified">
                                                                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-slate-500 font-mono tracking-tighter">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {user?.role === 'super_admin' && (
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-slate-300">{u.org_name || 'Root Agent'}</span>
                                                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">
                                                                    {u.org_id ? `Org #ID: ${u.org_id}` : 'Direct Enrollment'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-8 py-6">
                                                        {u.role === 'super_admin' ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                                <span className="text-xs font-black text-primary uppercase tracking-widest">Global Access (Admin)</span>
                                                            </div>
                                                        ) : (u.cluster_ids || u.clusters || u.cluster_name) ? (
                                                            <div className="flex flex-wrap gap-1 items-center">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                                                {(u.clusters || u.cluster_name || '').split(',').map((name, i) => (
                                                                    <span key={i} className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                                        {name.trim()}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-600 font-bold uppercase tracking-widest italic">Detached Entity</span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border whitespace-nowrap",
                                                            u.role === 'super_admin' ? "bg-primary/10 text-primary border-primary/30" :
                                                                u.role === 'admin' ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                                                                    u.role === 'manager' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                                                                        u.role === 'tech_user' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                                                                            u.role === 'worker' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" :
                                                                                "bg-slate-500/10 text-slate-400 border-slate-500/30"
                                                        )}>
                                                            {u.role === 'agent' ? 'Agent' : u.role.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white rounded-lg">
                                                                        <MoreVertical className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-slate-950 border-white/10 text-slate-200 min-w-[150px]">
                                                                    <div className="px-2 py-1.5 text-[10px] font-black uppercase text-slate-500">Modify Authorization</div>
                                                                    {['manager', 'tech_user', 'worker'].map(r => (
                                                                        <DropdownMenuItem key={r} onClick={() => {
                                                                            updateUserRole(u.id, r).then(() => {
                                                                                toast({ title: "Role Updated", description: `${u.name}'s protocol level changed to ${r}.` });
                                                                                fetchData();
                                                                            });
                                                                        }}>
                                                                            <Shield className="w-4 h-4 mr-2" /> Set as {r.replace('_', ' ')}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                    {user?.role === 'super_admin' && (
                                                                        <DropdownMenuItem onClick={() => {
                                                                            updateUserRole(u.id, 'admin').then(() => {
                                                                                toast({ title: "Admin Elevated", description: `${u.name} is now an Organization Admin.` });
                                                                                fetchData();
                                                                            });
                                                                        }}>
                                                                            <Shield className="w-4 h-4 mr-2 text-rose-400" /> Elevated to Admin
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <div className="h-px bg-white/5 my-1" />
                                                                    <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={() => {
                                                                        if (confirm(`Decommission entity ${u.name}? This cannot be undone.`)) {
                                                                            deleteUser(u.id).then(() => {
                                                                                toast({ title: "Entity Decommissioned", description: `${u.name} has been removed from the directory.` });
                                                                                fetchData();
                                                                            });
                                                                        }
                                                                    }}>
                                                                        <Trash2 className="w-4 h-4 mr-2" /> Decommission Entity
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="py-32 text-center">
                                        <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/10">
                                            <User className="w-10 h-10 text-slate-600" />
                                        </div>
                                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Matrix Empty</h4>
                                        <p className="text-slate-500 text-xs">No entities match your current filtering criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'infrastructure' ? (
                /* Infrastructure Matrix Hub */
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter">Infrastructure Matrix</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time Reactive Node Mapping</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={fetchData}
                            className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold h-11 px-6 gap-2"
                        >
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                            Refresh Lattice
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {infrastructureNodes.length > 0 ? infrastructureNodes.map((node, idx) => (
                            <motion.div
                                key={node.id || idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="glass-effect p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/40 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-6 right-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 node-active" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Operational</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center relative overflow-hidden">
                                        <Cpu className="w-10 h-10 text-slate-500 group-hover:text-primary transition-colors" />
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tight">{node.name || 'Core Lattice Node'}</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-500 uppercase">Latency</span>
                                                <span className="text-sm font-mono text-emerald-400">{Math.floor(Math.random() * 20) + 5}ms</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-500 uppercase">Load Balance</span>
                                                <span className="text-sm font-mono text-primary">{(Math.random() * 40 + 10).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <Button 
                                        onClick={() => setInspectingNode(node)}
                                        variant="ghost" 
                                        className="text-[10px] font-black uppercase text-slate-500 hover:text-white gap-2"
                                    >
                                        Inspect Core <Eye className="w-3 h-3" />
                                    </Button>
                                </div>
                            </motion.div>
                        )) : (
                           <div className="col-span-full py-32 text-center glass-effect rounded-[3rem] border border-white/5">
                                <Globe className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-20" />
                                <h3 className="text-white font-black uppercase tracking-widest text-sm">Synchronizing Infrastructure Lattice...</h3>
                                <p className="text-slate-500 text-xs mt-2">Connecting to distributed intelligence nodes.</p>
                           </div>
                        )}
                    </div>
                </div>
            ) : activeTab === 'organizations' ? (
                /* Organizations Inventory */
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter">Registered Organizations</h2>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl gap-2 shadow-lg shadow-primary/20 transition-all h-11 px-6"
                            onClick={() => setIsCreatingOrg(true)}
                        >
                            <Plus className="w-4 h-4" />
                            New Organization
                        </Button>
                    </div>

                    <AnimatePresence>
                        {isCreatingOrg && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="glass-effect p-6 rounded-[2rem] border border-white/10 shadow-2xl space-y-4 mb-6 relative">
                                    <button onClick={() => setIsCreatingOrg(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter font-outfit flex items-center gap-2">
                                        <Building className="w-5 h-5 text-indigo-400" /> Launch Organization
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Organization Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                                                    placeholder="Enter name..."
                                                    autoFocus
                                                    value={newOrgName}
                                                    onChange={e => setNewOrgName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Billing Tier</label>
                                            <select
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none"
                                                value={newOrgTier}
                                                onChange={e => setNewOrgTier(e.target.value)}
                                            >
                                                <option value="free">Free Framework</option>
                                                <option value="pro">Pro Integration</option>
                                                <option value="enterprise">Enterprise Logic</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1 flex flex-col justify-end">
                                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={newOrgPublic}
                                                    onChange={(e) => setNewOrgPublic(e.target.checked)}
                                                    className="form-checkbox h-5 w-5 rounded bg-slate-900 border-white/20 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 transition-all cursor-pointer"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white leading-none">Public Client</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Expose external APIs</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-white/5">
                                        <Button onClick={handleCreateOrg} disabled={!newOrgName.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 rounded-xl transition-all shadow-lg shadow-indigo-600/20 gap-2">
                                            <Check className="w-5 h-5" /> Initialize
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {editingOrgId && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="glass-effect p-6 rounded-[2rem] border border-primary/20 bg-primary/5 shadow-2xl space-y-4 mb-6 relative">
                                    <button onClick={() => setEditingOrgId(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter font-outfit flex items-center gap-2">
                                        <Edit2 className="w-5 h-5 text-primary" /> Calibrate Organization
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Protocol Name</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                                                value={editingOrgName}
                                                onChange={e => setEditingOrgName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tier Classification</label>
                                            <select
                                                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                                                value={editingOrgTier}
                                                onChange={e => setEditingOrgTier(e.target.value)}
                                            >
                                                <option value="free">Free Framework</option>
                                                <option value="pro">Pro Integration</option>
                                                <option value="enterprise">Enterprise Logic</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1 flex flex-col justify-end">
                                            <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-950 rounded-xl border border-white/10">
                                                <input
                                                    type="checkbox"
                                                    checked={editingOrgPublic}
                                                    onChange={(e) => setEditingOrgPublic(e.target.checked)}
                                                    className="form-checkbox h-5 w-5 rounded bg-slate-900 border-white/20 text-primary"
                                                />
                                                <span className="text-sm font-bold text-white">Public Gateway</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-white/5">
                                        <Button onClick={handleUpdateOrg} className="bg-primary hover:bg-primary/80 text-white font-bold px-8 h-12 rounded-xl transition-all shadow-lg shadow-primary/20 gap-2">
                                            <Check className="w-5 h-5" /> Synchronize Changes
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {organizations.map(org => (
                            <motion.div
                                key={org.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => onDropOnOrg(e, org.id)}
                                className={cn(
                                    "glass-effect p-8 rounded-[2.5rem] border transition-all group relative overflow-hidden",
                                    isDragging ? "border-primary/50 bg-primary/5 scale-[1.02] alert-glow" : "border-white/5 hover:border-primary/30"
                                )}
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <Building className="w-24 h-24" />
                                </div>

                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                            {org.logo_url ? (
                                                <img src={org.logo_url} alt="" className="w-8 h-8 object-contain" />
                                            ) : (
                                                <Building className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                            org.billing_tier === 'enterprise' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                                                org.billing_tier === 'pro' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                    "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                        )}>
                                            {org.billing_tier}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{org.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">ID: {org.id} • Joined {new Date(org.created_at).toLocaleDateString()}</span>
                                            {(user.role === 'super_admin' || (user.role === 'admin' && user.org_id == org.id)) && (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingOrgId(org.id);
                                                            setEditingOrgName(org.name);
                                                            setEditingOrgTier(org.billing_tier);
                                                            setEditingOrgPublic(org.is_public_client == 1);
                                                        }}
                                                        variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    {user.role === 'super_admin' && (
                                                        <Button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteOrg(org.id, org.name); }}
                                                            variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Clusters</span>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsQuickAddingClusterToOrg(org.id);
                                                    setNewGroupName('');
                                                    setNewGroupDesc(`Cluster for ${org.name}`);
                                                }}
                                                variant="ghost" size="sm" className="h-6 text-[9px] font-black uppercase text-primary hover:bg-primary/10 rounded-md gap-1"
                                            >
                                                <Plus className="w-2.5 h-2.5" /> Add Cluster
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {org.clusters && org.clusters.length > 0 ? org.clusters.map(cluster => (
                                                <button
                                                    key={cluster.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTab('identities');
                                                        setSelectedOrgId(org.id);
                                                        setSelectedGroupId(cluster.id);
                                                        toast({ title: "Focusing Cluster", description: `Loading operational data for ${cluster.name}.` });
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group/cluster"
                                                >
                                                    <div className="relative">
                                                        <Layers className="w-3 h-3 text-primary group-hover/cluster:scale-110 transition-transform" />
                                                        <div className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-200">{cluster.name}</span>
                                                        <span className="text-[9px] font-black text-slate-500 uppercase">{cluster.workflow_count || 0} Workflows</span>
                                                    </div>
                                                </button>
                                            )) : !isQuickAddingClusterToOrg ? (
                                                <div className="text-[10px] text-slate-500 font-bold uppercase italic py-2">No clusters associated</div>
                                            ) : null}

                                            {isQuickAddingClusterToOrg === org.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="w-full mt-2 p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black uppercase text-primary tracking-widest">In-Place Cluster Engine</span>
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setIsQuickAddingClusterToOrg(null); }}
                                                            className="text-slate-500 hover:text-white"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Cluster Protocol Name"
                                                        autoFocus
                                                        value={newGroupName}
                                                        onChange={(e) => setNewGroupName(e.target.value)}
                                                        onClick={e => e.stopPropagation()}
                                                        onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary h-9"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            onClick={(e) => { e.stopPropagation(); handleCreateGroup(); }} 
                                                            size="sm" 
                                                            disabled={!newGroupName.trim()}
                                                            className="flex-1 bg-primary text-[10px] h-8 rounded-lg font-bold"
                                                        >
                                                            Launch Cluster
                                                        </Button>
                                                        <Button 
                                                            onClick={(e) => { e.stopPropagation(); setIsQuickAddingClusterToOrg(null); }} 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="px-3 h-8 text-[10px] rounded-lg text-slate-400 hover:text-white"
                                                        >
                                                            Abort
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                            <div className="flex flex-col flex-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Public Client</span>
                                                <span className={cn("text-xs font-bold", org.is_public_client ? "text-emerald-400" : "text-slate-400")}>
                                                    {org.is_public_client ? 'AUTHORITY ENABLED' : 'RESTRICTED'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <span className="text-[10px] font-black text-slate-500 uppercase">Billing Tier</span>
                                                <span className="text-xs font-bold text-slate-300 uppercase">{org.billing_tier}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => {
                                            setActiveTab('identities');
                                            setSelectedGroupId('all');
                                            setSearchTerm(org.name);
                                            toast({ title: "Focusing Organization", description: `Loading personnel directory for ${org.name}.` });
                                        }}
                                        variant="ghost" className="w-full mt-4 rounded-xl bg-white/5 hover:bg-primary hover:text-white group/btn gap-2 h-11"
                                    >
                                        Manage Org <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Join Requests Tab */
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter">Pending Authorizations</h2>
                        <Button
                            onClick={fetchData}
                            variant="outline"
                            className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold h-11 px-6 gap-2"
                        >
                            <Activity className="w-4 h-4" />
                            Force Pulse Check
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {joinRequests.length > 0 ? (
                                joinRequests.map((req) => (
                                    <motion.div
                                        key={req.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="glass-effect p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/20 transition-all"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-xl text-primary">
                                                {req.user_name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-lg">{req.user_name}</span>
                                                    {req.verified_domain ? (
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                                            <ShieldCheck className="w-3 h-3" /> Verified Domain
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                                            <Zap className="w-3 h-3" /> External Entity
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-500 font-mono">{req.user_email}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center md:items-start flex-1 text-center md:text-left">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Authorization Intelligence</span>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase">Trust Score</span>
                                                    <span className={cn("text-lg font-black font-mono", req.trust_score > 80 ? "text-emerald-400" : "text-amber-400")}>
                                                        {req.trust_score}%
                                                    </span>
                                                </div>
                                                <div className="w-px h-8 bg-white/5" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-600 uppercase">Clearance Level</span>
                                                    <span className="text-sm font-bold text-white uppercase tracking-tighter">Level 2 (Active)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-4">
                                                {scanningRequestId === req.id ? (
                                                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-widest">
                                                        <RefreshCw className="w-4 h-4 animate-spin" /> Deep-Scanning Protocol...
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Button
                                                            onClick={() => {
                                                                setScanningRequestId(req.id);
                                                                setTimeout(() => {
                                                                    setScanningRequestId(null);
                                                                    toast({ title: "Scan Complete", description: "Trust coefficient verified. Encryption stable." });
                                                                }, 3000);
                                                            }}
                                                            variant="outline"
                                                            className="rounded-xl h-12 px-6 border-white/10 hover:bg-white/5 text-slate-400 font-bold gap-2"
                                                        >
                                                            <Cpu className="w-4 h-4" /> Run Deep Scan
                                                        </Button>
                                                        <Button
                                                            onClick={() => processRequest(req.id, 'reject')}
                                                            variant="ghost"
                                                            className="rounded-xl h-12 px-6 text-rose-500 hover:bg-rose-500/10 font-bold"
                                                        >
                                                            Decline
                                                        </Button>
                                                        <Button
                                                            onClick={() => processRequest(req.id, 'approve')}
                                                            className="rounded-xl h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 gap-2"
                                                        >
                                                            <Check className="w-5 h-5" />
                                                            Authorize
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-20 text-center glass-effect rounded-[3rem] border border-white/5">
                                    <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                        <Activity className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <h3 className="text-white font-black uppercase tracking-widest text-sm">No Pending Authorizations</h3>
                                    <p className="text-slate-500 text-xs mt-2">The matrix is currently stable. No entities are awaiting entry.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Audit Log HUD (Floating Footer) */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-8 left-8 right-8 z-40 flex items-center justify-center pointer-events-none"
            >
                <div className="glass-hud px-8 py-4 rounded-[2.5rem] border border-white/10 flex items-center gap-8 shadow-2xl pointer-events-auto max-w-4xl w-full">
                    <div className="flex items-center gap-4 border-r border-white/10 pr-8 shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                            <Terminal className="w-5 h-5 text-emerald-400 animate-pulse" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Operational HUD</span>
                            <span className="text-sm font-bold text-white mt-1">Lattice Stable</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden h-10 relative">
                        <AnimatePresence mode="popLayout">
                            {auditLogs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="absolute inset-0 flex items-center gap-4 h-10"
                                >
                                    <History className="w-3 h-3 text-slate-600 shrink-0" />
                                    <span className="text-xs font-mono text-slate-400 tracking-tighter truncate">
                                        [{log.time}] <span className="text-white font-bold">{log.msg}</span>
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-6 border-l border-white/10 pl-8 shrink-0">
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                            {[
                                { id: 'standard', icon: Shield, color: 'text-primary' },
                                { id: 'stealth', icon: Lock, color: 'text-purple-400' },
                                { id: 'locked', icon: Unlock, color: 'text-rose-400' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => {
                                        setOperationalMode(mode.id);
                                        toast({ title: "Mode Switched", description: `Transitioning to ${mode.id} operational status.` });
                                    }}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        operationalMode === mode.id ? "bg-white/10 " + mode.color : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    <mode.icon className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Entities</span>
                                <span className="text-sm font-bold text-white">{allUsers.length}</span>
                            </div>
                            <Button size="icon" className="w-10 h-10 rounded-2xl bg-primary hover:bg-primary/80 group">
                                <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Global Command Palette */}
            <AnimatePresence>
                {isCommandPaletteOpen && (
                    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh] p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center gap-4">
                                <Command className="w-6 h-6 text-primary" />
                                <input
                                    type="text"
                                    placeholder="Search command matrix... (e.g. 'invite user')"
                                    className="flex-1 bg-transparent border-none text-xl font-medium text-white placeholder-slate-600 focus:outline-none"
                                    autoFocus
                                    value={commandSearch}
                                    onChange={e => setCommandSearch(e.target.value)}
                                />
                                <div className="px-2 py-1 rounded bg-white/5 border border-white/5 text-[10px] font-black text-slate-500">ESC</div>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto space-y-1">
                                <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Recommended Procedures</div>
                                {[
                                    { icon: UserPlus, label: "Invite New Entity", shortcut: "I", action: () => { setActiveTab('identities'); setIsCommandPaletteOpen(false); } },
                                    { icon: Building, label: "Manage Organizations", shortcut: "O", action: () => { setActiveTab('organizations'); setIsCommandPaletteOpen(false); } },
                                    { icon: Network, label: "Calibrate Network Lattice", shortcut: "N", action: () => { setActiveTab('infrastructure'); setIsCommandPaletteOpen(false); } },
                                    { icon: Shield, label: "Audit Global Logs", shortcut: "L", action: () => setIsCommandPaletteOpen(false) },
                                ].filter(i => i.label.toLowerCase().includes(commandSearch.toLowerCase())).map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={item.action}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-white">{item.label}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-600 border border-white/5 px-2 py-1 rounded-md">{item.shortcut}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <DelegationModal
                isOpen={!!isDelegatingUser}
                onClose={() => setIsDelegatingUser(null)}
                workflow={isDelegatingUser}
                onSuccess={() => { fetchData(); setIsDelegatingUser(null); }}
            />
            {/* Cluster Invitation Modal */}
            <AnimatePresence>
                {inviteCluster && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Cluster <span className="text-primary">Bridge</span></h2>
                                        <p className="text-slate-500 text-sm mt-1">Generating invitation for <span className="text-white font-bold">{inviteCluster.name}</span></p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setInviteCluster(null)} className="rounded-full hover:bg-white/5">
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>

                                {!inviteLink ? (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Shield className="w-3 h-3 text-primary" /> Target Permission Role
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {['manager', 'agent', 'worker'].filter(r => {
                                                    if (user?.role === 'manager' && r === 'manager') return false;
                                                    return true;
                                                }).map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setInviteRole(r)}
                                                        className={cn(
                                                            "px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                                                            inviteRole === r ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                                                        )}
                                                    >
                                                        {r === 'manager' ? 'Manager' : r === 'agent' ? 'Agent' : 'Worker'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleCreateInvite}
                                            disabled={isInviting}
                                            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                                        >
                                            {isInviting ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                            {isInviting ? "Calculating..." : "Generate Invitation Portal"}
                                        </Button>
                                    </div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-6"
                                    >
                                        <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-4">
                                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                                                <Check className="w-6 h-6 text-emerald-400" />
                                            </div>
                                            <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Bridge Synchronized</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Protocol URL</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-4 font-mono text-[10px] text-slate-400 break-all overflow-hidden line-clamp-2">
                                                    {inviteLink}
                                                </div>
                                                <Button onClick={copyInvite} variant="ghost" className="h-14 w-14 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10">
                                                    <Copy className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => setInviteCluster(null)}
                                            className="w-full h-14 bg-white/5 hover:bg-white/10 text-white font-black text-base rounded-2xl border border-white/10 transition-all uppercase tracking-widest"
                                        >
                                            Close Portal
                                        </Button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Node Inspector Modal */}
            <AnimatePresence>
                {inspectingNode && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="p-12 space-y-12 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border border-white/10 flex items-center justify-center relative group overflow-hidden">
                                            <Cpu className="w-12 h-12 text-primary" />
                                            <div className="absolute inset-0 bg-primary/20 animate-radar" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Operational Core Node</span>
                                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{inspectingNode.name}</h2>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Hardware Sync: 100% Locked</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setInspectingNode(null)} className="rounded-full h-12 w-12 hover:bg-white/5 border border-white/5">
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Throughput Lattice</span>
                                        <div className="h-32 flex items-end justify-between items-center gap-0.5">
                                            {[...Array(12)].map((_, i) => (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ height: 20 }}
                                                    animate={{ height: Math.random() * 80 + 20 }}
                                                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05, repeatType: 'reverse' }}
                                                    className="w-1.5 bg-primary rounded-full"
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                                            <span>0Hz</span>
                                            <span>4.2GHz</span>
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-6">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cognitive Load</span>
                                        <div className="relative h-32 flex items-center justify-center">
                                            <svg className="w-32 h-32 -rotate-90">
                                                <circle cx="64" cy="64" r="58" className="stroke-white/5 fill-none stroke-[8px]" />
                                                <circle 
                                                    cx="64" cy="64" r="58" 
                                                    className="stroke-primary fill-none stroke-[8px]" 
                                                    strokeDasharray="364" 
                                                    strokeDashoffset={364 - (364 * (Math.random() * 0.6 + 0.2))}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="absolute text-2xl font-black text-white font-mono">{Math.floor(Math.random() * 30 + 40)}%</span>
                                        </div>
                                        <div className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resources Balanced</div>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-white/5 border border-white/5 space-y-6">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vitals Directory</span>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                <span className="text-xs text-slate-500 font-bold uppercase">Temperature</span>
                                                <span className="text-sm font-mono text-emerald-400">42°C</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                <span className="text-xs text-slate-500 font-bold uppercase">Encryption</span>
                                                <span className="text-sm font-mono text-primary">AES-256</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                <span className="text-xs text-slate-500 font-bold uppercase">Efficiency</span>
                                                <span className="text-sm font-mono text-white">99.8%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button className="flex-1 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg gap-3 uppercase tracking-widest shadow-xl shadow-primary/20">
                                        <Zap className="w-6 h-6" /> Optimize Core Lattice
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-16 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-white font-black text-lg gap-3 uppercase tracking-widest">
                                        <Shield className="w-6 h-6" /> Run Security Audit
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Strategist Sidepanel (Desktop Only) */}
            <AnimatePresence>
                {showStrategistHud && (
                    <motion.div 
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        className="fixed right-10 top-32 w-80 hidden 2xl:block z-30"
                    >
                        <div className="glass-effect p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                        strategistInsight.type === 'success' ? "bg-emerald-500/20 text-emerald-400" :
                                        strategistInsight.type === 'warning' ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/20 text-indigo-400"
                                    )}>
                                        <Sparkles className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AI Strategist</span>
                                        <h4 className="text-sm font-black text-white uppercase">{strategistInsight.title}</h4>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowStrategistHud(false)}
                                    className="text-slate-500 hover:text-white p-1"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs font-bold text-slate-400 italic leading-relaxed">
                                "{strategistInsight.msg}"
                            </p>
                            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Proactive Reasoning V1.2</span>
                                <Button 
                                    onClick={() => {
                                        setIsOptimizing(true);
                                        setTimeout(() => {
                                            setIsOptimizing(false);
                                            toast({ title: "Optimization Complete", description: "All neural paths re-routed for maximum throughput." });
                                        }, 4000);
                                    }}
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-[9px] font-black text-primary hover:bg-primary/10"
                                >
                                    Execute Plan
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* User Digital Identity Scan Sidepanel */}
            <AnimatePresence>
                {selectedEntityIntel && (
                    <div className="fixed inset-0 z-[150] flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEntityIntel(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-xl bg-zinc-950 border-l border-white/10 relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                            <div className="absolute inset-0 grid-tactical opacity-20 pointer-events-none" />

                            <div className="p-10 space-y-12 h-full overflow-y-auto custom-scrollbar relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border border-primary/20 flex items-center justify-center relative overflow-hidden group">
                                            <span className="text-4xl font-black text-primary">{selectedEntityIntel.name?.charAt(0)}</span>
                                            <div className="absolute inset-0 bg-primary/20 animate-radar" />
                                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-scan" style={{ animationDuration: '1.5s' }} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Identity Matrix Scan</span>
                                                <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[8px] font-bold border border-emerald-500/20">VERIFIED</div>
                                            </div>
                                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">{selectedEntityIntel.name || 'Anonymous Entity'}</h2>
                                            <span className="text-sm font-mono text-slate-500">{selectedEntityIntel.email}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedEntityIntel(null)} className="rounded-full h-12 w-12 hover:bg-white/5 border border-white/10">
                                        <X className="w-6 h-6" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Shield className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Authorization Level</span>
                                        </div>
                                        <div className="text-2xl font-black text-white uppercase">{selectedEntityIntel.role}</div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: selectedEntityIntel.role === 'super_admin' ? '100%' : '60%' }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Activity className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Neural Activity</span>
                                        </div>
                                        <div className="text-2xl font-black text-emerald-400">STABLE</div>
                                        <div className="text-[10px] font-bold text-slate-600 uppercase">99.2% Sync Rate</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Assigned Clusters</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {(selectedEntityIntel.cluster_name || 'No Direct Cluster').split(',').map((c, i) => (
                                            <div key={i} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-xl bg-white/5 group-hover:bg-primary/10 transition-colors">
                                                        <Layers className="w-4 h-4 text-slate-500 group-hover:text-primary" />
                                                    </div>
                                                    <span className="font-bold text-slate-200 uppercase tracking-tight">{c.trim()}</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="text-[10px] font-black text-slate-600 hover:text-white uppercase">Manage</Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Intelligence Profile</h4>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                        "Agent profile indicates a high-frequency interaction with Cluster Beta workflows. Last authorized handshake recorded {new Date().toLocaleTimeString()} from a secure node."
                                    </p>
                                    <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-lg font-black text-white">42</div>
                                            <div className="text-[8px] font-bold text-slate-600 uppercase">Deployments</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-black text-white">12h</div>
                                            <div className="text-[8px] font-bold text-slate-600 uppercase">Active Time</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-black text-emerald-400">98%</div>
                                            <div className="text-[8px] font-bold text-slate-600 uppercase">Trust Score</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-10">
                                    <Button className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 gap-2">
                                        <Edit2 className="w-4 h-4" /> Modify Permissions
                                    </Button>
                                    <Button variant="outline" className="h-14 w-14 rounded-2xl bg-white/5 border-white/10 hover:bg-rose-500/20 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Optimization Overlay */}
            <AnimatePresence>
                {isOptimizing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-zinc-950/90 flex flex-col items-center justify-center p-12 text-center"
                    >
                        <div className="relative w-64 h-64 mb-12">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                                className="absolute inset-0 border-t-2 border-primary rounded-full"
                            />
                            <motion.div 
                                animate={{ rotate: -360 }}
                                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                                className="absolute inset-4 border-b-2 border-emerald-400 rounded-full"
                            />
                            <motion.div 
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Cpu className="w-20 h-20 text-white animate-pulse" />
                            </motion.div>
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Neural Path Optimization</h2>
                        <div className="flex flex-col gap-2 max-w-md w-full">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                <span>Logic Stream</span>
                                <span>Synchronizing...</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 4 }}
                                    className="h-full bg-gradient-to-r from-primary to-emerald-400"
                                />
                            </div>
                        </div>
                        <div className="mt-8 text-xs font-mono text-slate-600">
                            SHIELD_INIT: [0x42f8e1] | LATTICE_SYNC: [OK] | CLEARANCE: [LVL_5]
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Bulk Actions HUD */}
            <AnimatePresence>
                {selectedUserIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-6"
                    >
                        <div className="glass-effect rounded-[2rem] border border-primary/30 p-5 shadow-2xl shadow-primary/20 flex items-center justify-between gap-6 bg-slate-950/80 backdrop-blur-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 animate-pulse-glow">
                                    <span className="text-lg font-black text-primary">{selectedUserIds.length}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entities Selected</span>
                                    <span className="text-sm font-bold text-white tracking-tight">Bulk Operational Mode Active</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-[10px] font-black uppercase text-slate-500 hover:text-white h-10 px-4"
                                    onClick={() => setSelectedUserIds([])}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-[10px] font-black uppercase h-10 px-6 rounded-xl transition-all"
                                    onClick={() => {
                                        toast({ title: "Bulk Reassign", description: "This will open a target cluster selection protocol." });
                                    }}
                                >
                                    Reassign
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-[10px] font-black uppercase h-10 px-6 rounded-xl transition-all"
                                    onClick={() => {
                                        if(window.confirm(`Are you sure you want to terminate ${selectedUserIds.length} entity identities?`)) {
                                            toast({ title: "Termination Initialized", description: "Processing bulk deletion sequence." });
                                        }
                                    }}
                                >
                                    Terminate
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Toaster />
            </div>
        </div>
    );
};

export default AdminDashboard;
