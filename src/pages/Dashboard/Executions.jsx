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
import { getExecutionLogs, getTasks, pickupTask, getWorkflows, createTasks } from '@/services/api';

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
        case 'in_progress':
        case 'assigned':
            return (
                <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 text-[10px] font-black uppercase tracking-widest">
                    <RefreshCw className="w-3 h-3 animate-spin" /> {status === 'assigned' ? 'Ongoing' : 'In Progress'}
                </div>
            );
        case 'pending':
            return (
                <div className="flex items-center gap-2 text-slate-400 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/20 text-[10px] font-black uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> Queued
                </div>
            );
        default:
            return null;
    }
};

const Executions = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [executions, setExecutions] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeTab, setActiveTab] = useState('queue'); // Default to Queue for ops focus
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const response = await getExecutionLogs();
            if (response.status === 'success') {
                setExecutions(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await getTasks();
            if (response.status === 'success') {
                setTasks(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') fetchLogs();
        else fetchTasks();
    }, [activeTab]);

    const handleRefresh = () => {
        if (activeTab === 'logs') fetchLogs();
        else fetchTasks();
    };

    const handlePickup = async (id) => {
        try {
            const res = await pickupTask(id);
            if (res.status === 'success') {
                toast({ title: "Task Acquired", description: res.message });
                fetchTasks(); // Refresh list
            }
        } catch (error) {
            toast({ title: "Pickup Failed", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-8 pb-20 custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            Protocol: Operational Oversight
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        Execution <span className="text-gradient">Center</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Monitor live reasoning logs and manage the operational task queue.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === 'queue' && (
                        <Button
                            onClick={() => setIsImportModalOpen(true)}
                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 shadow-lg shadow-primary/20"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Import Tasks (CSV)
                        </Button>
                    )}
                    <Button onClick={handleRefresh} variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6">
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('queue')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'queue' ? "bg-white text-slate-950 shadow-xl" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    Operational Queue
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === 'logs' ? "bg-white text-slate-950 shadow-xl" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    Activity Audit
                </button>
            </div>

            {/* Stats Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-effect p-6 rounded-[2rem] border border-white/5 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
                        <div className="text-2xl font-bold text-white">96.8%</div>
                    </div>
                </div>
                <div className="glass-effect p-6 rounded-[2rem] border border-white/5 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Activity className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Threads</span>
                        <div className="text-2xl font-bold text-white">{activeTab === 'queue' ? tasks.length : executions.length}</div>
                    </div>
                </div>
                <div className="glass-effect p-6 rounded-[2rem] border border-white/5 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Clock className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Latency</span>
                        <div className="text-2xl font-bold text-white">0.84ms</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                <div className="glass-effect rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black bg-white/[0.01]">
                                    <th className="px-8 py-6 w-12">#</th>
                                    <th className="px-8 py-6">{activeTab === 'queue' ? 'Task Mapping' : 'Protocol'}</th>
                                    <th className="px-8 py-6">Status</th>
                                    <th className="px-8 py-6">{activeTab === 'queue' ? 'Agent' : 'Duration'}</th>
                                    <th className="px-8 py-6 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-8 py-10">
                                                <div className="h-10 bg-white/5 rounded-2xl w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : activeTab === 'logs' ? (
                                    executions.map((ex, idx) => (
                                        <tr key={ex.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                                            <td className="px-8 py-6 text-xs font-mono text-slate-600">{idx + 1}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-200 group-hover:text-primary transition-colors">{ex.workflowName}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Nodes: {ex.nodes}</span>
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
                                                <div className="flex items-center justify-end gap-3 text-slate-500 font-medium text-xs font-mono">
                                                    {ex.timestamp}
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-primary" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    tasks.map((task, idx) => (
                                        <tr key={task.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-6 text-xs font-mono text-slate-600">{idx + 1}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-200">{task.workflowName || 'Generic Task'}</span>
                                                    <span className="text-[10px] text-slate-500 uppercase font-mono max-w-xs truncate">
                                                        REF: {task.external_ref || 'NO_REF'} | Data: {JSON.stringify(task.input_data).substring(0, 50)}...
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <ExecutionStatus status={task.status} />
                                            </td>
                                            <td className="px-8 py-6">
                                                {task.status === 'pending' ? (
                                                    <Button
                                                        onClick={() => handlePickup(task.id)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-primary hover:bg-primary/10 text-[10px] font-black uppercase tracking-widest border border-primary/20 rounded-lg group"
                                                    >
                                                        Pickup Task <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-medium">{task.assignedToName || 'System Agent'}</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right font-mono text-slate-500 text-xs">
                                                {task.created_at}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ImportTasksModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onSuccess={() => { setIsImportModalOpen(false); fetchTasks(); }}
            />
        </div>
    );
};

const ImportTasksModal = ({ open, onOpenChange, onSuccess }) => {
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const [csvContent, setCsvContent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            getWorkflows(1, 100, 'prod').then(res => {
                if (res.status === 'success') setWorkflows(res.data);
            });
        }
    }, [open]);

    const handleImport = async () => {
        if (!selectedWorkflow || !csvContent) {
            toast({ title: "Error", description: "Select a workflow and paste CSV content.", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            // Very simple CSV parser (assuming comma separated)
            const lines = csvContent.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            const dataRows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((h, i) => obj[h] = values[i]);
                return { data: obj, external_ref: values[0] }; // Use first col as ref
            });

            const res = await createTasks(selectedWorkflow, dataRows);
            if (res.status === 'success') {
                toast({ title: "Import Successful", description: res.message });
                onSuccess();
            }
        } catch (e) {
            toast({ title: "Import Failed", description: e.message, variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-white/5 rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8"
            >
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Import Operational Tasks</h2>
                    <p className="text-slate-400 text-sm italic">Upload a CSV structure to populate the row-based queue.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Target Deployment Protocol</label>
                        <select
                            value={selectedWorkflow}
                            onChange={(e) => setSelectedWorkflow(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                        >
                            <option value="">Select a Production Protocol...</option>
                            {workflows.map(wf => (
                                <option key={wf.id} value={wf.id}>{wf.name} (v{wf.version})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">CSV Payload (Headers in first line)</label>
                        <textarea
                            value={csvContent}
                            onChange={(e) => setCsvContent(e.target.value)}
                            placeholder="id,email,task_name,data_payload&#10;REF_001,user@test.com,Verification,A1B2C3&#10;REF_002,agent@test.com,Onboarding,X9Y8Z7"
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-sm text-white min-h-[200px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-14 rounded-2xl text-slate-400 font-bold hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={isProcessing}
                            className="flex-[2] h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Initiate Bulk Queue"}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Executions;
