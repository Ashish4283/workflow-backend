import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'react-router-dom';
import {
    Layout, Search, Filter, Zap,
    ArrowRight, Clock, Plus, Filter as FilterIcon,
    ChevronDown, Activity, Sparkles, Heart, Users, Globe,
    ArrowUpRight, MessageCircle, Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPublicWorkflows, toggleHeart } from '@/services/api';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const MarketplaceCard = ({ workflow, onToggleHeart, onClone }) => {
    const [isHeartAnimating, setIsHeartAnimating] = useState(false);

    const handleHeartClick = (e) => {
        e.stopPropagation();
        setIsHeartAnimating(true);
        onToggleHeart(workflow.id);
        setTimeout(() => setIsHeartAnimating(false), 500);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-effect p-8 rounded-[2.5rem] border border-white/5 group relative overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
        >
            {/* Creator Badge */}
            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-white/10 backdrop-blur-md">
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    <Users className="w-2.5 h-2.5 text-primary" />
                </div>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{workflow.creator_name || 'Anonymous'}</span>
            </div>

            <div className="relative z-10 space-y-6 flex-1">
                <div className="p-4 w-fit bg-slate-900 rounded-2xl border border-white/10 group-hover:border-primary/30 transition-colors">
                    <Zap className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-2 font-outfit leading-tight group-hover:text-primary transition-colors line-clamp-1">
                        {workflow.name}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                        {workflow.description || `Scale your multi-agent architecture with the ${workflow.name} community protocol.`}
                    </p>
                </div>

                {/* Social Stats */}
                <div className="flex items-center gap-4 pt-4">
                    <button 
                        onClick={handleHeartClick}
                        className={cn(
                            "flex items-center gap-1.5 transition-all active:scale-90",
                            workflow.is_liked ? "text-rose-500" : "text-slate-500 hover:text-rose-400"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", workflow.is_liked && "fill-current", isHeartAnimating && "animate-ping")} />
                        <span className="text-xs font-black">{workflow.hearts || 0}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Share2 className="w-4 h-4" />
                        <span className="text-xs font-black">Shared</span>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-600">Protocol ID</span>
                    <span className="text-[10px] font-mono text-slate-500">#{workflow.id?.toString().padStart(4, '0')}</span>
                </div>
                <Button 
                    onClick={() => onClone(workflow)}
                    size="sm" 
                    className="rounded-xl bg-white/5 hover:bg-primary hover:text-white border-white/5 text-slate-400 font-bold px-6 h-10 transition-all"
                >
                    Deploy <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </motion.div>
    );
};

const TemplatesPage = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Protocols');

    const fetchPublic = async () => {
        setLoading(true);
        try {
            const res = await getPublicWorkflows();
            if (res.status === 'success') {
                setWorkflows(res.data);
            }
        } catch (error) {
            toast({ title: "Sync Error", description: "Failed to establish community connection.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPublic();
    }, []);

    const handleToggleHeart = async (id) => {
        try {
            const res = await toggleHeart(id);
            if (res.status === 'success') {
                setWorkflows(prev => prev.map(w => 
                    w.id === id ? { ...w, hearts: res.hearts, is_liked: res.is_liked } : w
                ));
            }
        } catch (error) {
            toast({ title: "Action Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleClone = (workflow) => {
        // Mark as clone for the builder
        const cloneData = {
            ...workflow,
            _is_public_clone: true,
            name: `${workflow.name} (Clone)`
        };
        sessionStorage.setItem('selected_template', JSON.stringify(cloneData));
        navigate('/builder');
        toast({ title: "Protocol Synced", description: "Workflow blueprint loaded into your creative workspace." });
    };

    const filteredWorkflows = workflows.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCategory === 'All Protocols' || w.category === selectedCategory;
        return matchesSearch && matchesCat;
    });

    const scrollToGallery = () => {
        const gallery = document.getElementById('blueprint-gallery');
        if (gallery) gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-12 pb-20 custom-scrollbar">
            {/* Hero Hub */}
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-primary p-12 md:p-20 shadow-2xl border border-white/5">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                
                <div className="relative z-10 max-w-3xl space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/20 backdrop-blur-xl rounded-2xl border border-primary/30">
                            <Globe className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-primary text-sm font-black uppercase tracking-[0.3em]">The Open Network</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.9] drop-shadow-2xl">
                        Community <br /> <span className="text-gradient">Marketplace</span>
                    </h1>

                    <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-xl border-l-2 border-white/20 pl-6">
                        Explore, rate, and deploy the most efficient multi-agent reasoning protocols contributed by creators across the network.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Button onClick={scrollToGallery} className="bg-primary text-white hover:bg-primary/90 rounded-2xl h-14 px-10 font-black text-base shadow-2xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-3">
                            <Zap className="w-5 h-5" /> Browse Repository
                        </Button>
                        <Button onClick={() => navigate('/builder')} variant="ghost" className="text-white h-14 px-8 rounded-2xl font-bold hover:bg-white/10 border border-white/10 backdrop-blur-md">
                            Contribute Logic
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categorization & Gallery */}
            <div id="blueprint-gallery" className="space-y-8 scroll-mt-10">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 shadow-xl scroll-auto overflow-x-auto no-scrollbar max-w-full">
                        {['All Protocols', 'Marketing', 'Automation', 'DevOps', 'Sales', 'Creative'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    selectedCategory === cat ? "bg-white text-zinc-950 shadow-lg shadow-white/10" : "text-slate-500 hover:text-white"
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
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium text-white shadow-xl"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-80 rounded-[2.5rem] bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredWorkflows.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWorkflows.map((wf) => (
                            <MarketplaceCard 
                                key={wf.id} 
                                workflow={wf} 
                                onToggleHeart={handleToggleHeart}
                                onClone={handleClone}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-6 bg-slate-900 rounded-full border border-white/5">
                            <Sparkles className="w-12 h-12 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">No logical nodes found</h3>
                        <p className="text-slate-600 max-w-xs">The repository is waiting for your first public protocol contribution.</p>
                        <Button variant="link" className="text-primary font-bold" onClick={() => navigate('/builder')}>Open Builder &rarr;</Button>
                    </div>
                )}
            </div>

            {/* Scale Call to Action */}
            <div className="glass-effect p-12 rounded-[3.5rem] border border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center shadow-2xl">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black text-white tracking-tighter leading-none">Become a Contributor?</h2>
                    <p className="text-slate-400 leading-relaxed">
                        Top-rated creators in the Community Marketplace gain exclusive access to early-alpha reasoning nodes and increased token balances.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rewards Program</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-secondary" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Verified Logic Badge</span>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => navigate('/builder')} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[2rem] h-20 px-12 group transition-all">
                        <div className="flex flex-col items-start text-left">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ready to share?</span>
                            <span className="text-xl font-bold flex items-center gap-2">Publish Protocol <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TemplatesPage;
