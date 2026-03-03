import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Settings as SettingsIcon, User, Shield, CreditCard,
    Key, RefreshCw, Zap, Save, Check, Copy, ExternalLink,
    AlertCircle, Lock, HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Settings = () => {
    const { user } = useAuth();
    const [apiKey, setApiKey] = useState('ca_live_' + Math.random().toString(36).substr(2, 24));
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleRegenerateKey = () => {
        setIsRegenerating(true);
        setTimeout(() => {
            setApiKey('ca_live_' + Math.random().toString(36).substr(2, 24));
            setIsRegenerating(false);
            toast({ title: "New Protocol Secret", description: "Your API key has been cycled successfully." });
        }, 1200);
    };

    const copyKey = () => {
        navigator.clipboard.writeText(apiKey);
        toast({ title: "Copied", description: "API Key saved to system clipboard." });
    };

    const handleSaveProfile = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast({ title: "Profile Synchronized", description: "Your global settings have been updated." });
        }, 800);
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            Protocol: Settings
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        System <span className="text-gradient">Configuration</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Fine-tune your personal reasoning environment and manage security protocols.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                            <User className="w-5 h-5 text-primary" /> Core Identity
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                <input
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                    defaultValue={user?.name}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Protocol</label>
                                <input
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-slate-400 focus:outline-none cursor-not-allowed"
                                    value={user?.email}
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl h-12 px-8 transition-all active:scale-95 flex items-center gap-2"
                            >
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Identity
                            </Button>
                        </div>
                    </div>

                    {/* Developer Info */}
                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Key className="w-5 h-5 text-amber-400" /> API Access
                            </h3>
                            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                Live Interface
                            </span>
                        </div>

                        <div className="space-y-4">
                            <p className="text-slate-500 text-sm">
                                Use this key to trigger your Reasoning Engines via the external API. Keep it secure as it provides full execution access.
                            </p>
                            <div className="relative group">
                                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 text-slate-400 hover:text-white" onClick={copyKey}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 text-slate-400 hover:text-white" onClick={handleRegenerateKey}>
                                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                                <input
                                    type="password"
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-5 pr-24 py-5 text-xs font-mono font-bold text-indigo-400 focus:outline-none"
                                    value={apiKey}
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-amber-500/80 text-xs font-medium">
                                RE-GENERATING will immediately invalidate any external systems using the current key. Proceed with absolute certainty.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Subscription Sidebar */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-primary relative overflow-hidden group shadow-2xl shadow-primary/20">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                    <Zap className="w-7 h-7 text-white" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-white text-primary text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {user?.role?.toUpperCase() || 'MEMBER'}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white leading-tight mb-2 tracking-tight">Elite Tier</h3>
                                <p className="text-white/70 text-sm font-medium leading-relaxed">
                                    Unlimited Reasoning Chains, Parallel Node Execution, and Enterprise API Priority.
                                </p>
                            </div>

                            <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Usage Meter</span>
                                    <span className="text-xs font-bold text-white">84% / 10K</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-[84%] rounded-full shadow-[0_0_10px_white]" />
                                </div>
                            </div>

                            <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black text-base shadow-2xl active:scale-95 transition-all">
                                Protocol Upgrade
                            </Button>
                        </div>
                    </div>

                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-white flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-400" /> Security
                        </h3>
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-between items-center h-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm px-5">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    <span>Reset Password</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-700" />
                            </Button>
                            <Button variant="outline" className="w-full justify-between items-center h-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white text-sm px-5">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                                    <span>2FA Setup</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-700" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
