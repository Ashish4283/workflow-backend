import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,
    Edit3,
    Save,
    X,
    Brain,
    Activity,
    Clock,
    Zap,
    MessageSquare,
    Search,
    Cloud,
    FileText,
    FileJson,
    Webhook,
    Code,
    Terminal,
    Users,
    ArrowRightLeft,
    Monitor,
    Shield,
    Wand2,
    Settings,
    FileCode,
    CheckCircle2,
    Plus,
    Trash2,
    GripVertical,
    HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const SECTIONS = [
    { id: 'core', label: 'Core Logic', icon: Settings },
    { id: 'flow', label: 'Flow Control', icon: Activity },
    { id: 'plugins', label: 'System Plugins', icon: Cloud },
    { id: 'builder', label: 'Process Builder', icon: Wand2 },
];

const DEFAULT_CONTENT = {
    core: [
        { title: 'Start Trigger', icon: Zap, description: 'The entry point for every workflow. Can be a manual trigger, a scheduled event, or a Webhook URL that listens for external data.', color: 'text-amber-400' },
        { title: 'If / Else', icon: Activity, description: 'Advanced branching logic. Allows you to compare variables (equal to, contains, exists) and split the workflow path based on the result.', color: 'text-red-400' },
        { title: 'Context Memory', icon: Shield, description: 'Saves and retrieves data across different workflow runs or steps. Essential for maintaining state in complex multi-step processes.', color: 'text-amber-500' },
        { title: 'Recruit Workflow', icon: Wand2, description: 'Allows one workflow to call another. This modular approach helps in building scalable and reusable automation blocks.', color: 'text-blue-500' },
    ],
    flow: [
        { title: 'Wait / Delay', icon: Clock, description: 'Pauses the workflow for a specified duration (seconds, minutes, or hours). Useful for rate-limiting or waiting for external processes.', color: 'text-rose-400' },
        { title: 'Merge Paths', icon: ArrowRightLeft, description: 'Combines multiple branches back into a single stream. Essential after an If/Else branch if both paths eventually need to perform the same task.', color: 'text-cyan-400' },
        { title: 'Split In Batches', icon: Activity, description: 'Iterates over a list of items. It splits a large array into smaller chunks and processes them one by one until the list is exhausted.', color: 'text-emerald-400' },
    ],
    plugins: [
        { title: 'AI Model', icon: Brain, description: 'Connects to LLMs (GPT-4, Claude, etc.) to summarize, classify, or generate content based on your custom prompts.', color: 'text-purple-500' },
        { title: 'AI BPO Agent', icon: Monitor, description: 'Integrates with Voice AI agents like Vapi. Ideal for automating call center operations and customer support.', color: 'text-indigo-400' },
        { title: 'User App', icon: Monitor, description: 'Creates a custom UI interface for end-users to interact with the workflow (forms, review screens, dashboards).', color: 'text-pink-500' },
        { title: 'Web Scraper', icon: Search, description: 'Automates browser actions to extract data from websites, click buttons, or take screenshots.', color: 'text-orange-400' },
        { title: 'External API', icon: Webhook, description: 'Makes HTTP requests (GET, POST, PUT, DELETE) to any external service or third-party API.', color: 'text-blue-500' },
    ],
    builder: [
        { title: 'JSON Source View', icon: FileCode, description: 'Switch to a professional code editor view to see the raw structure of your workflow. Perfect for advanced users to copy-paste entire architectures.', color: 'text-blue-400' },
        { title: 'Auto-Healing', icon: Zap, description: 'The builder automatically fixes invalid coordinates, maps legacy types, and sanitizes data structures during imports.', color: 'text-amber-400' },
        { title: 'Sync to DB', icon: Save, description: 'Instantly pushes your local changes to the enterprise cloud ledger, versioning your workflow as you go.', color: 'text-emerald-400' },
        { title: 'AI Optimizer', icon: Wand2, description: 'Use AI to analyze your prompt and generate a full multi-node workflow architecture in seconds.', color: 'text-primary' },
    ]
};

export default function KnowledgeBase() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const [activeTab, setActiveTab] = useState('core');
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(DEFAULT_CONTENT);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchKB();
    }, []);

    const fetchKB = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/knowledge-base.php', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.status === 'success' && result.data.length > 0) {
                const newContent = { ...DEFAULT_CONTENT };
                result.data.forEach(item => {
                    newContent[item.section_id] = JSON.parse(item.content_json);
                });
                setContent(newContent);
            }
        } catch (error) {
            console.error("Failed to fetch KB:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/knowledge-base.php', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    section_id: activeTab,
                    content: content[activeTab]
                })
            });
            const result = await response.json();
            if (result.status === 'success') {
                toast({ title: "KB Updated", description: "Changes saved to the central knowledge base." });
                setIsEditing(false);
            } else {
                toast({ title: "Error", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to server.", variant: "destructive" });
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...content[activeTab]];
        newItems[index] = { ...newItems[index], [field]: value };
        setContent({ ...content, [activeTab]: newItems });
    };

    const addItem = () => {
        const newItems = [...content[activeTab], { title: 'New Item', icon: HelpCircle, description: 'Details here...', color: 'text-slate-400' }];
        setContent({ ...content, [activeTab]: newItems });
    };

    const removeItem = (index) => {
        const newItems = content[activeTab].filter((_, i) => i !== index);
        setContent({ ...content, [activeTab]: newItems });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-outfit font-bold text-white tracking-tight">Enterprise Knowledge Base</h1>
                    </div>
                    <p className="text-slate-400">Master the architecture and logic of the Creative 4 AI Process Builder.</p>
                </div>

                {isSuperAdmin && (
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2 border-slate-800 text-slate-400">
                                    <X className="w-4 h-4" /> Cancel
                                </Button>
                                <Button onClick={handleSave} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                                    <Save className="w-4 h-4" /> Save Changes
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)} className="gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                                <Edit3 className="w-4 h-4" /> Edit Database
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-slate-900/50 border border-white/5 rounded-2xl w-fit">
                {SECTIONS.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => { setActiveTab(section.id); setIsEditing(false); }}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-medium text-sm whitespace-nowrap",
                            activeTab === section.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <section.icon className="w-4 h-4" />
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[500px] relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {content[activeTab].map((item, idx) => {
                                const IconComp = item.icon || HelpCircle;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        layout
                                        className="group relative p-6 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5"
                                    >
                                        <div className="flex gap-4">
                                            <div className={cn("p-4 rounded-2xl bg-slate-950 border border-white/5 shrink-0", item.color || "text-slate-400")}>
                                                <IconComp className="w-6 h-6 shrink-0" />
                                            </div>
                                            <div className="space-y-2 flex-grow">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            value={item.title}
                                                            onChange={(e) => updateItem(idx, 'title', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:border-primary focus:outline-none"
                                                            placeholder="Node Title"
                                                        />
                                                        <textarea
                                                            value={item.description}
                                                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:border-primary focus:outline-none min-h-[100px]"
                                                            placeholder="Node Description"
                                                        />
                                                        <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="text-lg font-bold text-white tracking-tight">{item.title}</h3>
                                                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                                            {item.description}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {isEditing && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onClick={addItem}
                                    className="p-6 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-primary/50 hover:text-primary transition-all group lg:min-h-[200px]"
                                >
                                    <div className="p-3 bg-slate-900 rounded-2xl group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-sm uppercase tracking-widest">Add New Documentation Node</span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
