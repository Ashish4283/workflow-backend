import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow, Users, Activity, Plus, ArrowRight, Zap, Target, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import StatCard from './StatCard';
import { getWorkflows } from '@/services/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWorkflows = async () => {
            try {
                const response = await getWorkflows();
                setWorkflows(response.data || []);
            } catch (error) {
                console.error("Dashboard workflow fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWorkflows();
    }, []);

    const handleComingSoon = () => {
        toast({ title: "Feature Coming Soon", description: "The backend agent is currently working on this feature!" });
    };

    return (
        <div className="space-y-10 pb-10">
            {/* Hero Hub Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            System Status: Operational
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        Control <span className="text-gradient">Center</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Monitor your Reasoning Engines, manage your team, and track automation performance in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => navigate('/builder')} size="lg" className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95 group">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span className="font-bold">New Workflow</span>
                    </Button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Automations"
                    value={workflows.length.toString()}
                    trend={12}
                    trendLabel="active"
                    icon={Workflow}
                    colorClass={{ bg: 'bg-primary', text: 'text-primary' }}
                />
                <StatCard
                    title="Successful Runs"
                    value="1,240"
                    trend={5.4}
                    icon={Zap}
                    colorClass={{ bg: 'bg-emerald-500/10', text: 'text-emerald-500' }}
                />
                <StatCard
                    title="Average Precision"
                    value="99.2%"
                    icon={Target}
                    colorClass={{ bg: 'bg-indigo-500/10', text: 'text-indigo-500' }}
                />
                <StatCard
                    title="Execution Time"
                    value="1.2s"
                    icon={Clock}
                    colorClass={{ bg: 'bg-amber-500/10', text: 'text-amber-500' }}
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold font-outfit text-white flex items-center gap-2">
                            Recent Workflows
                        </h2>
                        <Button variant="ghost" onClick={handleComingSoon} className="text-slate-400 hover:text-primary transition-colors gap-2">
                            All Assets <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="glass-effect rounded-[2.5rem] border border-white/5 overflow-hidden">
                        {isLoading ? (
                            <div className="p-10 text-center text-slate-500 animate-pulse">Loading Asset Architecture...</div>
                        ) : workflows.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                                        <th className="px-8 py-5">Workflow Name</th>
                                        <th className="px-8 py-5">Status</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {workflows.map((wf) => (
                                        <tr key={wf.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all group cursor-pointer" onClick={() => navigate('/builder')}>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-100 group-hover:text-primary transition-colors text-base">{wf.name || 'Untitled Workflow'}</span>
                                                    <span className="text-xs text-slate-500 mt-0.5">ID: {wf.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                                                    Active
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                                    <Workflow className="w-8 h-8 text-slate-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">No workflows yet</h3>
                                    <p className="text-slate-500">Create your first Reasoning Engine to get started.</p>
                                </div>
                                <Button onClick={() => navigate('/builder')} className="bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 rounded-xl">
                                    Initiate Process
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar/Widgets Area */}
                <div className="space-y-8">
                    {/* Activity Widget */}
                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            System Logs
                        </h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4 group cursor-help">
                                    <div className="w-1 h-10 bg-primary/20 rounded-full group-hover:bg-primary transition-colors" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">10:4{i} AM</span>
                                        <span className="text-sm font-medium text-slate-300">Process node #4{i} executed</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Upgrade/Tip */}
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-primary relative overflow-hidden group shadow-2xl shadow-primary/20">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                        <div className="relative z-10 space-y-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white leading-tight">Master your <br /> Automations</h3>
                            <p className="text-white/80 text-sm">Unlock higher precision with the Elite Reasoning Pack.</p>
                            <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
                                Explore Elite
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
