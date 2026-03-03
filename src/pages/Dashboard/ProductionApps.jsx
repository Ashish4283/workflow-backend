import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Monitor,
    Play,
    Activity,
    Search,
    Shield,
    ExternalLink,
    Clock,
    Zap,
    History,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { getWorkflows } from '@/services/api';
import { Link } from 'react-router-dom';

const ProductionApps = () => {
    const { user } = useAuth();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await getWorkflows(1, 50, 'prod');
                if (res.status === 'success') {
                    // In a real app, filter for 'production' or 'active' status
                    setApps(res.data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, []);

    const filteredApps = apps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 custom-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-widest border border-rose-500/20">
                            Live Environment
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        App <span className="text-gradient">Production Dashboard</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Universal control for operational workflows.
                    </p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search production protocols..."
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
                        className="glass-effect p-6 rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="p-3 rounded-2xl bg-slate-950 border border-white/5 text-emerald-500 group-hover:scale-110 transition-transform">
                                <Monitor className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter mb-1">Stability</span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase border border-emerald-500/20 flex items-center gap-1">
                                    <ShieldCheck className="w-2.5 h-2.5" /> High
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{app.name}</h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                            Operational interface for the {app.name} system. This protocol is verified for live deployment.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Health</div>
                                <div className="text-xs font-bold text-emerald-400">99.8%</div>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Uptime</div>
                                <div className="text-xs font-bold text-emerald-400">14d+</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative z-10 pt-4 border-t border-white/5">
                            <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl h-11">
                                <Link to={`/app?id=${app.id}`}>
                                    <TrendingUp className="w-4 h-4 mr-2" /> Launch
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-11 w-11 p-0 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
                                <Activity className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredApps.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Monitor className="w-16 h-16 text-slate-700 mb-6" />
                    <h3 className="text-xl font-bold text-slate-400">No Production Apps Active</h3>
                    <p className="text-slate-600 max-w-sm mt-2">
                        Contact your system administrator to enroll protocols into the production environment.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProductionApps;
