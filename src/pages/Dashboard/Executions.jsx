import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Play, CheckCircle2, XCircle, Clock,
    ArrowRight, Search, Filter, RefreshCw, BarChart3,
    GripVertical, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { getExecutionLogs } from '@/services/api';

const ExecutionStatus = ({ status }) => {
    switch (status) {
        case 'completed':
            return (
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" /> Success
                </div>
            );
        case 'failed':
            return (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 text-[10px] font-black uppercase tracking-widest">
                    <XCircle className="w-3 h-3" /> Failed
                </div>
            );
        case 'running':
            return (
                <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                    <RefreshCw className="w-3 h-3 animate-spin" /> In Progress
                </div>
            );
        default:
            return null;
    }
};

const Executions = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [executions, setExecutions] = useState([]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await getExecutionLogs();
            if (response.status === 'success') {
                setExecutions(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch execution protocols:", error);
            toast({ title: "Monitoring Offline", description: "Could not establish a connection with the activity ledger.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleRefresh = () => {
        fetchLogs();
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            Protocol: Activity Monitoring
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        Execution <span className="text-gradient">History</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        A real-time ledger of every reasoning chain executed by your agents.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleRefresh} variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6">
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh Logs
                    </Button>
                </div>
            </div>

            {/* Stats Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-effect p-6 rounded-[2rem] border border-white/5 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Success Rate</span>
                        <div className="text-2xl font-bold text-white">96.8%</div>
                    </div>
                </div>
                <div className="glass-effect p-6 rounded-[2rem] border border-white/5 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Activity className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Runs</span>
                        <div className="text-2xl font-bold text-white">1,429</div>
                    </div>
                </div>
                <div className="glass-effect p-6 rounded-[2rem] border border-white/5 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Clock className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Latency</span>
                        <div className="text-2xl font-bold text-white">1.24s</div>
                    </div>
                </div>
            </div>

            {/* Main Logs Area */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center group">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter execution logs..."
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 shrink-0">
                        <Button variant="ghost" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-zinc-950">Current Week</Button>
                        <Button variant="ghost" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Previous</Button>
                    </div>
                </div>

                <div className="glass-effect rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black bg-white/[0.01]">
                                    <th className="px-8 py-6 w-12">#</th>
                                    <th className="px-8 py-6">Workflow</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6">Duration</th>
                                    <th className="px-8 py-6 text-right">Performed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-6">
                                                <div className="h-14 bg-white/5 rounded-2xl w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    executions.map((ex, idx) => (
                                        <tr key={ex.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                                            <td className="px-8 py-6 text-xs font-mono text-slate-600">{idx + 1}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-200 group-hover:text-primary transition-colors">{ex.workflowName}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Nodes processed: {ex.nodes}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <ExecutionStatus status={ex.status} />
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                                                    <BarChart3 className="w-3 h-3 opacity-40 text-primary" /> {ex.duration}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-3 text-slate-500 font-medium text-xs">
                                                    {ex.timestamp}
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Executions;
