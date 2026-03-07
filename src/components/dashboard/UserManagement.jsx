import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addUser } from '../../services/api';
import { User, Mail, Lock, Shield, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const UserManagement = ({ currentUserRole, onUserAdded }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const allowedRoles = (() => {
        if (currentUserRole === 'super_admin') return ['admin', 'manager', 'tech_user', 'worker'];
        if (currentUserRole === 'admin') return ['manager', 'tech_user', 'worker'];
        if (currentUserRole === 'manager') return ['tech_user', 'worker'];
        return ['tech_user', 'worker'];
    })();

    const [role, setRole] = useState('tech_user');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const res = await addUser({ name, email, role, password });
            if (res.status === 'success') {
                setMessage({ type: 'success', text: 'Identity successfully ingested into the workforce.' });
                setName('');
                setEmail('');
                setRole('user');
                setPassword('');
                if (onUserAdded) setTimeout(onUserAdded, 1500);
            } else {
                setMessage({ type: 'error', text: res.message });
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Transmission failed.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-effect border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-8">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Invite <span className="text-gradient">Agent</span></h2>
                    <p className="text-slate-500 text-sm mt-1">Configure access for a new human or synthetic reasoning asset.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <User className="w-3 h-3 group-focus-within:text-primary transition-colors" /> Full Identity
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Legal or Synthetic Name"
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-outfit"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Mail className="w-3 h-3 group-focus-within:text-primary transition-colors" /> Communication Protocol
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="primary@entity.com"
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-outfit"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Lock className="w-3 h-3 group-focus-within:text-primary transition-colors" /> Access Key
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Secure Entry String"
                                className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-medium text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all font-outfit"
                            />
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Shield className="w-3 h-3 group-focus-within:text-primary transition-colors" /> Permission Level
                            </label>
                            <div className="relative">
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all appearance-none cursor-pointer"
                                >
                                    {allowedRoles.map(r => (
                                        <option key={r} value={r} className="bg-slate-900 capitalize">{r}</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <Shield className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                    "p-4 rounded-2xl flex items-center gap-4 border text-sm font-bold",
                                    message.type === 'success'
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                )}
                            >
                                {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                {message.text}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        {isSubmitting ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Finalize Invitation"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default UserManagement;
