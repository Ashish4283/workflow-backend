import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboardStats, listAllUsers, updateUserRole, deleteUser } from '../../services/api';
import UserManagement from '../../components/dashboard/UserManagement';
import { Search, Trash2, Edit2, Shield, User, Briefcase, Settings, X, Check, Filter } from 'lucide-react';

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

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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
        <div className="min-h-screen bg-zinc-950 text-white font-outfit">
            {/* Header */}
            <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg">
                            {user?.role === 'admin' ? <Shield className="w-5 h-5 text-white" /> : 'M'}
                        </div>
                        <span className="font-semibold text-xl tracking-tight">Admin Console</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{user?.role}</span>
                        </div>
                        <button onClick={handleLogout} className="text-zinc-500 hover:text-white text-sm font-medium transition-colors">Logout</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Management Dashboard</h1>
                        <p className="text-zinc-500 text-lg">Manage members, roles, and platform health.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchData} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all">Refresh Data</button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: 'Total Users', value: stats?.stats?.total_users || 0, color: 'indigo' },
                        { label: 'Total Workflows', value: stats?.stats?.total_workflows || 0, color: 'violet' },
                        { label: 'Active Admins', value: stats?.stats?.total_admins || 0, color: 'rose' },
                        { label: 'Total Managers', value: allUsers.filter(u => u.role === 'manager').length, color: 'amber' }
                    ].map((s, i) => (
                        <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:bg-zinc-900/60 transition-all group">
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</h3>
                            <p className="text-4xl font-black">{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Filters & Add User */}
                    <div className="space-y-8">
                        <UserManagement currentUserRole={user?.role} onUserAdded={fetchData} />

                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Filter className="w-4 h-4" /> Quick Filters</h2>
                            <div className="flex flex-wrap gap-2">
                                {['all', 'admin', 'manager', 'user', 'worker'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setRoleFilter(r)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${roleFilter === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: User Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm">
                            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-xl font-bold">Member Directory</h2>
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm w-full md:w-64 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-zinc-950/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Member</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</th>
                                            <th className="px-6 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stats</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <AnimatePresence>
                                            {filteredUsers.map((u) => (
                                                <motion.tr
                                                    key={u.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="group hover:bg-white/[0.02] transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-bold text-zinc-400 group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-all shadow-lg border border-white/5">
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white mb-0.5">{u.name}</div>
                                                                <div className="text-xs text-zinc-500 font-mono">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {editingUserId === u.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={newRole}
                                                                    onChange={(e) => setNewRole(e.target.value)}
                                                                    className="bg-zinc-950 border border-white/10 rounded-lg py-1 px-2 text-xs focus:outline-none"
                                                                >
                                                                    <option value="admin">Admin</option>
                                                                    <option value="manager">Manager</option>
                                                                    <option value="user">User</option>
                                                                    <option value="worker">Worker</option>
                                                                </select>
                                                                <button onClick={() => handleUpdateRole(u.id)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"><Check className="w-4 h-4" /></button>
                                                                <button onClick={() => setEditingUserId(null)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ) : (
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                                                                u.role === 'manager' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                                                    u.role === 'worker' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                                                }`}>
                                                                {u.role}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-zinc-400 font-bold mb-1">
                                                            {u.workflow_count} <span className="text-zinc-600 font-normal">Workflows</span>
                                                        </div>
                                                        {u.manager_name && (
                                                            <div className="text-[10px] text-zinc-500">
                                                                Managed by: {u.manager_name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => { setEditingUserId(u.id); setNewRole(u.role); }}
                                                                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                                                title="Change Role"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u.id)}
                                                                className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg transition-all"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && (
                                    <div className="py-20 text-center">
                                        <p className="text-zinc-500 font-medium">No members found matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
