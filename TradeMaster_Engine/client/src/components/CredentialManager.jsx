import React, { useState, useEffect } from 'react';
import { Key, Shield, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const CredentialManager = () => {
  const { user } = useAuth();
  const [showKeys, setShowKeys] = useState(false);
  const [saved, setSaved] = useState(false);

  const [creds, setCreds] = useState({
    apiKey: '',
    clientId: '',
    totpSecret: '',
    openaiKey: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
        const res = await fetch(`${baseUrl}/api/settings`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        setCreds(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error('Failed to load settings');
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
      const res = await fetch(`${baseUrl}/api/settings`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(creds)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      alert('Failed to save credentials to database');
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/5 neo-shadow h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-semibold text-sm">Nexus Bridge (API)</h3>
        </div>
        <button 
          onClick={() => setShowKeys(!showKeys)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40"
        >
          {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="space-y-4">
        <KeyInput 
          label="Angel One API Key" 
          value={creds.apiKey} 
          show={showKeys} 
          onChange={(v) => setCreds({...creds, apiKey: v})} 
        />
        <KeyInput 
          label="Client ID" 
          value={creds.clientId} 
          show={showKeys} 
          onChange={(v) => setCreds({...creds, clientId: v})} 
        />
        <KeyInput 
          label="TOTP Secret" 
          value={creds.totpSecret} 
          show={showKeys} 
          onChange={(v) => setCreds({...creds, totpSecret: v})} 
        />
        <KeyInput 
          label="OpenAI Key (Optional)" 
          value={creds.openaiKey} 
          show={showKeys} 
          onChange={(v) => setCreds({...creds, openaiKey: v})} 
        />
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-danger/5 border border-danger/10 flex gap-3">
        <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
        <p className="text-[10px] text-white/40 leading-relaxed">
          Keys are stored in your server-side environment. Never share your TOTP secret or API keys with unauthorized personnel.
        </p>
      </div>

      <button 
        onClick={handleSave}
        className={`w-full mt-6 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all uppercase tracking-widest ${saved ? 'bg-secondary text-white' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90'}`}
      >
        <Save className="w-4 h-4" />
        {saved ? 'Credentials Saved' : 'Sync Credentials'}
      </button>
    </div>
  );
};

const KeyInput = ({ label, value, show, onChange }) => (
  <div>
    <label className="text-[10px] text-white/30 uppercase font-bold mb-1.5 block ml-1">{label}</label>
    <div className="relative">
      <input 
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/10 focus:outline-none focus:border-primary/50 transition-colors"
        placeholder={show ? "Enter key..." : "••••••••••••••••"}
      />
    </div>
  </div>
);

export default CredentialManager;
