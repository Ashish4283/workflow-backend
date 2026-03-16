import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
    Layout, 
    Plus, 
    Search, 
    Filter, 
    Play, 
    Edit, 
    Activity, 
    Clock, 
    ChevronRight, 
    Heart, 
    Share2, 
    MoreVertical, 
    Trash2, 
    Globe, 
    Lock,
    Settings,
    Database,
    Cpu,
    Zap,
    Building,
    User,
    ArrowUpRight,
    ArrowUpDown,
    CheckCircle,
    History,
    MoreHorizontal,
    Box
} from 'lucide-react';
import { 
    getWorkflows, 
    deleteWorkflow, 
    listOrganizations 
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const WorkflowsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [workflows, setWorkflows] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEnv, setSelectedEnv] = useState('all'); 
    const [selectedOrgId, setSelectedOrgId] = useState('all'); 
    const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'desc' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const orgsRes = await listOrganizations();
            if (orgsRes.status === 'success') {
                setOrganizations(orgsRes.data);
                // If only one org and not super_admin, default to that org
                if (orgsRes.data.length === 1 && user?.role !== 'super_admin') {
                    setSelectedOrgId(orgsRes.data[0].id);
                }
            }
            await fetchWorkflows();
        } catch (error) {
            console.error("Failed to load workflows dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWorkflows = async (env = 'all', orgId = 'all') => {
        try {
            const orgParam = orgId === 'all' ? null : (orgId === 'personal' ? 'personal' : orgId);
            const envParam = env === 'all' ? null : env;
            
            const res = await getWorkflows(1, 100, envParam, orgParam);
            if (res.status === 'success') {
                setWorkflows(res.data);
            }
        } catch (error) {
            toast({ title: "Fetch Failed", description: "Could not retrieve your processes.", variant: "destructive" });
        }
    };

    const handleOrgSwitch = (orgId) => {
        setSelectedOrgId(orgId);
        fetchWorkflows(selectedEnv, orgId);
    };

    const handleEnvSwitch = (env) => {
        setSelectedEnv(env);
        fetchWorkflows(env, selectedOrgId);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this process? This action cannot be undone.")) {
            try {
                await deleteWorkflow(id);
                setWorkflows(prev => prev.filter(w => w.id !== id));
                toast({ title: "Process Purged", description: "The architecture has been removed from the ledger." });
            } catch (error) {
                toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
            }
        }
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedWorkflows = useMemo(() => {
        let result = workflows.filter(wf => 
            wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wf.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [workflows, searchTerm, sortConfig]);

    const stats = useMemo(() => ({
        total: workflows.length,
        production: workflows.filter(w => w.environment === 'production').length,
        active: workflows.filter(w => w.is_public).length
    }), [workflows]);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-primary/50" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700 min-h-screen bg-[#050505] text-slate-300">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-[2rem] border border-primary/20 shadow-2xl shadow-primary/20">
                            <Box className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black font-outfit tracking-tighter text-white">Process Repository</h1>
                            <p className="text-slate-500 font-medium text-lg leading-tight mt-1">High-performance intelligence orchestration & automation ledger.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                        <StatBox label="Active Nodes" value={stats.total} icon={Cpu} color="text-purple-400" />
                        <div className="w-[1px] h-10 bg-white/10 self-center" />
                        <StatBox label="Live Deploy" value={stats.production} icon={Activity} color="text-emerald-400" />
                    </div>
                    <Button 
                        onClick={() => navigate('/builder')}
                        className="h-16 px-10 rounded-[1.5rem] bg-white hover:bg-zinc-200 text-black font-black text-lg shadow-2xl shadow-white/10 transition-all active:scale-95 gap-3"
                    >
                        <Plus className="w-6 h-6 stroke-[3px]" /> New Process
                    </Button>
                </div>
            </div>

            {/* Futuristic Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/30 p-5 rounded-[2.5rem] border border-white/5 backdrop-blur-2xl">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    {/* Workspace Hub Selection */}
                    {organizations.length > 0 && (
                        <div className="flex items-center gap-2 p-1 bg-black/40 rounded-2xl border border-white/5">
                            {(user?.role === 'super_admin' || organizations.length > 1) && (
                                <button 
                                    onClick={() => handleOrgSwitch('all')}
                                    className={cn(
                                        "px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter transition-all",
                                        selectedOrgId === 'all' ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    Global
                                </button>
                            )}
                            <button 
                                onClick={() => handleOrgSwitch('personal')}
                                className={cn(
                                    "px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter transition-all gap-2 flex items-center",
                                    selectedOrgId === 'personal' ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"
                                )}
                            >
                                <User className="w-3.5 h-3.5" /> Workspace
                            </button>
                            {organizations.map(org => (
                                <button 
                                    key={org.id}
                                    onClick={() => handleOrgSwitch(org.id)}
                                    className={cn(
                                        "px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-tighter transition-all gap-2 flex items-center",
                                        selectedOrgId === org.id ? "bg-white text-black shadow-lg" : "text-slate-500 hover:text-white"
                                    )}
                                >
                                    <Building className="w-3.5 h-3.5" /> {org.name}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="w-[1px] h-8 bg-white/10 hidden md:block" />

                    {/* Env Matrix */}
                    <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5">
                        {['all', 'draft', 'test', 'production'].map((env) => (
                            <button
                                key={env}
                                onClick={() => handleEnvSwitch(env)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedEnv === env 
                                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {env}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text"
                        placeholder="Filter system ledger..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/60 border border-white/5 rounded-[1.5rem] pl-14 pr-6 py-3.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-600 font-bold"
                    />
                </div>
            </div>

            {/* Tabulator-Style Enterprise Table */}
            <div className="bg-zinc-900/20 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-2">
                                        Process Detail <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status & Context</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 cursor-pointer group hover:text-white" onClick={() => handleSort('version')}>
                                    <div className="flex items-center gap-2 text-center justify-center">
                                        Iteration <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Architecture</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 cursor-pointer group hover:text-white" onClick={() => handleSort('updated_at')}>
                                    <div className="flex items-center gap-2">
                                        Last Signal <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {filteredAndSortedWorkflows.map((wf) => (
                                    <ProcessRow 
                                        key={wf.id} 
                                        process={wf} 
                                        onEdit={() => navigate(`/builder?id=${wf.id}`)}
                                        onDelete={(e) => handleDelete(wf.id, e)}
                                    />
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filteredAndSortedWorkflows.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                            <Box className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-400 tracking-tighter">System ledger empty</h3>
                        <p className="text-slate-600 font-medium mt-2">Initiate a new build process to populate this matrix.</p>
                        <Button 
                            variant="outline" 
                            className="mt-10 rounded-2xl border-white/10 hover:bg-white/5 px-10 h-14 font-black text-xs uppercase tracking-widest"
                            onClick={() => { setSelectedEnv('all'); setSelectedOrgId('all'); setSearchTerm(''); }}
                        >
                            Reset System Filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

const StatBox = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center gap-4 px-6 py-2.5">
        <div className={cn("p-2 rounded-xl bg-white/5", color)}>
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</div>
            <div className="text-2xl font-black text-white leading-none">{value}</div>
        </div>
    </div>
);

const ProcessRow = ({ process, onEdit, onDelete }) => {
    const isProd = process.environment === 'production';
    const isTest = process.environment === 'test';
    const nodesCount = (process.builder_json?.nodes?.length || 0);
    const edgesCount = (process.builder_json?.edges?.length || 0);

    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="group hover:bg-white/[0.04] transition-all cursor-pointer"
            onClick={onEdit}
        >
            <td className="px-8 py-6">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110",
                        isProd ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 border-white/10"
                    )}>
                        {isProd ? <Zap className="w-5 h-5 text-emerald-400" /> : <Database className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                        <div className="text-base font-black text-white group-hover:text-primary transition-colors tracking-tight">{process.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{process.creator_name || 'System Operator'}</span>
                            {process.is_public == 1 && (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-blue-400/80 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">
                                    <Globe className="w-2.5 h-2.5" /> Public Hub
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>
            
            <td className="px-6 py-6">
                <div className="flex flex-col gap-2">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit",
                        isProd ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        isTest ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-slate-500/10 text-slate-500 border-slate-500/20"
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full", isProd ? "bg-emerald-400 animate-pulse" : isTest ? "bg-amber-400" : "bg-slate-400")} />
                        {process.environment || 'DRAFT'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold italic">
                        <Building className="w-3 h-3" /> {process.org_name || 'Private Architecture'}
                    </div>
                </div>
            </td>

            <td className="px-6 py-6 text-center">
                <div className="inline-block px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-xs font-mono font-black text-white">v{process.version || '1.0'}</span>
                </div>
            </td>

            <td className="px-6 py-6">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {process.builder_json?.nodes?.slice(0, 3).map((n, i) => (
                            <div key={i} className="w-6 h-6 rounded-lg bg-zinc-800 border border-black flex items-center justify-center" title={n.data?.label}>
                                <div className="w-2 h-2 rounded-full bg-primary/60" />
                            </div>
                        ))}
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {nodesCount} Nodes / {edgesCount} Links
                    </div>
                </div>
            </td>

            <td className="px-6 py-6">
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-600" />
                    <div className="text-xs font-medium font-mono">
                        {new Date(process.updated_at).toLocaleDateString()}
                        <span className="text-slate-600 ml-2 hidden lg:inline">{new Date(process.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </td>

            <td className="px-8 py-6 text-right">
                <div className="flex items-center justify-end gap-2">
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 bg-white/5 hover:bg-white/10 text-slate-400" 
                        onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400" 
                        onClick={onDelete}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="h-9 w-[1px] bg-white/5 mx-1" />
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 bg-primary/10 hover:bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-all border border-primary/20"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                    </Button>
                </div>
            </td>
        </motion.tr>
    );
};

export default WorkflowsPage;
