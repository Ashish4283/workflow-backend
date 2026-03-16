import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, loginWithGoogle } = useAuth(); // Import useAuth hooks

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast({ title: "Error", description: "Please enter your credentials.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        const result = await login(email, password);

        setIsLoading(false);

        if (result.success) {
            toast({ title: "Welcome back!", description: "Successfully logged in." });
            if (result.role === 'admin' || result.role === 'super_admin') navigate('/admin');
            else navigate('/dashboard');
        } else if (result.requires_verification) {
            toast({ title: "Identity Unverified", description: "Please complete the verification challenge." });
            navigate('/register', { state: { email: email, verificationMode: true } });
        } else {
            toast({ title: "Login Failed", description: result.message, variant: "destructive" });
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setIsLoading(true);
        const result = await loginWithGoogle(credentialResponse.credential);
        setIsLoading(false);
        if (result.success) {
            toast({ title: "Welcome!", description: "Successfully logged in with Google." });
            if (result.role === 'admin' || result.role === 'super_admin') navigate('/admin');
            else navigate('/dashboard');
        } else {
            toast({ title: "Google Login Failed", description: result.message, variant: "destructive" });
        }
    };

    return (
        <div>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2 font-outfit">Welcome back</h2>
                <p className="text-sm text-slate-400">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
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
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                        <Link to="#" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">Forgot password?</Link>
                    </div>
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

                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white py-6 rounded-xl font-medium text-base shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all group"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                    )}
                </Button>
            </form>

            <div className="mt-6 flex items-center justify-between">
                <span className="border-b border-slate-800 w-1/5 lg:w-1/4"></span>
                <span className="text-xs text-center text-slate-500 uppercase">or continue with</span>
                <span className="border-b border-slate-800 w-1/5 lg:w-1/4"></span>
            </div>

            <div className="mt-6 flex justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        toast({ title: "Error", description: "Google Login Failed", variant: "destructive" });
                    }}
                    theme="filled_black"
                    shape="rectangular"
                    text="signin_with"
                />
            </div>

            <div className="mt-8 text-center text-sm">
                <span className="text-slate-500">Don't have an account? </span>
                <Link to="/register" className="text-primary font-semibold hover:text-primary/80 hover:underline transition-all">
                    Create an account
                </Link>
            </div>
        </div>
    );
}
