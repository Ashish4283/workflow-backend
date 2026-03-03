import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getAdminDashboardStats,
    listAllUsers,
    updateUserRole,
    deleteUser,
    listGroups,
    createGroup,
    deleteGroup,
    assignUsersToGroup
} from '../../services/api';
import UserManagement from '../../components/dashboard/UserManagement';
import {
    Search, Trash2, Edit2, Shield, User, Briefcase, Settings, X,
    Check, Filter, Activity, Workflow, Layers, Plus, MoreVertical,
    ChevronRight, Users, GripVertical, CheckSquare, Square,
    LayoutDashboard, Briefcase, Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

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
    const [activeTab, setActiveTab] = useState('identities');

    // UI State
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [draggedUsers, setDraggedUsers] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [statsRes, usersRes, groupsRes] = await Promise.all([
                getAdminDashboardStats(),
                listAllUsers(),
                listGroups()
            ]);

            if (statsRes.status === 'success') {
                setStats(statsRes.data);
                if (statsRes.data.organizations) setOrganizations(statsRes.data.organizations);
            }
            if (usersRes.status === 'success') setAllUsers(usersRes.data);
            if (groupsRes.status === 'success') setGroups(groupsRes.data);

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
            const res = await createGroup(newGroupName, newGroupDesc);
            if (res.status === 'success') {
                toast({ title: "Group Created", description: `${newGroupName} is now active.` });
                setNewGroupName('');
                setNewGroupDesc('');
                setIsCreatingGroup(false);
                fetchData();
            }
        } catch (err) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleBatchAssign = async (groupId) => {
        const usersToAssign = selectedUserIds.length > 0 ? selectedUserIds : draggedUsers;
        if (usersToAssign.length === 0) return;

        try {
            const res = await assignUsersToGroup(usersToAssign, groupId);
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
        const matchesGroup = selectedGroupId === 'all' || (selectedGroupId === 'none' ? !u.group_id : u.group_id == selectedGroupId);
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

            {/* Tabs Switcher (Super Admin only) */}
            {user?.role === 'super_admin' && (
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
                    <button
                        onClick={() => setActiveTab('organizations')}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'organizations' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                        )}
                    >
                        <Building2 className="w-4 h-4" /> Organizations
                    </button>
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
                                    <span className="text-[10px] font-black opacity-40">{allUsers.filter(u => !u.group_id).length}</span>
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
                                            <span className="text-[10px] font-black opacity-40 ml-2">{group.user_count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isCreatingGroup && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 p-4 rounded-3xl bg-white/5 border border-white/10 space-y-4"
                                >
                                    <input
                                        type="text"
                                        placeholder="Cluster Name"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <div className="flex gap-2 text-white">
                                        <Button onClick={handleCreateGroup} size="sm" className="flex-1 bg-primary h-9 rounded-lg">Launch</Button>
                                        <Button onClick={() => setIsCreatingGroup(false)} size="sm" variant="ghost" className="h-9 rounded-lg">Cancel</Button>
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

                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-[500px] no-scrollbar">
                                {['all', 'super_admin', 'admin', 'manager', 'tech_user', 'agent'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRoleFilter(r)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                            roleFilter === r ? "bg-white text-zinc-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                                                        {u.group_id ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                                <span className="text-xs font-bold text-slate-300">{groups.find(g => g.id == u.group_id)?.name}</span>
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
                                                                            "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                                        )}>
                                                            {u.role === 'agent' ? 'Agent' : u.role.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-white rounded-lg">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
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
            ) : (
                /* Organizations Inventory */
                <div className="space-y-6">
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
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">ID: {org.id} • Joined {new Date(org.created_at).toLocaleDateString()}</span>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Hierarchy</span>
                                            <span className="text-sm font-bold text-slate-300">Standard</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Public Client</span>
                                            <span className="text-sm font-bold text-emerald-400">{org.is_public_client ? 'YES' : 'NO'}</span>
                                        </div>
                                    </div>

                                    <Button variant="ghost" className="w-full mt-4 rounded-xl bg-white/5 hover:bg-primary hover:text-white group/btn gap-2 h-11">
                                        Manage Org <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
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
        </div>
    );
};

export default AdminDashboard;
