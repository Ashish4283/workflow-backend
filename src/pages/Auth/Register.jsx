import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState(location.state?.email || '');
    const [password, setPassword] = useState('');
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [verificationMode, setVerificationMode] = useState(location.state?.verificationMode || false);
    const [otp, setOtp] = useState('');
    const { register, login, verify } = useAuth();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);

        const result = await register(name, email, password, orgName);

        if (result.success) {
            setVerificationMode(true);
            setIsLoading(false);
        } else {
            setIsLoading(false);
            setError(result.message);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (result.success) {
            if (password) {
                // Auto login if we have the password (from registration flow)
                const loginResult = await login(email, password);
                if (loginResult.success) {
                    navigate('/dashboard');
                    return;
                }
            }
            // If no password or auto-login failed, show success message
            setVerificationMode(false);
            setError('');
            alert("Identity Verified! Protocol complete. Please sign in to access the matrix.");
            navigate('/login');
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600 rounded-full blur-[120px] opacity-20"></div>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mt-6 text-center text-3xl font-extrabold text-white font-outfit"
                >
                    Create an account
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mt-2 text-center text-sm text-zinc-400"
                >
                    Already have an account? <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">Sign in here</Link>
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <div className="bg-zinc-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-zinc-800/50">
                    {!verificationMode ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Email address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Organization Name (Optional)</label>
                                <input
                                    type="text"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-zinc-700 rounded-xl bg-zinc-800/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Your Company Ltd"
                                />
                                <p className="mt-1 text-xs text-zinc-500">Leaving this blank registers you as an individual unassigned entity.</p>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest font-bold"
                                >
                                    {isLoading ? "Synchronizing..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleVerify}>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Verification Required</h3>
                                <p className="text-xs text-zinc-400">A 6-digit security code was sent to <span className="text-indigo-400">{email}</span>. Please enter it below to verify your identity.</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-center">
                                    <p className="text-sm text-red-400 font-bold">{error}</p>
                                </div>
                            )}

                            <div>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="appearance-none block w-full px-4 py-4 border border-zinc-700 rounded-2xl bg-zinc-800/50 text-white text-center text-4xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                                    placeholder="000000"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-[0.2em]"
                            >
                                {isLoading ? "Verifying..." : "Verify Identity"}
                            </button>

                            <p className="text-center text-[10px] text-zinc-500 uppercase tracking-widest">
                                Didn't receive code? <button type="button" onClick={handleSubmit} className="text-indigo-400 hover:underline font-bold">Resend Signal</button>
                            </p>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
