import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, User, Shield, CreditCard,
    Key, RefreshCw, Zap, Save, Check, Copy, ExternalLink,
    AlertCircle, Lock, HardDrive, Bell, Eye, EyeOff, Layout,
    Activity, ShieldCheck, ChevronRight, Sparkles, Globe, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { updateUserSettings } from '@/services/api';
import { cn } from '@/lib/utils';

const SettingsSection = ({ icon: Icon, title, children }) => (
    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl relative overflow-hidden group">
        <h3 className="text-xl font-bold text-white flex items-center gap-3 relative z-10 font-outfit">
            <Icon className="w-5 h-5 text-primary" /> {title}
        </h3>
        <div className="relative z-10">
            {children}
        </div>
    </div>
);

const Toggle = ({ active, onToggle, label, description }) => (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all">
        <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-200">{label}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">{description}</span>
        </div>
        <button
            onClick={() => onToggle(!active)}
            className={cn(
                "w-12 h-6 rounded-full transition-all relative p-1",
                active ? "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-slate-800"
            )}
        >
            <div className={cn(
                "w-4 h-4 bg-white rounded-full transition-all",
                active ? "translate-x-6" : "translate-x-0"
            )} />
        </button>
    </div>
);

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [apiKey, setApiKey] = useState(user?.api_key || 'ca_live_' + Math.random().toString(36).substr(2, 24));

    // Form States
    const [profile, setProfile] = useState({
        name: user?.name || '',
        email: user?.email || '',
        avatar_url: user?.avatar_url || ''
    });

    const [notifPrefs, setNotifPrefs] = useState({
        email_errors: true,
        email_usage: true,
        browser_alerts: false,
        webhook_triggers: true
    });

    const [builderPrefs, setBuilderPrefs] = useState({
        snap_to_grid: true,
        auto_save: true,
        dev_mode: false,
        dark_nodes: true
    });

    const handleSave = async (data) => {
        setIsSaving(true);
        try {
            const res = await updateUserSettings(data);
            if (res.status === 'success') {
                toast({ title: "Protocol Synchronized", description: "Global configuration updated successfully." });
            }
        } catch (err) {
            toast({ title: "Transmission Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRegenerateKey = () => {
        const newKey = 'ca_live_' + Math.random().toString(36).substr(2, 24);
        setApiKey(newKey);
        handleSave({ api_key: newKey });
        toast({ title: "New Protocol Secret", description: "Your API key has been cycled." });
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            System Control Center
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold font-outfit tracking-tight text-white mb-2">
                        Configuration <span className="text-gradient">Hub</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-xl">
                        Optimize your autonomous environment and refine agent security protocols.
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                {[
                    { id: 'profile', icon: User, label: 'Core Identity' },
                    { id: 'preferences', icon: Layout, label: 'Builder Prefs' },
                    { id: 'security', icon: Shield, label: 'Security' },
                    { id: 'monetization', icon: Zap, label: 'Plan & Usage' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === tab.id ? "bg-white text-zinc-950 shadow-lg" : "text-slate-500 hover:text-slate-200"
                        )}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <SettingsSection title="Identity Protocols" icon={User}>
                                    <div className="flex flex-col md:flex-row gap-8 items-center mb-8 pb-8 border-b border-white/5">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center font-black text-3xl text-slate-500 group-hover:border-primary/50 transition-all duration-500 overflow-hidden shadow-2xl">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                                ) : (
                                                    profile.name.charAt(0)
                                                )}
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-xl text-white shadow-lg hover:scale-110 active:scale-95 transition-all">
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-1 text-center md:text-left">
                                            <h4 className="text-xl font-bold text-white">{profile.name}</h4>
                                            <p className="text-slate-500 text-sm font-mono">{user?.role?.toUpperCase()} • Sector {user?.id}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Legal/Synthetic Name</label>
                                            <input
                                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Communication Channel</label>
                                            <input
                                                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-slate-500 focus:outline-none cursor-not-allowed"
                                                value={profile.email}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex justify-end">
                                        <Button
                                            onClick={() => handleSave(profile)}
                                            disabled={isSaving}
                                            className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-primary/20"
                                        >
                                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Sync Identity
                                        </Button>
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Notification Engine" icon={Bell}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Toggle
                                            label="Execution Failure Alerts"
                                            description="Email notifications on critical logic errors"
                                            active={notifPrefs.email_errors}
                                            onToggle={(v) => { setNotifPrefs({ ...notifPrefs, email_errors: v }); handleSave({ notification_prefs: { ...notifPrefs, email_errors: v } }); }}
                                        />
                                        <Toggle
                                            label="Usage Safeguards"
                                            description="Alerts when reaching 80% quota"
                                            active={notifPrefs.email_usage}
                                            onToggle={(v) => { setNotifPrefs({ ...notifPrefs, email_usage: v }); handleSave({ notification_prefs: { ...notifPrefs, email_usage: v } }); }}
                                        />
                                        <Toggle
                                            label="Webhook Triggers"
                                            description="Allow external event listeners"
                                            active={notifPrefs.webhook_triggers}
                                            onToggle={(v) => { setNotifPrefs({ ...notifPrefs, webhook_triggers: v }); handleSave({ notification_prefs: { ...notifPrefs, webhook_triggers: v } }); }}
                                        />
                                    </div>
                                </SettingsSection>
                            </motion.div>
                        )}

                        {activeTab === 'preferences' && (
                            <motion.div
                                key="preferences"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <SettingsSection title="Builder Configuration" icon={Layout}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Toggle
                                            label="Snap to Grid"
                                            description="Lock nodes to 20px matrix"
                                            active={builderPrefs.snap_to_grid}
                                            onToggle={(v) => { setBuilderPrefs({ ...builderPrefs, snap_to_grid: v }); handleSave({ builder_prefs: { ...builderPrefs, snap_to_grid: v } }); }}
                                        />
                                        <Toggle
                                            label="Continuous Auto-save"
                                            description="Persist changes in real-time"
                                            active={builderPrefs.auto_save}
                                            onToggle={(v) => { setBuilderPrefs({ ...builderPrefs, auto_save: v }); handleSave({ builder_prefs: { ...builderPrefs, auto_save: v } }); }}
                                        />
                                        <Toggle
                                            label="Autonomous Dev Mode"
                                            description="Show raw execution JSON in inspector"
                                            active={builderPrefs.dev_mode}
                                            onToggle={(v) => { setBuilderPrefs({ ...builderPrefs, dev_mode: v }); handleSave({ builder_prefs: { ...builderPrefs, dev_mode: v } }); }}
                                        />
                                        <Toggle
                                            label="High-Contrast Nodes"
                                            description="Darker workspace for focused logic"
                                            active={builderPrefs.dark_nodes}
                                            onToggle={(v) => { setBuilderPrefs({ ...builderPrefs, dark_nodes: v }); handleSave({ builder_prefs: { ...builderPrefs, dark_nodes: v } }); }}
                                        />
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Global Vault Access" icon={Key}>
                                    <div className="space-y-4">
                                        <p className="text-slate-500 text-sm">
                                            Your primary protocol key for external reasoning.
                                        </p>
                                        <div className="relative group/input">
                                            <input
                                                type="password"
                                                className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-5 pr-24 py-5 text-xs font-mono font-bold text-indigo-400 focus:outline-none"
                                                value={apiKey}
                                                readOnly
                                            />
                                            <div className="absolute top-1/2 -translate-y-1/2 right-3 flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 text-slate-500 hover:text-white" onClick={() => { navigator.clipboard.writeText(apiKey); toast({ title: "Secrets Copied" }) }}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-white/10 text-slate-500 hover:text-white" onClick={handleRegenerateKey}>
                                                    <RefreshCw className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </SettingsSection>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <SettingsSection title="Hardened Access" icon={Shield}>
                                    <div className="space-y-4">
                                        <Button variant="outline" className="w-full justify-between items-center h-16 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Lock className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-bold">Rotation Protocol</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Reset Master Password</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-700" />
                                        </Button>

                                        <Button variant="outline" className="w-full justify-between items-center h-16 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 text-white px-6 opacity-50 cursor-not-allowed">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="font-bold">Multi-Factor Intel</span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Encrypted Mobile Auth</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-slate-500">Coming Soon</span>
                                        </Button>
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Active Nodes" icon={HardDrive}>
                                    <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <Globe className="w-4 h-4 text-primary" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">Current Session: {window.navigator.platform}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono italic">IP: Hidden in Protocol</span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase border border-emerald-500/20">Active Now</span>
                                        </div>
                                    </div>
                                </SettingsSection>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Subscription Sidebar */}
                <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-primary relative overflow-hidden group shadow-2xl shadow-primary/20">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <span className="px-3 py-1 rounded-full bg-white text-primary text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    {user?.role?.toUpperCase() || 'MEMBER'}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-white leading-tight mb-2 tracking-tighter">Elite Reasoning</h3>
                                <p className="text-white/70 text-sm font-medium leading-relaxed">
                                    Unlimited agent chains, parallel cluster execution, and priority bandwidth.
                                </p>
                            </div>

                            <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Resource Meter</span>
                                    <span className="text-xs font-bold text-white">84% Capacity</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-[84%] rounded-full shadow-[0_0_15px_white]" />
                                </div>
                            </div>

                            <Button className="w-full bg-white text-primary hover:bg-white/90 rounded-2xl h-14 font-black flex items-center gap-2 shadow-2xl active:scale-95 transition-all">
                                Protocol Upgrade <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Activity Ledger */}
                    <div className="glass-effect p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-400" /> Interaction Log
                        </h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-1 h-8 rounded-full bg-white/10" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">M{i * 3} Update</span>
                                        <span className="text-xs text-slate-300 font-medium">Security protocol refreshed</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
