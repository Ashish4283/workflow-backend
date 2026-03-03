import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboardStats, listAllUsers, updateUserRole, deleteUser } from '../../services/api';
import UserManagement from '../../components/dashboard/UserManagement';
import { Search, Trash2, Edit2, Shield, User, Briefcase, Settings, X, Check, Filter, Activity, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [editingUserId, setEditingUserId] = useState(null);
    const [newRole, setNewRole] = useState('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                getAdminDashboardStats(),
                listAllUsers()
            ]);

            if (statsRes.status === 'success') {
                setStats(statsRes.data);
            } else {
                console.error("Stats Error:", statsRes.message);
            }

            if (usersRes.status === 'success') {
                setAllUsers(usersRes.data);
            } else {
                console.error("Users Error:", usersRes.message);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateRole = async (userId) => {
        try {
            const res = await updateUserRole(userId, newRole);
            if (res.status === 'success') {
                setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                setEditingUserId(null);
            } else {
                alert(res.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user? This will also delete their workflows!")) return;
        try {
            const res = await deleteUser(userId);
            if (res.status === 'success') {
                setAllUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert(res.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Admin Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                            Protocol: Advanced Control
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        System <span className="text-gradient">Intelligence</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Monitor infrastructure, manage user identities, and oversee Reasoning Engine distributions.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchData} variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold transition-all">
                        Refresh Diagnostics
                    </Button>
                </div>
            </div>

            {/* Premium Stats Cluster */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Global Users', value: stats?.stats?.total_users || 0, icon: User, color: 'text-indigo-400' },
                    { label: 'Process Blocks', value: stats?.stats?.total_workflows || 0, icon: Workflow, color: 'text-violet-400' },
                    { label: 'Security Group', value: stats?.stats?.total_admins || 0, icon: Shield, color: 'text-rose-400' },
                    { label: 'Management Unit', value: allUsers.filter(u => u.role === 'manager').length, icon: Briefcase, color: 'text-amber-400' }
                ].map((s, i) => (
                    <div key={i} className="glass-effect p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <s.icon className="w-12 h-12" />
                        </div>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">{s.label}</span>
                        <div className="text-4xl font-black text-white">{s.value}</div>
                        <div className={cn("mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest", s.color)}>
                            Operational State
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* User Lifecycle Control */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex justify-between items-center group">
                        <h2 className="text-2xl font-bold font-outfit text-white flex items-center gap-3">
                            Identity Directory
                        </h2>
                        <div className="relative group max-w-xs w-full ml-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Filter entities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="glass-effect rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold bg-white/[0.01]">
                                        <th className="px-8 py-5">Entity Cluster</th>
                                        <th className="px-8 py-5">Access Level</th>
                                        <th className="px-8 py-5 text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-white/5">
                                    <AnimatePresence>
                                        {filteredUsers.map((u) => (
                                            <motion.tr
                                                key={u.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="group hover:bg-white/[0.02] transition-all"
                                            >
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center font-black text-slate-400 shadow-inner group-hover:bg-primary/20 group-hover:border-primary/30 group-hover:text-primary transition-all duration-500">
                                                            {u.name?.charAt(0) || u.email?.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-100 group-hover:text-white transition-colors">{u.name || 'Incognito Entity'}</span>
                                                            <span className="text-xs text-slate-500 font-mono tracking-tighter">{u.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {editingUserId === u.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={newRole}
                                                                onChange={(e) => setNewRole(e.target.value)}
                                                                className="bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-primary"
                                                            >
                                                                <option value="admin">Admin</option>
                                                                <option value="manager">Manager</option>
                                                                <option value="user">User</option>
                                                                <option value="worker">Worker</option>
                                                            </select>
                                                            <button onClick={() => handleUpdateRole(u.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                                                            <button onClick={() => setEditingUserId(null)} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={() => { setEditingUserId(u.id); setNewRole(u.role); }}
                                                                className={cn(
                                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border w-fit text-left hover:scale-105 transition-transform",
                                                                    u.role === 'admin' ? "bg-rose-500/10 text-rose-400 border-rose-500/30" :
                                                                        u.role === 'manager' ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                                                                            "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                                                )}
                                                            >
                                                                {u.role}
                                                            </button>
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight ml-1">{u.workflow_count} Workflows</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            className="h-9 px-4 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-widest"
                                                        >
                                                            Terminate
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                                        <Search className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matching entities found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Constraints / Tools */}
                <div className="space-y-8">
                    <UserManagement currentUserRole={user?.role} onUserAdded={fetchData} />

                    {/* Filter Bubble Container */}
                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3 font-outfit">
                            <Filter className="w-5 h-5 text-primary" /> Filter Matrix
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'admin', 'manager', 'user', 'worker'].map(r => (
                                <button
                                    key={r}
                                    onClick={() => setRoleFilter(r)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                        roleFilter === r
                                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                            : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-100 hover:bg-white/10"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
