import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Key, Plus, Shield, Globe, Mail, MessageSquare,
    MoreVertical, Trash2, Edit2, Lock, ExternalLink,
    AlertCircle, Search, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { listCredentials, saveCredential, listClusters } from '@/services/api';

const CredentialCard = ({ type, name, status, icon: Icon, color }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="glass-effect p-6 rounded-[2rem] border border-white/5 space-y-4 group hover:border-primary/30 transition-all duration-500 shadow-xl">
            <div className="flex justify-between items-start">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", color)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    )}>
                        {status}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div>
                <h4 className="text-white font-bold group-hover:text-primary transition-colors">{name}</h4>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{type}</p>
            </div>

            <div className="relative group/key pt-2">
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/key:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                        onClick={() => setIsVisible(!isVisible)}
                    >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                </div>
                <div className="bg-slate-950 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-mono text-indigo-400 overflow-hidden">
                    {isVisible ? 'sk-proj-7a8b9c...xY2z1' : '••••••••••••••••••••••••'}
                </div>
            </div>
        </div>
    );
};

const Credentials = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [creds, setCreds] = useState([]);
    const [clusters, setClusters] = useState([]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newCred, setNewCred] = useState({ name: '', type: 'api_key', value: '', cluster_id: '' });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [credRes, clusterRes] = await Promise.all([
                listCredentials(),
                listClusters()
            ]);
            if (credRes.status === 'success') setCreds(credRes.data);
            if (clusterRes.status === 'success') setClusters(clusterRes.data);
        } catch (error) {
            console.error("Vault access error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdd = () => {
        setIsAddModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await saveCredential(newCred.name, newCred.type, newCred.value, newCred.cluster_id);
            if (res.status === 'success') {
                toast({ title: "Vault Synced", description: "Credential has been safely stored in the master ledger." });
                setIsAddModalOpen(false);
                setNewCred({ name: '', type: 'api_key', value: '', cluster_id: '' });
                fetchData();
            }
        } catch (error) {
            toast({ title: "Vault Error", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 space-y-10 pb-20 custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            Protocol: Vault Access
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        System <span className="text-gradient">Credentials</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Manage the secret tokens and keys that empower your agents to interact with the world.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 transition-all active:scale-95 group">
                        <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                        Add Credential
                    </Button>
                </div>
            </div>

            {/* Info Box */}
            <div className="p-8 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/10 flex flex-col md:flex-row gap-8 items-center">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-500 shadow-2xl shadow-indigo-500/40 flex items-center justify-center shrink-0">
                    <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Encrypted Secure Storage</h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                        All credentials are encrypted using industry-standard AES-256 protocols before storage.
                        Your agents access these during execution without ever exposing the raw secret to client interfaces.
                    </p>
                </div>
                <div className="md:ml-auto">
                    <Button onClick={() => navigate('/audit')} variant="ghost" className="text-indigo-400 font-bold gap-2">
                        View Audit Log <ExternalLink className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Grid & Filter */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center group">
                    <div className="relative flex-1 w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Find specific protocol key..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-medium text-white shadow-xl"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creds.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((cred, idx) => (
                        <CredentialCard key={idx} {...cred} />
                    ))}

                    {/* Add Placeholder */}
                    <button
                        onClick={handleAdd}
                        className="group flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/5 rounded-[2rem] hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 py-12 space-y-4"
                    >
                        <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                            <Plus className="w-8 h-8 text-slate-600 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[10px] group-hover:text-primary transition-colors">Ingest New Secret</span>
                    </button>
                </div>
            </div>

            {/* Add Credential Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-effect p-8 rounded-[3rem] border border-white/10 w-full max-w-md shadow-2xl relative"
                    >
                        <Button variant="ghost" size="icon" className="absolute top-6 right-6 text-slate-400" onClick={() => setIsAddModalOpen(false)}>
                            <X className="w-5 h-5" />
                        </Button>
                        <h2 className="text-2xl font-bold text-white mb-6">Ingest New Secret</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Entity Name</label>
                                <input
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="e.g. Production OpenAI Key"
                                    value={newCred.name}
                                    onChange={e => setNewCred({ ...newCred, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Protocol Type</label>
                                <select
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={newCred.type}
                                    onChange={e => setNewCred({ ...newCred, type: e.target.value })}
                                >
                                    <option value="api_key">API Key (Standard)</option>
                                    <option value="oauth">OAuth Token</option>
                                    <option value="db_string">Database Connection</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Secret Value</label>
                                <input
                                    type="password"
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="sk-..."
                                    value={newCred.value}
                                    onChange={e => setNewCred({ ...newCred, value: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Assign to Cluster</label>
                                <select
                                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={newCred.cluster_id}
                                    onChange={e => setNewCred({ ...newCred, cluster_id: e.target.value })}
                                >
                                    <option value="">Global (All Clusters)</option>
                                    {clusters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <Button type="submit" className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-95">
                                Lock into Vault
                            </Button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Credentials;
