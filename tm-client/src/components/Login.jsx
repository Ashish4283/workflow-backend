import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const { login } = useAuth();

    const handleSuccess = (credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);
        login({
            ...decoded,
            token: credentialResponse.credential
        });
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="glass-card rounded-[2.5rem] p-8 lg:p-12 border border-white/5 neo-shadow relative overflow-hidden text-center">
                    <div className="absolute top-0 right-0 p-8">
                        <Shield className="w-12 h-12 text-primary/10 rotate-12" />
                    </div>

                    <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/30 shadow-lg shadow-primary/20">
                        <Zap className="w-10 h-10 text-primary" />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight mb-2">TradeMaster</h1>
                    <p className="text-white/40 text-sm mb-12 uppercase tracking-[0.2em] font-medium">Quantum Momentum Terminal</p>

                    <div className="space-y-6 mb-12 text-left">
                        <Feature icon={TrendingUp} text="Asymmetric Payoff Engine" />
                        <Feature icon={Lock} text="Secure Credential Vault" />
                        <Feature icon={Shield} text="Multi-User User Access" />
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleSuccess}
                            onError={() => console.log('Login Failed')}
                            theme="filled_black"
                            shape="pill"
                            text="continue_with"
                        />
                    </div>

                    <p className="mt-12 text-[10px] text-white/20 leading-relaxed uppercase tracking-widest font-bold">
                        Institutional Grade Security Enabled
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

const Feature = ({ icon: Icon, text }) => (
    <div className="flex items-center gap-4 group">
        <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
            <Icon className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm text-white/60 group-hover:text-white transition-colors">{text}</span>
    </div>
);

export default Login;
