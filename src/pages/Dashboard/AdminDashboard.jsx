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
    ChevronRight, Users, GripVertical, CheckSquare, Square,
    LayoutDashboard, Building, Send, UserPlus, Mail, Copy, ExternalLink,
    Cpu, Database, Network, Globe, Zap, Network as NetworkIcon
} from 'lucide-react';
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
    const [groups, setGroups] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
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
    const [isRefreshingRequests, setIsRefreshingRequests] = useState(false);

    // Invite State
    const [inviteCluster, setInviteCluster] = useState(null);
    const [inviteRole, setInviteRole] = useState('tech_user');
    const [inviteLink, setInviteLink] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsRes, usersRes, groupsRes] = await Promise.all([
                getAdminDashboardStats(),
                listAllUsers(),
                listClusters()
            ]);

            if (statsRes.status === 'success') {
                setStats(statsRes.data);
                if (statsRes.data.organizations) setOrganizations(statsRes.data.organizations);
            }
            if (usersRes.status === 'success') setAllUsers(usersRes.data);
            if (groupsRes.status === 'success') setGroups(groupsRes.data);

            const infraRes = await getInfrastructureMap();
            if (infraRes.status === 'success') setInfrastructure(infraRes.data);

            if (user?.role === 'super_admin' || user?.role === 'admin') {
                const reqsRes = await listOrgRequests();
                if (reqsRes.status === 'success') setJoinRequests(reqsRes.data);
            }
            // 'groups' state now holds cluster data

        } catch (error) {
            console.error("Error fetching data", error);
            toast({ title: "Sync Failed", description: "Could not retrieve system intelligence.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        try {
            const res = await createCluster(newGroupName, newGroupDesc, creatingForOrgId || null);
            if (res.status === 'success') {
                toast({ title: "Cluster Created", description: `${newGroupName} is now active.` });
                setNewGroupName('');
                setNewGroupDesc('');
                setCreatingForOrgId(null);
                setIsCreatingGroup(false);
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
        // ... (existing)
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
            // Mapping roles to invite types if needed, but generate.php expects type, workflow_id, cluster_id
            // For cluster invites, we use 'agent_invite' or 'manager_invite'
            const inviteType = inviteRole === 'manager' ? 'manager_invite' : 'agent_invite';
            const res = await generateInvite(inviteType, null, inviteCluster.id);
            if (res.status === 'success' || res.data) {
                const token = res.token || res.data.token;
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

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        const matchesGroup = selectedGroupId === 'all' || (selectedGroupId === 'none' ? !u.cluster_id : u.cluster_id == selectedGroupId);
        return matchesSearch && matchesRole && matchesGroup;
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
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-10 pb-20 custom-scrollbar">
            {/* Admin Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                            Enterprise Directory Engine
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        Identity <span className="text-gradient">& Clusters</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Universal control over user clusters, permissions, and cross-reasoning visibility.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchData} variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold transition-all h-12 px-6">
                        Refresh Engine
                    </Button>
                </div>
            </div>

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
                                    <Layers className="w-5 h-5 text-primary" /> Clusters
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

                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedGroupId('all')}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                                        selectedGroupId === 'all' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-bold">All Entities</span>
                                    </div>
                                    <span className="text-[10px] font-black opacity-40">{allUsers.length}</span>
                                </button>

                                <button
                                    onClick={() => setSelectedGroupId('none')}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all group",
                                        selectedGroupId === 'none' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Filter className="w-4 h-4" />
                                        <span className="text-sm font-bold">Unassigned</span>
                                    </div>
                                    <span className="text-[10px] font-black opacity-40">{allUsers.filter(u => !u.cluster_id).length}</span>
                                </button>

                                <div className="h-px bg-white/5 my-4 mx-2" />

                                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {groups.map(group => (
                                        <div
                                            key={group.id}
                                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-primary/20', 'scale-[1.02]'); }}
                                            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-primary/20', 'scale-[1.02]'); }}
                                            onDrop={(e) => { e.currentTarget.classList.remove('bg-primary/20', 'scale-[1.02]'); onDropOnGroup(e, group.id); }}
                                            onClick={() => setSelectedGroupId(group.id)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer border border-transparent",
                                                selectedGroupId === group.id
                                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                                    : isDragging ? "bg-primary/5 border-dashed border-primary/40 text-slate-300 scale-[0.98]" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={cn("w-2 h-2 rounded-full shrink-0", selectedGroupId === group.id ? "bg-white" : "bg-primary")} />
                                                <span className="text-sm font-bold truncate">{group.name}</span>
                                            </div>

                                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                <span className="text-[10px] font-black opacity-40 mr-1">{group.user_count}</span>
                                                {['super_admin', 'admin'].includes(user?.role) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10 outline-none"><MoreVertical className="w-3 h-3" /></button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white rounded-xl shadow-2xl p-2 w-56 z-50">
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-2 pb-1">Cluster Organizations</div>
                                                            {user?.role === 'super_admin' ? (
                                                                organizations.length > 0 ? organizations.map(org => (
                                                                    <DropdownMenuItem key={org.id} onClick={(e) => { e.stopPropagation(); handleAssignClusterToOrg(group.id, org.id); }} className="rounded-lg hover:bg-white/10 cursor-pointer font-bold gap-2 py-2">
                                                                        <Building className="w-3 h-3 text-emerald-400" /> Bind to: {org.name}
                                                                    </DropdownMenuItem>
                                                                )) : <div className="text-xs px-2 py-1 text-slate-400 italic">No organizations found</div>
                                                            ) : (
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAssignClusterToOrg(group.id, user.org_id); }} className="rounded-lg hover:bg-white/10 cursor-pointer font-bold gap-2 py-2">
                                                                    <Building className="w-3 h-3 text-primary" /> Authorize to My Org
                                                                </DropdownMenuItem>
                                                            )}
                                                            {((user?.role === 'super_admin' && group.org_id) || (user?.role === 'admin' && group.org_id === user.org_id)) && (
                                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAssignClusterToOrg(group.id, 'none'); }} className="rounded-lg hover:bg-white/10 cursor-pointer font-bold gap-2 py-2 text-rose-400">
                                                                    <X className="w-3 h-3" /> Detach Organization
                                                                </DropdownMenuItem>
                                                            )}
                                                            <div className="h-px bg-white/5 my-1" />
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                setInviteCluster(group);
                                                                setInviteRole('tech_user');
                                                                setInviteLink('');
                                                            }} className="rounded-lg hover:bg-indigo-500/10 text-indigo-400 cursor-pointer font-bold gap-2 py-2">
                                                                <UserPlus className="w-3 h-3" /> Invite to Cluster
                                                            </DropdownMenuItem>
                                                            <div className="h-px bg-white/5 my-1" />
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingClusterId(group.id);
                                                                setEditingClusterName(group.name);
                                                                setEditingClusterDesc(group.description || '');
                                                            }} className="rounded-lg hover:bg-white/10 cursor-pointer font-bold gap-2 py-2 text-primary">
                                                                <Edit2 className="w-3 h-3" /> Rename Cluster
                                                            </DropdownMenuItem>
                                                            <div className="h-px bg-white/5 my-1" />
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteCluster(group.id, group.name); }} className="rounded-lg hover:bg-rose-500/10 text-rose-400 cursor-pointer font-bold gap-2 py-2">
                                                                <Trash2 className="w-3 h-3" /> Decommission Cluster
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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
                                    <tbody className="text-sm divide-y divide-white/5">
                                        <AnimatePresence>
                                            {filteredUsers.map((u) => (
                                                <motion.tr
                                                    key={u.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, u.id)}
                                                    onDragEnd={onDragEnd}
                                                    className={cn(
                                                        "group transition-all duration-300",
                                                        selectedUserIds.includes(u.id) ? "bg-primary/5" : "hover:bg-white/[0.02] cursor-grab active:cursor-grabbing"
                                                    )}
                                                >
                                                    <td className="px-8 py-6">
                                                        <button onClick={() => toggleUserSelection(u.id)} className="text-slate-600 hover:text-primary transition-colors">
                                                            {selectedUserIds.includes(u.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative">
                                                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-slate-400 group-hover:border-primary/50 transition-all duration-500">
                                                                    {u.name?.charAt(0) || u.email?.charAt(0)}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 p-1 bg-zinc-950 rounded-lg">
                                                                    <GripVertical className="w-3 h-3 text-slate-700" />
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-100 group-hover:text-white transition-colors capitalize">{u.name || 'Anonymous Entity'}</span>
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
                                                        {u.cluster_id ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span className="text-xs font-bold text-slate-300">{groups.find(g => g.id == u.cluster_id)?.name}</span>
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
                                className="glass-effect p-8 rounded-[2.5rem] border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden"
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
                                                    setActiveTab('identities');
                                                    setCreatingForOrgId(org.id);
                                                    setIsCreatingGroup(true);
                                                    setNewGroupDesc(`Cluster for ${org.name}`);
                                                    toast({ title: "Opening Cluster Engine", description: `Configuring new protocol for ${org.name}.` });
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
                                                        setSelectedGroupId(cluster.id);
                                                        toast({ title: "Focusing Cluster", description: `Loading operational data for ${cluster.name}.` });
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group/cluster"
                                                >
                                                    <Layers className="w-3 h-3 text-primary group-hover/cluster:scale-110 transition-transform" />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-200">{cluster.name}</span>
                                                        <span className="text-[9px] font-black text-slate-500 uppercase">{cluster.workflow_count || 0} Workflows</span>
                                                    </div>
                                                </button>
                                            )) : (
                                                <div className="text-[10px] text-slate-500 font-bold uppercase italic py-2">No clusters associated</div>
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
                                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                        Detached Entity
                                                    </span>
                                                </div>
                                                <span className="text-sm text-slate-500 font-mono">{req.user_email}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center md:items-start flex-1 text-center md:text-left">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Target Organization</span>
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <Building className="w-4 h-4 text-emerald-400" />
                                                {req.org_name}
                                            </div>
                                            {req.message && (
                                                <div className="mt-2 text-xs text-slate-400 italic bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                                    "{req.message}"
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={() => processRequest(req.id, 'reject')}
                                                variant="ghost"
                                                className="rounded-xl h-12 px-6 text-rose-400 hover:bg-rose-500/10 font-bold"
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

            {/* Quick Stats Overlay (Floating Footer) */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-8 right-8 z-40 hidden md:flex items-center gap-4"
            >
                <div className="glass-effect px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4 shadow-2xl">
                    <Activity className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Global Pulse</span>
                        <span className="text-sm font-bold text-white leading-none mt-1">98.4% Efficiency</span>
                    </div>
                    <div className="w-px h-6 bg-white/5 mx-2" />
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-bold text-white">{allUsers.length}</span>
                    </div>
                </div>
            </motion.div>
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
                                                {['tech_user', 'worker', 'manager', 'agent'].map(r => (
                                                    <button
                                                        key={r}
                                                        onClick={() => setInviteRole(r)}
                                                        className={cn(
                                                            "px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                                                            inviteRole === r ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10"
                                                        )}
                                                    >
                                                        {r}
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
        </div>
    );
};

export default AdminDashboard;
