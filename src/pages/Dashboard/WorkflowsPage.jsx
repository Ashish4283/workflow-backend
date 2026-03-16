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
    ArrowUpRight
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
    const [selectedEnv, setSelectedEnv] = useState('all'); // all, draft, test, production
    const [selectedOrgId, setSelectedOrgId] = useState('all'); // all, personal, or specific ID
    const [viewMode, setViewMode] = useState('grid'); // grid, list

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // Fetch Orgs first to build the switcher
            const orgsRes = await listOrganizations();
            if (orgsRes.status === 'success') {
                setOrganizations(orgsRes.data);
            }
            
            // Fetch all workflows initially
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
            toast({ title: "Fetch Failed", description: "Could not retrieve your protocols.", variant: "destructive" });
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
        if (confirm("Are you sure you want to delete this protocol? This action cannot be undone.")) {
            try {
                await deleteWorkflow(id);
                setWorkflows(prev => prev.filter(w => w.id !== id));
                toast({ title: "Protocol Deleted", description: "The workflow has been purged from the ledger." });
            } catch (error) {
                toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
            }
        }
    };

    const filteredWorkflows = useMemo(() => {
        return workflows.filter(wf => 
            wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wf.creator_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [workflows, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: workflows.length,
            production: workflows.filter(w => w.environment === 'production').length,
            active: workflows.filter(w => w.is_public).length
        };
    }, [workflows]);

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
        <div className="p-8 space-y-8 animate-in fade-in duration-500 min-h-screen bg-[#050505]">
            {/* Header & Stats Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                            <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black font-outfit tracking-tighter text-white">Workflow Command Center</h1>
                            <p className="text-slate-400 font-medium">Manage and monitor your intelligence protocols across workspaces.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
                        <StatItem label="Total" value={stats.total} icon={Layout} />
                        <div className="w-[1px] h-8 bg-white/10 self-center" />
                        <StatItem label="Live" value={stats.production} icon={Activity} color="text-emerald-400" />
                        <div className="w-[1px] h-8 bg-white/10 self-center" />
                        <StatItem label="Shared" value={stats.active} icon={Globe} color="text-blue-400" />
                    </div>
                    <Button 
                        onClick={() => navigate('/builder')}
                        className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 gap-2"
                    >
                        <Plus className="w-5 h-5" /> New Protocol
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5 p-4 rounded-[2rem] border border-white/5 backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Workspace Switcher */}
                    <div className="flex items-center gap-2 px-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOrgSwitch('all')}
                            className={cn(
                                "rounded-xl px-4 py-2 font-bold transition-all",
                                selectedOrgId === 'all' ? "bg-white text-black" : "text-slate-400 hover:text-white hover:bg-white/10"
                            )}
                        >
                            All
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOrgSwitch('personal')}
                            className={cn(
                                "rounded-xl px-4 py-2 font-bold transition-all gap-2",
                                selectedOrgId === 'personal' ? "bg-white text-black" : "text-slate-400 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <User className="w-3.5 h-3.5" /> Personal
                        </Button>
                        {organizations.map(org => (
                            <Button 
                                key={org.id}
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOrgSwitch(org.id)}
                                className={cn(
                                    "rounded-xl px-4 py-2 font-bold transition-all gap-2",
                                    selectedOrgId === org.id ? "bg-white text-black" : "text-slate-400 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <Building className="w-3.5 h-3.5" /> {org.name}
                            </Button>
                        ))}
                    </div>

                    <div className="w-[1px] h-8 bg-white/10 hidden md:block" />

                    {/* Environment Tabs */}
                    <div className="flex p-1 bg-black/20 rounded-xl">
                        {['all', 'draft', 'test', 'production'].map((env) => (
                            <button
                                key={env}
                                onClick={() => handleEnvSwitch(env)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedEnv === env 
                                        ? "bg-zinc-800 text-white shadow-lg shadow-black/50" 
                                        : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {env}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0 md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search protocols..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-600 font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Workflow Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredWorkflows.map((wf, idx) => (
                        <WorkflowCard 
                            key={wf.id} 
                            workflow={wf} 
                            onClick={() => navigate(`/builder?id=${wf.id}`)}
                            onDelete={(e) => handleDelete(wf.id, e)}
                        />
                    ))}
                </AnimatePresence>

                {filteredWorkflows.length === 0 && (
                    <div className="col-span-full py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Activity className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">No matching protocols found</h3>
                        <p className="text-slate-600 mt-2">Try adjusting your filters or initiate a new build.</p>
                        <Button 
                            variant="outline" 
                            className="mt-8 border-white/10 hover:bg-white/5"
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

const StatItem = ({ label, value, icon: Icon, color = "text-slate-400" }) => (
    <div className="flex items-center gap-3 px-6 py-2.5">
        <Icon className={cn("w-4 h-4", color)} />
        <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">{label}</div>
            <div className="text-xl font-black text-white leading-none mt-1">{value}</div>
        </div>
    </div>
);

const WorkflowCard = ({ workflow, onClick, onDelete }) => {
    const isProd = workflow.environment === 'production';
    const isTest = workflow.environment === 'test';
    const isPublic = workflow.is_public == 1;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -5 }}
            onClick={onClick}
            className="group relative bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] p-6 cursor-pointer overflow-hidden transition-all hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
        >
            {/* Gloss Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10 space-y-5">
                {/* Top Row: Environment & Actions */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                            isProd ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            isTest ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-slate-500/10 text-slate-500 border-slate-500/20"
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", isProd ? "bg-emerald-400 animate-pulse" : isTest ? "bg-amber-400" : "bg-slate-400")} />
                            {workflow.environment || 'DRAFT'}
                        </div>
                        {isPublic && (
                            <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                                <Globe className="w-3 h-3" /> Marketplace
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={onDelete}
                        className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{workflow.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium italic"><Clock className="w-3.5 h-3.5" /> v{workflow.version || 1.0}</span>
                        <span className="flex items-center gap-1.5 font-medium"><Database className="w-3.5 h-3.5" /> {(workflow.builder_json?.nodes?.length || 0) + (workflow.builder_json?.edges?.length || 0)} Logical Nodes</span>
                    </div>
                </div>

                {/* Integration Badges (AI, API, etc) */}
                <div className="flex flex-wrap gap-2">
                    {workflow.builder_json?.nodes?.some(n => n.data?.type === 'aiNode') && (
                        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20" title="Artificial Intelligence Integrated">
                            <Cpu className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                    )}
                    {workflow.builder_json?.nodes?.some(n => n.data?.type === 'apiNode') && (
                        <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20" title="External API Connected">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                    )}
                    {workflow.builder_json?.nodes?.some(n => n.data?.type === 'vapiBpoNode') && (
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20" title="Voice Agent Active">
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                    )}
                    {workflow.builder_json?.nodes?.some(n => n.data?.type === 'appNode') && (
                        <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20" title="User App Hub">
                            <Layout className="w-3.5 h-3.5 text-pink-400" />
                        </div>
                    )}
                </div>

                {/* Footer: Creator & Stats */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {workflow.creator_avatar ? (
                            <img src={workflow.creator_avatar} className="w-6 h-6 rounded-full border border-white/10" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/10">
                                {workflow.creator_name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{workflow.creator_name || 'System Asset'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {workflow.hearts > 0 && (
                            <div className="flex items-center gap-1 text-slate-500">
                                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                                <span className="text-[10px] font-bold font-mono">{workflow.hearts}</span>
                            </div>
                        )}
                        <div className="p-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default WorkflowsPage;
