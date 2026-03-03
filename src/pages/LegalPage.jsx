import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Scale, Cookie, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/sections/Navbar';

const LegalPage = () => {
    const [activeTab, setActiveTab] = useState('terms');

    const sections = {
        terms: {
            title: "Terms of Service",
            icon: FileText,
            content: [
                { h: "1. Acceptance of Protocol", p: "By accessing Creative 4 AI, you agree to comply with our autonomous operating procedures. Our service scales based on your subscription tier." },
                { h: "2. Reasoning License", p: "We grant you a non-exclusive license to deploy agentic workflows using our reasoning engines. All logical architectures remains yours, while the engine remains ours." },
                { h: "3. Responsible Automation", p: "Users must not deploy agents for malicious protocol interference, spam, or unethical socio-technical disruption." }
            ]
        },
        privacy: {
            title: "Privacy Protocol",
            icon: Shield,
            content: [
                { h: "1. Data Ingestion", p: "We only ingest data necessary for workflow execution. All secrets are encrypted using AES-256 before storage in our secure vault." },
                { h: "2. Encryption Standards", p: "Your reasoning metadata is isolated. We do not use user-specific logic to train global models without explicit consent." },
                { h: "3. Right to Erasure", p: "You may terminate your identity and wipe all associated architecture from our clusters at any time." }
            ]
        },
        cookies: {
            title: "Cookie Policy",
            icon: Cookie,
            content: [
                { h: "1. Essential Cache", p: "We use essential cookies to maintain your authentication state and protocol preferences." },
                { h: "2. Performance Bits", p: "Analytical cookies help us optimize reasoning latency across our global GPU clusters." }
            ]
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-outfit">
            <div className="container mx-auto px-6 py-20 max-w-5xl">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-12 group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Reality
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <h1 className="text-3xl font-black tracking-tighter mb-8 italic">Legal <br /> Protocol</h1>
                        {Object.keys(sections).map((key) => {
                            const Icon = sections[key].icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
                                        activeTab === key
                                            ? "bg-primary/20 border-primary/40 text-primary"
                                            : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">{sections[key].title}</span>
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === key && "rotate-90")} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-effect p-12 rounded-[3.5rem] border border-white/5 space-y-10"
                        >
                            <div className="space-y-4">
                                <h2 className="text-4xl font-black tracking-tight text-white">{sections[activeTab].title}</h2>
                                <p className="text-slate-500 text-sm italic">Last Updated: March 2026 • Revision 3.4.2</p>
                            </div>

                            <div className="space-y-12">
                                {sections[activeTab].content.map((item, i) => (
                                    <div key={i} className="space-y-4">
                                        <h3 className="text-xl font-bold text-slate-200">{item.h}</h3>
                                        <p className="text-slate-400 leading-relaxed">{item.p}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-10 border-t border-white/5 text-center">
                                <p className="text-slate-500 text-xs">Questions regarding our protocol? <a href="mailto:legal@creative4ai.com" className="text-primary hover:underline">Contact Compliance</a></p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;

// Helper function for class names
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
