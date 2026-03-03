import React from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, BarChart3, TrendingUp, Users,
    ArrowUpRight, ArrowDownRight, Activity, Zap,
    Target, Clock, Globe, Calendar, Filter, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const AnalyticCard = ({ title, value, change, trend, icon: Icon, color }) => (
    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-4 shadow-2xl relative overflow-hidden group">
        <div className={cn("absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10 transition-transform duration-700 group-hover:scale-150", color)} />

        <div className="flex justify-between items-start relative z-10">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border",
                color === 'bg-primary' ? "bg-primary/10 text-primary border-primary/20" :
                    color === 'bg-emerald-500' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-secondary/10 text-secondary border-secondary/20"
            )}>
                <Icon className="w-7 h-7" />
            </div>
            <div className={cn("flex items-center gap-1 text-xs font-black", trend === 'up' ? "text-emerald-400" : "text-rose-400")}>
                {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {change}
            </div>
        </div>

        <div className="relative z-10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</span>
            <div className="text-4xl font-black text-white mt-1 tracking-tighter">{value}</div>
        </div>
    </div>
);

const Insights = () => {
    const handleComingSoon = () => {
        toast({ title: "Analysis Protocol", description: "This module is being optimized for your sector." });
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            Protocol: Advanced Analytics
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        Intelligence <span className="text-gradient">Insights</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Deep-dive metrics into your agent performance, cost efficiency, and automation scale.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleComingSoon} variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold h-12 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Last 30 Days
                    </Button>
                    <Button onClick={handleComingSoon} variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white font-bold h-12 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnalyticCard
                    title="Executed Tokens"
                    value="42.8M"
                    change="+12.5%"
                    trend="up"
                    icon={Zap}
                    color="bg-primary"
                />
                <AnalyticCard
                    title="System Uptime"
                    value="99.99%"
                    change="+0.01%"
                    trend="up"
                    icon={Activity}
                    color="bg-emerald-500"
                />
                <AnalyticCard
                    title="Interaction Growth"
                    value="12,402"
                    change="-2.4%"
                    trend="down"
                    icon={TrendingUp}
                    color="bg-indigo-500"
                />
            </div>

            {/* Main Graphs Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-effect p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <BarChart3 className="w-6 h-6 text-primary" /> Reasoning Volume
                        </h3>
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <div className="w-3 h-3 rounded-full bg-secondary" />
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-4 pt-10">
                        {[40, 70, 45, 90, 65, 80, 50, 95, 100, 75, 60, 85].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-primary text-[10px] font-black p-1 px-2 rounded-lg text-white">
                                    {(h * 1.5).toFixed(0)}k tasks
                                </div>
                                <div
                                    className="w-full bg-gradient-to-t from-primary/20 via-primary/60 to-primary rounded-xl transition-all duration-700 hover:scale-x-110 shadow-lg shadow-primary/10"
                                    style={{ height: `${h}%` }}
                                />
                                <span className="text-[10px] font-black text-slate-600 group-hover:text-slate-400">M{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-effect p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <PieChart className="w-6 h-6 text-emerald-400" /> Resource Allocation
                        </h3>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative">
                        {/* CSS Donut Chart */}
                        <div className="w-64 h-64 rounded-full border-[20px] border-white/5 relative flex items-center justify-center group pointer-events-none">
                            <div className="absolute inset-0 border-[20px] border-primary border-b-transparent border-l-transparent rounded-full rotate-45 transform transition-transform group-hover:rotate-90 duration-1000 shadow-[0_0_30px_rgba(24,96,255,0.2)]" />
                            <div className="absolute inset-0 border-[20px] border-emerald-500 border-t-transparent border-r-transparent rounded-full -rotate-12 transition-transform group-hover:rotate-12 duration-1000" />

                            <div className="text-center">
                                <div className="text-3xl font-black text-white">74%</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">Efficiency</div>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="space-y-4 ml-12">
                            {[
                                { label: 'Automations', val: '45%', color: 'bg-primary' },
                                { label: 'Manual Ops', val: '30%', color: 'bg-emerald-500' },
                                { label: 'API Calls', val: '15%', color: 'bg-secondary' },
                                { label: 'Shadow Mode', val: '10%', color: 'bg-white/10' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={cn("w-3 h-3 rounded-full shadow-lg", item.color)} />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-200">{item.label}</span>
                                        <span className="text-[10px] font-black text-slate-500 tracking-widest">{item.val}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Ledger */}
            <div className="glass-effect p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <Target className="w-6 h-6 text-amber-500" /> High-Intensity Assets
                    </h3>
                    <Button onClick={handleComingSoon} variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-500">View Full Ledger</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { label: 'Latency Map', value: 'Global', sub: 'optimized' },
                        { label: 'Compute Unit', value: 'Tier 3', sub: 'priority' },
                        { label: 'Parallel Chains', value: 'x12', sub: 'concurrent' },
                        { label: 'Asset Value', value: '$12,400', sub: 'estimated' },
                    ].map((m, i) => (
                        <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2 group hover:bg-white/10 transition-all">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{m.label}</span>
                            <div className="text-2xl font-black text-white group-hover:text-primary transition-colors">{m.value}</div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{m.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Insights;
