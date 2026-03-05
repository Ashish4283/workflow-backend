import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow, Users, Activity, Plus, ArrowRight, Zap, Target, Clock, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import StatCard from './StatCard';
import TemplateGallery from './TemplateGallery';
import { getUserDashboardStats } from '@/services/api';
import DelegationModal from './DelegationModal';

export default function Dashboard() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [stats, setStats] = useState({ total_workflows: 0, total_app_users: 0 });
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isDelegationOpen, setIsDelegationOpen] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const response = await getUserDashboardStats();
            if (response.status === 'success') {
                setWorkflows(response.data.recent_workflows || []);
                setStats(response.data.stats || {});
                setUserData(response.data.user || {});
            }
        } catch (error) {
            console.error("Dashboard workflow fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleDelegate = (e, wf) => {
        e.stopPropagation();
        setSelectedWorkflow(wf);
        setIsDelegationOpen(true);
    };

    const handleComingSoon = () => {
        toast({ title: "Intelligence Asset", description: "This metric is being optimized by your reasoning agents." });
    };

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-10 pb-10 custom-scrollbar">
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
                    title="Active Automations"
                    value={stats.total_workflows?.toString() || "0"}
                    trend={12}
                    trendLabel="System Active"
                    icon={Workflow}
                    colorClass={{ bg: 'bg-primary', text: 'text-primary' }}
                />
                <StatCard
                    title="Usage Balance"
                    value={userData?.usage_balance?.toString() || "0"}
                    trendLabel={`Tier: ${userData?.subscription_tier?.toUpperCase() || 'FREE'}`}
                    icon={Zap}
                    colorClass={{ bg: 'bg-emerald-500/10', text: 'text-emerald-500' }}
                />
                <StatCard
                    title="App Interactions"
                    value={stats.total_app_users?.toString() || "0"}
                    icon={Users}
                    colorClass={{ bg: 'bg-secondary/10', text: 'text-secondary' }}
                />
                <StatCard
                    title="System Health"
                    value="99.9%"
                    icon={Activity}
                    colorClass={{ bg: 'bg-amber-500/10', text: 'text-amber-500' }}
                />
            </div>

            {/* Template Gallery Section */}
            <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <h2 className="text-2xl font-bold font-outfit text-white flex items-center gap-3">
                        <Zap className="w-6 h-6 text-primary" /> Reasoning Blueprints
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scale Instantly</span>
                </div>
                <TemplateGallery />
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
                                <tbody>
                                    {workflows.map((wf) => (
                                        <tr key={wf.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all group cursor-pointer">
                                            <td className="px-8 py-6" onClick={() => navigate(`/builder?id=${wf.id}`)}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-100 group-hover:text-primary transition-colors text-base">{wf.name || 'Untitled Workflow'}</span>
                                                    <span className="text-xs text-slate-500 mt-0.5">ID: {wf.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 w-fit">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                                                        Active
                                                    </span>
                                                    {wf.assigned_name && (
                                                        <span className="text-[9px] text-primary font-black uppercase tracking-widest ml-1 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 flex items-center gap-1.5">
                                                            <div className="w-1 h-1 rounded-full bg-primary" />
                                                            Agent: {wf.assigned_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(userData?.role === 'admin' || userData?.role === 'manager') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => handleDelegate(e, wf)}
                                                            className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg pr-4"
                                                        >
                                                            <UserPlus className="w-3 h-3 mr-2" /> Delegate
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all" onClick={() => navigate(`/builder?id=${wf.id}`)}>
                                                        <ArrowRight className="w-5 h-5" />
                                                    </Button>
                                                </div>
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
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-secondary to-primary relative overflow-hidden group shadow-2xl shadow-primary/20">
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
            <DelegationModal
                isOpen={isDelegationOpen}
                onClose={() => setIsDelegationOpen(false)}
                workflow={selectedWorkflow}
                onSuccess={fetchDashboardData}
            />
        </div>
    );
}
