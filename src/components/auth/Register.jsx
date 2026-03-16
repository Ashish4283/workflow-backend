import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, User, ArrowRight, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
    const location = useLocation();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState(location.state?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [isPublicClient, setIsPublicClient] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOrgAccount, setIsOrgAccount] = useState(false);
    
    const [verificationMode, setVerificationMode] = useState(location.state?.verificationMode || false);
    const [otp, setOtp] = useState('');

    const { register, login, loginWithGoogle, verify, resend } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!name || !email || !password) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }

        if (password !== confirmPassword) {
            toast({ title: "Error", description: "Passwords don't match", variant: "destructive" });
            return;
        }

        if (password.length < 6) {
            toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        const result = await register(name, email, password, isOrgAccount ? organizationName : null, isPublicClient);

        if (result.success) {
            setVerificationMode(true);
            setIsLoading(false);
            toast({ title: "Signal Dispatched", description: "Identity challenge sent to your comms terminal." });
        } else {
            setIsLoading(false);
            toast({ title: "Registration failed", description: result.message, variant: "destructive" });
        }
    };

    const handleResend = async () => {
        setIsLoading(true);
        const result = await resend(email);
        setIsLoading(false);
        if (result.success) {
            toast({ title: "Signal Renewed", description: "A fresh verification matrix has been dispatched." });
        } else {
            toast({ title: "Resend Failed", description: result.message, variant: "destructive" });
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await verify(email, otp);

        if (result.success) {
            toast({ title: "Identity Verified", description: "Neural synchronization complete." });
            if (password) {
                // Auto login if we have the password
                const loginResult = await login(email, password);
                if (loginResult.success) {
                    navigate('/dashboard');
                    return;
                }
            }
            navigate('/login');
        } else {
            toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
        }
        setIsLoading(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        const result = await loginWithGoogle(credentialResponse.credential);
        setIsLoading(false);
        if (result.success) {
            toast({ title: "Account created!", description: "Successfully registered with Google." });
            if (result.role === 'admin') navigate('/admin');
            else navigate('/dashboard');
        } else {
            toast({ title: "Google Registration Failed", description: result.message, variant: "destructive" });
        }
    };

    if (verificationMode) {
        return (
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                        <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2 font-outfit uppercase tracking-tighter">Verification Required</h2>
                    <p className="text-sm text-slate-400">A security code was sent to <span className="text-primary font-bold">{email}</span></p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="space-y-1.5 focus-within:text-primary transition-colors">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure OTP Signal</label>
                        <input
                            type="text"
                            required
                            maxLength={6}
                            className="block w-full px-4 py-6 bg-slate-950/50 border border-slate-800 rounded-2xl text-slate-200 placeholder-slate-700 text-center text-4xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl transition-all"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                    </Button>

                    <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">
                        Didn't receive code? <button type="button" onClick={handleResend} className="text-primary hover:underline font-bold">Resend Signal</button>
                    </p>
                </form>
            </motion.div>
        );
    }

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2 font-outfit">Create an account</h2>
                <p className="text-sm text-slate-400">Start building powerful workflows today</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            required
                            className="block w-full pl-10 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="email"
                            required
                            className="block w-full pl-10 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            className="block w-full pl-10 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Confirm Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="password"
                            required
                            className="block w-full pl-10 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                    <input
                        type="checkbox"
                        id="isOrgAccount"
                        checked={isOrgAccount}
                        onChange={(e) => setIsOrgAccount(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary"
                    />
                    <label htmlFor="isOrgAccount" className="text-[11px] text-slate-400 font-bold uppercase tracking-wider cursor-pointer selection:bg-none">
                        Registering for an Organization?
                    </label>
                </div>

                {isOrgAccount && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-2"
                    >
                        <div className="space-y-1.5 focus-within:text-primary transition-colors">
                            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Organization Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required={isOrgAccount}
                                    className="block w-full pl-10 px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner"
                                    placeholder="Acme Corp"
                                    value={organizationName}
                                    onChange={(e) => setOrganizationName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <input
                                type="checkbox"
                                id="consent"
                                checked={isPublicClient}
                                onChange={(e) => setIsPublicClient(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-slate-800 bg-slate-950 text-primary focus:ring-primary"
                            />
                            <label htmlFor="consent" className="text-[10px] text-slate-400 leading-relaxed cursor-pointer font-medium uppercase tracking-tight">
                                I consent to display my company logo on the homepage as a client of Reasoning Engine.
                            </label>
                        </div>
                    </motion.div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl font-medium text-base shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all group mt-2"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                    )}
                </Button>
            </form>

            <div className="mt-6 flex items-center justify-between">
                <span className="border-b border-slate-800 w-1/5 lg:w-1/4"></span>
                <span className="text-xs text-center text-slate-500 uppercase">or sign up with</span>
                <span className="border-b border-slate-800 w-1/5 lg:w-1/4"></span>
            </div>

            <div className="mt-6 flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        toast({ title: "Error", description: "Google Registration Failed", variant: "destructive" });
                    }}
                    theme="filled_black"
                    shape="rectangular"
                    text="signup_with"
                />
            </div>

            <div className="mt-8 text-center text-sm">
                <span className="text-slate-500">Already have an account? </span>
                <Link to="/login" className="text-primary font-semibold hover:text-primary/80 hover:underline transition-all">
                    Sign In
                </Link>
            </div>
        </div>
    );
}
