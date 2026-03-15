import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { processInvite } from '../services/api';

const InvitePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [inviteData, setInviteData] = useState(null);
    const [status, setStatus] = useState('loading'); // loading, error, success, ready
    const [message, setMessage] = useState('');

    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid invitation link.');
            return;
        }

        const fetchInvite = async () => {
            try {
                const res = await processInvite(token, 'GET');
                if (res.status === 'success') {
                    setInviteData(res.data);
                    setStatus('ready');
                } else {
                    setStatus('error');
                    setMessage(res.message);
                }
            } catch (err) {
                setStatus('error');
                setMessage('Failed to fetch invitation details.');
            }
        };

        fetchInvite();
    }, [token]);

    const handleAccept = async () => {
        if (!isAuthenticated) {
            // Redirect to login but save the current URL to come back
            navigate(`/login?redirect=/invite?token=${token}`);
            return;
        }

        setStatus('processing');
        try {
            const res = await processInvite(token, 'POST');
            if (res.status === 'success') {
                setStatus('success');
                setMessage('Invitation accepted! Redirecting to dashboard...');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                setStatus('ready');
                alert(res.message);
            }
        } catch (err) {
            setStatus('ready');
            alert('Failed to process invitation.');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 font-outfit">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
            >
                {status === 'loading' && (
                    <div className="py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p className="text-zinc-400">Verifying invitation...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-8">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">⚠️</div>
                        <h1 className="text-2xl font-bold mb-2">Oops!</h1>
                        <p className="text-zinc-400 mb-8">{message}</p>
                        <button onClick={() => navigate('/')} className="w-full py-3 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition-colors">Go Home</button>
                    </div>
                )}

                {status === 'ready' && (
                    <div className="py-4">
                        <div className="w-20 h-20 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl">🤝</div>
                        <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
                        <p className="text-zinc-400 mb-8">
                            {inviteData?.creator_name} has invited you to join their operational network as a
                            <span className="text-white font-bold"> {
                                inviteData?.target_role === 'manager' ? 'Manager' : 
                                inviteData?.target_role === 'worker' ? 'Worker' : 
                                inviteData?.target_role === 'agent' ? 'Agent' : 
                                'Collaborator'
                            }</span>.
                        </p>

                        <button
                            onClick={handleAccept}
                            className="w-full py-4 bg-indigo-600 rounded-2xl font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 mb-4"
                        >
                            {isAuthenticated ? 'Accept Invitation' : 'Login to Accept'}
                        </button>

                        {!isAuthenticated && (
                            <p className="text-xs text-zinc-500">
                                Don't have an account? <span className="text-indigo-400 cursor-pointer" onClick={() => navigate(`/register?redirect=/invite?token=${token}`)}>Create one</span>
                            </p>
                        )}
                    </div>
                )}

                {status === 'processing' && (
                    <div className="py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                        <p className="text-zinc-400">Processing...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-12">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">✅</div>
                        <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
                        <p className="text-zinc-400">{message}</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default InvitePage;
