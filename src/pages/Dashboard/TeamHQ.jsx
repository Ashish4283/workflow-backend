import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Mail, Shield,
    MoreVertical, Trash2, UserCog, Send, ExternalLink,
    Search, Filter, Activity, CheckCircle, X,
    LayoutDashboard, Cpu, Database, Workflow, Layers, Building,
    Globe, Network, Briefcase, Zap, Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    listAllUsers,
    generateInvite,
    listClusters,
    getInfrastructureMap
} from '../../services/api';
import UserManagement from '../../components/dashboard/UserManagement';

const TeamHQ = () => {
    const { user } = useAuth();
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [clusters, setClusters] = useState([]);
    const [infrastructure, setInfrastructure] = useState([]);
    const [selectedClusterId, setSelectedClusterId] = useState('');
    const [activeTab, setActiveTab] = useState('workforce'); // workforce, infrastructure, global

    const fetchData = async () => {
        setIsLoading(true);
        console.log("TeamHQ: Initiating intelligence synchronization...");
        try {
            // 1. Fetch Users
            try {
                const usersRes = await listAllUsers();
                console.log("TeamHQ Users Response:", usersRes);
                if (usersRes.status === 'success') {
                    setTeamMembers(usersRes.data || []);
                }
            } catch (e) {
                console.error("TeamHQ Users Fetch Failed:", e);
            }

            // 2. Fetch Clusters
            try {
                const clustersRes = await listClusters();
                console.log("TeamHQ Clusters Response:", clustersRes);
                if (clustersRes.status === 'success') {
                    setClusters(clustersRes.data || []);
                }
            } catch (e) {
                console.error("TeamHQ Clusters Fetch Failed:", e);
            }

            // 3. Fetch Infrastructure
            try {
                const infraRes = await getInfrastructureMap();
                console.log("TeamHQ Infrastructure Response:", infraRes);
                if (infraRes.status === 'success') {
                    setInfrastructure(infraRes.data || []);
                }
            } catch (e) {
                console.error("TeamHQ Infrastructure Fetch Failed:", e);
            }

        } catch (error) {
            console.error("HQ Global Fetch Error:", error);
            toast({ title: "Sync Failed", description: "Operational intelligence could not be retrieved.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateInvite = async (type) => {
        try {
            // If cluster is 'all' or 'none', we pass null to avoid casting errors in PHP
            const clusterId = (selectedClusterId === 'all' || selectedClusterId === 'none') ? null : selectedClusterId;

            const res = await generateInvite(type, null, clusterId);
            if (res.status === 'success' || res.data) {
                const token = res.token || (res.data && res.data.token);
                setInviteLink(`${window.location.origin}/invite?token=${token}`);
                toast({ title: "Portal Opened", description: "Strategic invitation link synchronized." });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to create invitation tunnel.", variant: "destructive" });
        }
    };

    const copyInvite = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({ title: "Copied", description: "Access protocol saved to clipboard." });
    };

    const filteredMembers = teamMembers.filter(m => {
        const matchesSearch = (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.org_name?.toLowerCase().includes(searchTerm.toLowerCase()));

        // Cluster filtering support
        const userClusterIds = m.cluster_ids ? String(m.cluster_ids).split(',') : [];
        const matchesCluster = !selectedClusterId || selectedClusterId === 'all'
            ? true
            : (selectedClusterId === 'none' ? userClusterIds.length === 0 : userClusterIds.includes(String(selectedClusterId)));

        return matchesSearch && matchesCluster;
    });

    const stats = {
        total: teamMembers.length,
        active: Math.max(0, Math.floor(teamMembers.length * 0.65)), // Simulated active
        clusters: clusters.length,
        workflows: infrastructure.reduce((acc, curr) => acc + (curr.workflows?.length || 0), 0)
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-8 pb-20 custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> Team Intelligence HQ
                        </span>
                    </div>
                    <h1 className="text-5xl font-black font-outfit tracking-tighter text-white mb-2 uppercase">
                        Center <span className="text-primary">Ops</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl font-medium">
                        Global command and control for your reasoning workforce, resource clusters, and logic infrastructure.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('workforce')}
                        className={cn("px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'workforce' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-white")}
                    >
                        Workforce
                    </button>
                    <button
                        onClick={() => setActiveTab('infrastructure')}
                        className={cn("px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'infrastructure' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-white")}
                    >
                        Infrastructure
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Workforce', value: stats.total, icon: Users, color: 'text-indigo-400' },
                    { label: 'Neural Nodes', value: stats.active, icon: Zap, color: 'text-emerald-400' },
                    { label: 'Logic Clusters', value: stats.clusters, icon: Layers, color: 'text-amber-400' },
                    { label: 'Active Workflows', value: stats.workflows, icon: Workflow, color: 'text-primary' }
                ].map((stat, idx) => (
                    <div key={idx} className="glass-effect p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-white group-hover:scale-110 transition-transform origin-left">{stat.value}</p>
                        </div>
                        <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Control Panel */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Tactical Deployment</h4>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter ml-1">Assigned Cluster Protocol</label>
                                <select
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={selectedClusterId}
                                    onChange={(e) => setSelectedClusterId(e.target.value)}
                                >
                                    <option value="all">Total Operational Vector (All)</option>
                                    <option value="none">Standalone Entities (Unassigned)</option>
                                    {clusters.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} {c.org_name ? `(${c.org_name})` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 pt-2">
                                {(user?.role === 'super_admin' || user?.role === 'admin') && (
                                    <Button
                                        onClick={() => handleCreateInvite('manager_invite')}
                                        className="w-full justify-between h-14 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-6 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-amber-400" />
                                            <div className="flex flex-col items-start">
                                                <span className="font-bold">Invite Manager</span>
                                                <span className="text-[8px] text-slate-500 uppercase">Cluster Manager</span>
                                            </div>
                                        </div>
                                        <Send className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                )}

                                <Button
                                    onClick={() => handleCreateInvite('agent_invite')}
                                    className="w-full justify-between h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 group shadow-lg shadow-primary/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserPlus className="w-5 h-5" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold">Invite Agent</span>
                                            <span className="text-[8px] text-white/50 uppercase">Reasoning Workforce</span>
                                        </div>
                                    </div>
                                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                </Button>
                            </div>
                        </div>

                        {inviteLink && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-primary to-indigo-600 rounded-[2rem] p-6 text-white relative overflow-hidden"
                            >
                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Access Granted</span>
                                        <button onClick={() => setInviteLink('')} className="bg-white/20 p-1.5 rounded-full hover:bg-white/40 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="p-4 bg-black/20 rounded-xl border border-white/20 font-mono text-[10px] break-all">
                                        {inviteLink}
                                    </div>
                                    <Button onClick={copyInvite} className="w-full bg-white text-primary hover:bg-slate-100 font-black uppercase tracking-widest text-xs h-12 rounded-xl">
                                        Synchronize Link
                                    </Button>
                                </div>
                                <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12">
                                    <Zap className="w-24 h-24" />
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 group overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2">Operational Insight</h3>
                            <p className="text-slate-400 text-sm font-medium">As a Super Admin, you are monitoring {stats.total} entities across {stats.clusters} clusters and {infrastructure.length} organizations.</p>
                        </div>
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Globe className="w-20 h-20" />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="xl:col-span-3">
                    <AnimatePresence mode="wait">
                        {activeTab === 'workforce' ? (
                            <motion.div
                                key="workforce"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                                    <div className="relative flex-1 w-full md:max-w-xl group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search agents, emails, or organizations..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-950 border border-white/5 rounded-[1.5rem] pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-white shadow-2xl"
                                        />
                                    </div>
                                    <Button onClick={fetchData} variant="ghost" className="rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-white px-6">
                                        <Activity className="w-4 h-4 mr-2" /> Refresh
                                    </Button>
                                </div>

                                <div className="glass-effect rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black bg-white/[0.01]">
                                                    <th className="px-8 py-8">Agent Protocol</th>
                                                    <th className="px-8 py-8">Organization</th>
                                                    <th className="px-8 py-8">Assigned Cluster</th>
                                                    <th className="px-8 py-8">Authentication</th>
                                                    <th className="px-8 py-8 text-right">Ops</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm divide-y divide-white/5">
                                                {filteredMembers.map((member) => (
                                                    <tr key={member.id} className="hover:bg-white/[0.02] group transition-all duration-300">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-2xl text-primary group-hover:scale-110 group-hover:border-primary/50 transition-all duration-500 shadow-inner">
                                                                    {member.name?.charAt(0) || member.email?.charAt(0)}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-100 group-hover:text-primary transition-colors text-base">{member.name || 'Unknown Agent'}</span>
                                                                    <span className="text-xs text-slate-500 font-mono tracking-tighter opacity-60 uppercase">{member.role}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                                                                    <Building className="w-4 h-4 text-slate-500" />
                                                                </div>
                                                                <span className={cn(
                                                                    "text-xs font-bold uppercase tracking-tight",
                                                                    member.org_name ? "text-slate-400" : "text-amber-500/60 italic"
                                                                )}>
                                                                    {member.org_name || 'Not Assigned'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            {member.cluster_name ? (
                                                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                    <span className="text-xs font-black text-primary uppercase tracking-tighter">{member.cluster_name}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest italic opacity-40">Detached</span>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs font-medium text-slate-300">{member.email}</span>
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">STABLE CONNECTION</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10">
                                                                        <MoreVertical className="w-5 h-5" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="bg-slate-950 border-white/10 text-slate-200 rounded-2xl p-2 min-w-[180px]">
                                                                    <DropdownMenuItem className="rounded-xl focus:bg-primary/10 py-3 cursor-pointer">
                                                                        <UserCog className="w-4 h-4 mr-3 text-primary" />
                                                                        <span className="font-bold">Sync Profile</span>
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="rounded-xl focus:bg-rose-500/10 text-rose-400 focus:text-rose-400 py-3 cursor-pointer">
                                                                        <Trash2 className="w-4 h-4 mr-3" />
                                                                        <span className="font-bold">Terminate Access</span>
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredMembers.length === 0 && (
                                            <div className="py-32 text-center bg-white/[0.01]">
                                                <div className="inline-flex p-6 rounded-full bg-white/5 mb-6 border border-white/10">
                                                    <Search className="w-12 h-12 text-slate-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Intelligence Void</h3>
                                                <p className="text-slate-500 text-sm font-medium italic">No entities match the current tracking parameters.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="infrastructure"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {infrastructure.map(cluster => (
                                    <div key={cluster.id} className="glass-effect p-8 rounded-[3rem] border border-white/5 space-y-6 hover:border-primary/30 transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                                            <Network className="w-24 h-24" />
                                        </div>

                                        <div className="relative z-10 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                        <Layers className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{cluster.name}</h3>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 w-fit">
                                                    <Building className="w-3 h-3 text-slate-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cluster.org_name || 'Global'}</span>
                                                </div>
                                            </div>
                                            <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                                                Online
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div>
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Logic Protocols</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {cluster.workflows?.length > 0 ? cluster.workflows.map(wf => (
                                                        <div key={wf.id} className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-bold text-slate-300 flex items-center gap-2.5 hover:border-emerald-500/30 transition-colors">
                                                            <Workflow className="w-3.5 h-3.5 text-emerald-400 shadow-lg shadow-emerald-400/20" />
                                                            {wf.name}
                                                        </div>
                                                    )) : (
                                                        <span className="text-[10px] text-slate-600 font-bold italic px-1 uppercase tracking-widest">No Active Workflows</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Occupying Workforce ({cluster.members?.length || 0})</h4>
                                                <div className="flex -space-x-3 overflow-hidden px-1 py-1">
                                                    {cluster.members?.map(member => (
                                                        <div key={member.id} className="inline-block h-10 w-10 rounded-2xl ring-4 ring-slate-950 bg-indigo-600 border border-white/10 flex items-center justify-center text-xs font-black text-white uppercase transition-transform hover:-translate-y-1 cursor-help" title={`${member.name} (${member.role})`}>
                                                            {member.name.charAt(0)}
                                                        </div>
                                                    ))}
                                                    {(!cluster.members || cluster.members.length === 0) && (
                                                        <span className="text-[10px] text-slate-600 font-black italic uppercase tracking-widest">Unstaffed Node</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {infrastructure.length === 0 && (
                                    <div className="md:col-span-2 py-32 text-center bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10">
                                        <div className="inline-flex p-6 rounded-full bg-white/5 mb-6">
                                            <Database className="w-12 h-12 text-slate-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2 uppercase">Infrastructure Offline</h3>
                                        <p className="text-slate-500 text-sm font-medium italic">No resource clusters are currently online in the command grid.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Invite Modal Overlay */}
            <AnimatePresence>
                {isInviteOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="w-full max-w-2xl"
                        >
                            <div className="relative">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute -top-14 -right-2 h-12 w-12 text-white bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md"
                                    onClick={() => setIsInviteOpen(false)}
                                >
                                    <X className="w-6 h-6" />
                                </Button>
                                <UserManagement
                                    currentUserRole={user.role}
                                    onUserAdded={() => {
                                        setIsInviteOpen(false);
                                        fetchData();
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamHQ;
