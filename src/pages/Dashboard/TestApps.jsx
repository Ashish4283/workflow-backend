import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Layout as FlaskConical,
    Play,
    History,
    Search,
    Zap,
    ExternalLink,
    Code,
    Zap as ZapIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { getWorkflows, rollbackWorkflow } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const TestApps = () => {
    const { user } = useAuth();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchApps = async () => {
        setLoading(true);
        try {
            const res = await getWorkflows(1, 50, 'test');
            if (res.status === 'success') {
                setApps(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApps();
    }, []);

    const handleRollback = async (id) => {
        if (!confirm("Are you sure you want to revert this protocol and initiate a rollback? Current changes will be overwritten by the latest history entry.")) return;
        try {
            const res = await rollbackWorkflow(id);
            if (res.status === 'success') {
                toast({ title: "Rollback Complete", description: res.message });
                fetchApps();
            }
        } catch (error) {
            toast({ title: "Rollback Failed", description: error.message, variant: "destructive" });
        }
    };

    const filteredApps = apps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 custom-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
                            Sandbox Environment
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        App <span className="text-gradient">Test Dashboard</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Practice environment for technical testing and operational training.
                    </p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search test protocols..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium text-white shadow-xl"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredApps.map((app, index) => (
                    <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass-effect p-6 rounded-[2rem] border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="p-3 rounded-2xl bg-slate-950 border border-white/5 text-primary group-hover:scale-110 transition-transform">
                                <FlaskConical className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter mb-1">Status</span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-bold uppercase border border-amber-500/20">
                                    Experimental
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{app.name}</h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                            This is a sandbox deployment of the {app.name} protocol. Use this space for validation and practice.
                        </p>

                        <div className="flex items-center gap-3 relative z-10 pt-4 border-t border-white/5">
                            <Button asChild className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11">
                                <Link to={`/app?id=${app.id}&mode=test`}>
                                    <Zap className="w-4 h-4 mr-2" /> Launch Test
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleRollback(app.id)}
                                className="h-11 w-11 p-0 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                                title="Protocol Rollback"
                            >
                                <History className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredApps.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FlaskConical className="w-16 h-16 text-slate-700 mb-6" />
                    <h3 className="text-xl font-bold text-slate-400">No Test Apps Available</h3>
                    <p className="text-slate-600 max-w-sm mt-2">
                        Wait for your manager to deploy test protocols to your cluster.
                    </p>
                </div>
            )}
        </div>
    );
};

export default TestApps;
