import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Building, ChevronRight, Activity, Search } from 'lucide-react';
import {
    getUserDashboardStats,
    generateInvite,
    listOrganizations,
    requestToJoinOrg
} from '../../services/api';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { cn } from '../../lib/utils';

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteLink, setInviteLink] = useState(null);
    const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
    const [organizations, setOrganizations] = useState([]);
    const [isRequestingOrg, setIsRequestingOrg] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(null);
    const [joinMessage, setJoinMessage] = useState("");
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getUserDashboardStats();
                if (res.status === 'success') {
                    setData(res.data);
                }

                // If user has no organization, fetch list of available orgs
                if (!user?.org_id) {
                    const orgsRes = await listOrganizations();
                    if (orgsRes.status === 'success') {
                        setOrganizations(orgsRes.data);
                    }
                }
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [user?.org_id]);

    const handleRequestJoin = async () => {
        if (!selectedOrgId) return;
        setIsSubmittingRequest(true);
        try {
            const res = await requestToJoinOrg(selectedOrgId, joinMessage);
            if (res.status === 'success') {
                toast({ title: "Request Sent", description: res.message });
                setIsRequestingOrg(false);
                setJoinMessage("");
                setSelectedOrgId(null);
            } else {
                toast({ title: "Request Error", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Connection Error", description: "Could not reach the server.", variant: "destructive" });
        } finally {
            setIsSubmittingRequest(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const trialEnds = data?.user?.trial_ends_at;
    const isTrialing = !data?.user?.manager_id && data?.user?.role === 'user';
    const daysLeft = trialEnds ? Math.ceil((new Date(trialEnds) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
    const wfLimitReached = isTrialing && (data?.stats?.total_workflows >= 1);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white border-none">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-outfit selection:bg-indigo-500/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-lg">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="font-semibold text-xl tracking-tight">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {isTrialing && (
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${daysLeft > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                {daysLeft > 0 ? `${daysLeft} Days Left` : 'Trial Expired'}
                            </div>
                        )}
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/admin')}
                                className="px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm font-medium hover:bg-zinc-800 transition-all flex items-center gap-2"
                            >
                                <Shield className="w-4 h-4 text-indigo-400" />
                                Admin Portal
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: wfLimitReached ? 1 : 1.05 }}
                            whileTap={{ scale: wfLimitReached ? 1 : 0.95 }}
                            onClick={() => !wfLimitReached && navigate('/builder')}
                            disabled={wfLimitReached}
                            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium border ${wfLimitReached
                                ? 'bg-zinc-800 text-zinc-500 border-white/5 cursor-not-allowed'
                                : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600 hover:text-white'
                                }`}
                        >
                            {wfLimitReached ? 'Limit Reached' : '+ New Workflow'}
                        </motion.button>
                        <button onClick={handleLogout} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Welcome back, {data?.user?.name || user?.name}</h1>
                        <p className="text-zinc-400">
                            {isTrialing
                                ? "You are currently on a 14-day free trial."
                                : data?.user?.manager_id
                                    ? "Account managed by your organization."
                                    : "Individual PRO account."
                            }
                        </p>
                    </div>
                    {isTrialing && (
                        <div className="flex items-center gap-3">
                            <AnimatePresence mode="wait">
                                {!inviteLink ? (
                                    <motion.button
                                        key="gen-btn"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={handleGenerateInvite}
                                        disabled={isGeneratingInvite}
                                        className="px-6 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors"
                                    >
                                        {isGeneratingInvite ? 'Generating...' : '🔗 Share with Manager'}
                                    </motion.button>
                                ) : (
                                    <motion.div
                                        key="invite-url"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2 pl-4"
                                    >
                                        <span className="text-xs font-mono text-indigo-400 max-w-[150px] truncate">{inviteLink}</span>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(inviteLink); alert('Link copied!'); }}
                                            className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                        >
                                            Copy Link
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Organization Enrollment Prompt (for Detached Entities) */}
                {!user?.org_id && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-12 glass-effect p-8 rounded-[2.5rem] border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <Building className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/30">
                                        DETACHED ASSET
                                    </span>
                                </div>
                                <h2 className="text-3xl font-extrabold font-outfit tracking-tight mb-2">Join an Organization</h2>
                                <p className="text-slate-400 text-lg">
                                    You are currently operating as an individual entity. Link your profile to an organization to access clusters, shared workflows, and enterprise-grade resources.
                                </p>
                            </div>
                            <Button
                                onClick={() => setIsRequestingOrg(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all gap-2 text-lg shrink-0"
                            >
                                <Building className="w-5 h-5" /> Browse Organizations <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Join Org Modal */}
                <AnimatePresence>
                    {isRequestingOrg && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsRequestingOrg(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="glass-effect w-full max-w-xl rounded-[2.5rem] border border-white/10 p-8 relative z-10 shadow-2xl"
                            >
                                <h3 className="text-2xl font-black text-white font-outfit uppercase tracking-tighter mb-6 flex items-center gap-3">
                                    <Building className="w-7 h-7 text-indigo-400" /> Request Membership
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Target Organization</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                            {organizations.map(org => (
                                                <button
                                                    key={org.id}
                                                    onClick={() => setSelectedOrgId(org.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                                                        selectedOrgId === org.id
                                                            ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                                                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20"
                                                    )}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                                                        {org.logo_url ? <img src={org.logo_url} className="w-6 h-6 object-contain" /> : <Building className="w-5 h-5" />}
                                                    </div>
                                                    <span className="font-bold text-sm truncate">{org.name}</span>
                                                </button>
                                            ))}
                                            {organizations.length === 0 && <div className="col-span-2 py-10 text-center text-slate-600 italic">No public organizations found.</div>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Message to Admin (Optional)</label>
                                        <textarea
                                            value={joinMessage}
                                            onChange={e => setJoinMessage(e.target.value)}
                                            placeholder="Introduce yourself or mention your team..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 min-h-[100px] resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button variant="ghost" onClick={() => setIsRequestingOrg(false)} className="flex-1 h-12 rounded-xl text-slate-400 font-bold hover:text-white">Cancel</Button>
                                        <Button
                                            onClick={handleRequestJoin}
                                            disabled={!selectedOrgId || isSubmittingRequest}
                                            className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                        >
                                            {isSubmittingRequest ? 'Transmitting...' : 'Send Request'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-16 h-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                        <h3 className="text-zinc-400 font-medium text-sm mb-1">Total Workflows</h3>
                        <p className="text-4xl font-bold text-white">{data?.stats?.total_workflows || 0}</p>
                        {isTrialing && <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-tighter">Limit: 1 Workflow</p>}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-16 h-16 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-zinc-400 font-medium text-sm mb-1">End User Interactions</h3>
                        <p className="text-4xl font-bold text-white">{data?.stats?.total_app_users || 0}</p>
                    </motion.div>
                </div>

                {/* Recent Workflows */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Recent Workflows
                    </h2>

                    {!data?.recent_workflows || data.recent_workflows.length === 0 ? (
                        <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-zinc-900/20">
                            <p className="text-zinc-500 mb-4">You haven't created any workflows yet.</p>
                            <button onClick={() => navigate('/builder')} className="text-indigo-400 hover:text-indigo-300 font-medium">Create your first workflow &rarr;</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.recent_workflows.map((wf, idx) => (
                                <motion.div
                                    key={wf.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-4 border border-white/5 bg-zinc-900/50 rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer flex justify-between items-center group"
                                    onClick={() => navigate(`/builder?id=${wf.id}`)}
                                >
                                    <div>
                                        <h3 className="font-semibold text-lg text-zinc-200 group-hover:text-indigo-400 transition-colors">{wf.name}</h3>
                                        <p className="text-xs text-zinc-500 mt-1">Last edited: {new Date(wf.updated_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                        &rarr;
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UserDashboard;
