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
    { id: 'dir', label: 'Detailed Directory', icon: Terminal },
];

const DEFAULT_CONTENT = {
    core: [
        {
            title: 'Start Trigger',
            icon: Zap,
            description: 'The foundation of your workflow. \n\nHOW TO CONFIGURE:\n1. Open Settings: Double-click the node.\n2. Choose Type: Select "Webhook" for instant data, "Manual" for button-starts, or "Schedule" for periodic tasks.\n3. Webhook URL: Copy the generated URL to external apps (like Shopify or Stripe) to send data into Creative 4 AI.\n\nPRO TIP: Use "{{trigger.id}}" in subsequent nodes to reference the incoming data.',
            color: 'text-amber-400'
        },
        {
            title: 'If / Else',
            icon: Activity,
            description: 'Intelligent decision making.\n\nHOW TO CONFIGURE:\n1. Value 1: Use the variable picker or type "{{data.field_name}}".\n2. Operator: Choose "Equals", "Contains", "Greater Than", etc.\n3. Value 2: The static value or variable to compare against.\n\nACTION: Connect nodes to the Green handle (True) and Red handle (False).',
            color: 'text-red-400'
        },
        {
            title: 'Context Memory',
            icon: Shield,
            description: 'The short-term memory of your agent.\n\nHOW TO CONFIGURE:\n1. Operation: Set to "Store" to save data, or "Read" to fetch it.\n2. Key Name: A unique name (e.g., "customer_history").\n3. Value: The information you want to save.\n\nUSE CASE: Saving a user\'s name in a multi-step conversation so the AI can use it later.',
            color: 'text-amber-500'
        },
        {
            title: 'Recruit Workflow',
            icon: Wand2,
            description: 'Call a sub-process inside your main flow.\n\nHOW TO CONFIGURE:\n1. Select Workflow: Choose from your list of created flows.\n2. Input Mapping: Pass specific data from your current flow into the sub-flow.\n\nPRO TIP: Use this to create reusable modules like "Global Error Handler" or "Data Logger".',
            color: 'text-blue-500'
        },
    ],
    flow: [
        {
            title: 'Wait / Delay',
            icon: Clock,
            description: 'Control the timing of your operations.\n\nHOW TO CONFIGURE:\n1. Duration: Type a number (e.g., 5).\n2. Unit: Choose Seconds, Minutes, or Hours.\n\nUSE CASE: Waiting 10 minutes before sending a follow-up email to make it feel natural and human-like.',
            color: 'text-rose-400'
        },
        {
            title: 'Merge Paths',
            icon: ArrowRightLeft,
            description: 'Bringing it all back together.\n\nHOW TO CONFIGURE:\n1. Input Nodes: Connect multiple branches to this single node.\n2. Mode: Set to "Wait for All" if you need data from every branch, or "First Come" to continue as soon as one branch finishes.\n\nUSE CASE: Merging True/False paths of an If/Else node to a final "Success Message" node.',
            color: 'text-cyan-400'
        },
        {
            title: 'Split In Batches',
            icon: Activity,
            description: 'Handle large data lists with ease.\n\nHOW TO CONFIGURE:\n1. Input List: Select the array/list variable you want to loop through.\n2. Batch Size: How many items to process at once (e.g., 10).\n\nACTION: Loop the output back into the input of this node until finished.',
            color: 'text-emerald-400'
        },
    ],
    plugins: [
        {
            title: 'AI Model',
            icon: Brain,
            description: 'Your Generative AI brain.\n\nHOW TO CONFIGURE:\n1. System Prompt: Explain the AI\'s persona (e.g., "You are a helpful support agent").\n2. User Input: Pass the data using "{{variable}}".\n3. Model: Choose GPT-4 Omni for complex logic or Claude for creative writing.\n\nPRO TIP: Set "Temperature" to 0 for strict facts, or 0.8 for creative ideas.',
            color: 'text-purple-500'
        },
        {
            title: 'AI BPO Agent',
            icon: Monitor,
            description: 'Voice & Call Center Automation.\n\nHOW TO CONFIGURE:\n1. Agent ID: Paste your Vapi Agent ID.\n2. Greeting: The first thing the AI says on the call.\n3. Phone Number: The destination number or SIP trunk.\n\nUSE CASE: Automatically calling a lead the moment they fill out a website form.',
            color: 'text-indigo-400'
        },
        {
            title: 'User App',
            icon: Monitor,
            description: 'Create interfaces for humans.\n\nHOW TO CONFIGURE:\n1. Fields: Add "Text Input", "File Upload", or "Drop-down".\n2. Branding: Set the App Title and Logo URL.\n3. Human Review: Enable this to pause the workflow until a human clicks "Approve".',
            color: 'text-pink-500'
        },
        {
            title: 'Web Scraper',
            icon: Search,
            description: 'Extract data from any website.\n\nHOW TO CONFIGURE:\n1. Target URL: The website address.\n2. Action: Choose "Scrape Content" (Text only) or "Screenshot" (Visual).\n3. Wait Period: Seconds to wait for JavaScript to load.\n\nPRO TIP: Use this to track competitor prices or aggregate news daily.',
            color: 'text-orange-400'
        },
        {
            title: 'External API',
            icon: Webhook,
            description: 'The bridge to 5000+ other apps.\n\nHOW TO CONFIGURE:\n1. Method: Choose GET (fetch), POST (send), or DELETE.\n2. Headers: Enter API Keys or Auth Tokens here.\n3. Payload: The JSON data to send to the external service.',
            color: 'text-blue-500'
        },
    ],
    builder: [
        {
            title: 'JSON Source View',
            icon: FileCode,
            description: 'The Pro Editor mode.\n\nHOW TO USE:\n1. Click the Blue Icon in the toolbar.\n2. Edit the raw JSON structure.\n3. Click "Apply" to rebuild the canvas instantly.\n\nUSE CASE: Migrating a workflow from a sandbox environment to production by copy-pasting code.',
            color: 'text-blue-400'
        },
        {
            title: 'Auto-Healing',
            icon: Zap,
            description: 'Self-correcting architecture.\n\nFUNCTIONALITY:\nWhenever you paste external JSON, the builder detects missing coordinates, fixes broken node types, and reconnects detached logic automatically to ensure the workflow is "Render Ready".',
            color: 'text-amber-400'
        },
        {
            title: 'Sync to DB',
            icon: Save,
            description: 'Cloud Persistence & Safety.\n\nFUNCTIONALITY:\nEnsures your draft is backed up to the enterprise ledger. If your browser crashes, you can recover the "Unsynced Draft" on the next visit.',
            color: 'text-emerald-400'
        },
        {
            title: 'AI Optimizer',
            icon: Wand2,
            description: 'Zero-Code Flow Generation.\n\nHOW TO USE:\n1. Type your goal (e.g., "Build a flow that scrapes Amazon and emails me prices").\n2. Click Generate.\n3. The AI will drop the required nodes and connect them for you.',
            color: 'text-primary'
        },
    ]
};

export default function KnowledgeBase() {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const [activeTab, setActiveTab] = useState('core');
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(DEFAULT_CONTENT);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    // Global Search Logic
    const allItems = Object.entries(content).flatMap(([sectionId, items]) =>
        items.map(item => ({ ...item, sectionId }))
    );

    const filteredItems = searchQuery.trim() === ''
        ? content[activeTab]
        : allItems.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1 text-left flex-grow">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-outfit font-bold text-white tracking-tight">Enterprise Knowledge Base</h1>
                    </div>
                    <p className="text-slate-400">Master the architecture and logic of the Creative 4 AI Process Builder.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search Engine Bar */}
                    <div className="relative group flex-grow md:min-w-[400px]">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search knowledge articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all backdrop-blur-xl shadow-inner"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {isSuperAdmin && (
                        <div className="flex gap-2 shrink-0">
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
            </div>

            {/* Navigation Tabs (Hidden during search) */}
            {!searchQuery && (
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
            )}

            {searchQuery && (
                <div className="flex items-center gap-2 text-slate-400 text-sm pl-2">
                    <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    Found {filteredItems.length} matching articles for "{searchQuery}"
                </div>
            )}

            {/* Content Area */}
            <div className="min-h-[500px] relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : activeTab === 'dir' && !searchQuery ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden"
                    >
                        <table className="w-full text-left">
                            <thead className="bg-white/5 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Title</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Section</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {allItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={cn("p-2 rounded-lg bg-slate-950 border border-white/5 w-fit", item.color)}>
                                                {item.icon ? <item.icon className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-white whitespace-nowrap">{item.title}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400 max-w-md truncate">{item.description}</td>
                                        <td className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                            {SECTIONS.find(s => s.id === item.sectionId)?.label}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                ) : (
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item, idx) => {
                                const IconComp = item.icon || HelpCircle;
                                return (
                                    <motion.div
                                        key={`${item.sectionId || activeTab}-${idx}`}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        layout
                                        className="group relative p-6 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-primary/30 transition-all hover:shadow-2xl hover:shadow-primary/5 overflow-hidden"
                                    >
                                        {searchQuery && (
                                            <div className="absolute top-4 right-6 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                                                {SECTIONS.find(s => s.id === item.sectionId)?.label || item.sectionId}
                                            </div>
                                        )}
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
