import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Layout, Search, Filter, Zap,
    ArrowRight, Clock, Plus, Filter as FilterIcon,
    ChevronDown, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import TemplateGallery from '@/components/dashboard/TemplateGallery';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const TemplatesPage = () => {
    const scrollToGallery = () => {
        const gallery = document.getElementById('blueprint-gallery');
        if (gallery) {
            gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleComingSoon = () => {
        toast({ title: "Documentation Protocol", description: "This knowledge vault is being synchronized with the latest engine updates." });
    };

    const handleExpertConnect = () => {
        window.location.href = "mailto:experts@creative4ai.com?subject=Custom%20Reasoning%20Protocol%20Request";
    };

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-12 pb-20 custom-scrollbar">
            {/* Hero Hub */}
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-primary via-indigo-600 to-secondary p-12 md:p-20 shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/20 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

                <div className="relative z-10 max-w-3xl space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white text-sm font-black uppercase tracking-[0.3em]">Protocol: Scale</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-2xl">
                        Reasoning <br /> <span className="text-white/80">Blueprints</span>
                    </h1>

                    <p className="text-white/70 text-lg md:text-xl font-medium leading-relaxed max-w-xl italic border-l-2 border-white/20 pl-6">
                        "Don't build from scratch. Scale your multi-agent architecture instantly using pre-configured, production-ready logical blueprints."
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Button onClick={scrollToGallery} className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-10 font-black text-base shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                            <Zap className="w-5 h-5" /> Start Cloning
                        </Button>
                        <Button onClick={handleComingSoon} variant="ghost" className="text-white h-14 px-8 rounded-2xl font-bold hover:bg-white/10 border border-white/10 backdrop-blur-md">
                            Browse Docs
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categorization & Gallery */}
            <div id="blueprint-gallery" className="space-y-8 scroll-mt-10">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 shadow-xl scroll-auto overflow-x-auto no-scrollbar max-w-full">
                        {['All Engines', 'AI Agents', 'Data Pipes', 'DevOps', 'Marketing', 'Automation'].map((cat, i) => (
                            <button
                                key={cat}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    i === 0 ? "bg-white text-zinc-950 shadow-lg shadow-white/10" : "text-slate-500 hover:text-white"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative min-w-[300px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find specific reasoning logic..."
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium text-white shadow-xl"
                        />
                    </div>
                </div>

                {/* Integration of Existing Gallery */}
                <TemplateGallery />
            </div>

            {/* Scale Call to Action */}
            <div className="glass-effect p-12 rounded-[3.5rem] border border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center shadow-2xl">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none">Can't find what you need?</h2>
                    <p className="text-slate-400 leading-relaxed">
                        Our engineering team can build custom reasoning nodes and workflow architectures for your specific enterprise protocols.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Custom Node Dev</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Architectural Audit</span>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleExpertConnect} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[2rem] h-20 px-12 group transition-all">
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connect with</span>
                            <span className="text-xl font-bold flex items-center gap-2">Reasoning Experts <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TemplatesPage;
