import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Edit2, Zap, Activity, Shield, Link, ChevronRight, Clock, X,
    Settings, Globe, Database, HelpCircle, Layers, Cpu, Server, Code, FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Core Logic Content
const coreLogicCards = [
    {
        title: 'Start Trigger',
        description: 'The foundation of your workflow.',
        icon: Zap,
        howTo: [
            '1. Open Settings: Double-click the node.',
            '2. Choose Type: Select "Webhook" for instant data, "Manual" for button-starts, or "Schedule" for periodic tasks.',
            '3. Webhook URL: Copy the generated URL to external apps (like Shopify or Stripe) to send data into Creative 4 AI.',
        ],
        proTip: 'Use "{{trigger.id}}" in subsequent nodes to reference the incoming data.',
        deepDive: {
            overview: 'The Start Trigger is the non-negotiable entry point for every workflow in the Creative 4 AI ecosystem. It defines exactly how your automation is initialized and what initial data context is available to downstream nodes.',
            sections: [
                {
                    title: 'Webhook: Real-time Ingestion',
                    content: 'When set to Webhook, this node provides a unique, secure URL. Any external service (like Shopify, Stripe, or a custom application) can POST JSON data to this URL. The engine immediately parses the payload and begins execution.'
                },
                {
                    title: 'Scheduled: Automated Recurrence',
                    content: 'Use this for periodic tasks like daily reporting or weekly database cleanup. You can define intervals in minutes, hours, or via complex CRON expressions for precise control over timing.'
                },
                {
                    title: 'Manual: Human-Triggered Workflows',
                    content: 'Ideal for workflows that run on-demand. When a user clicks "Run" in the dashboard or triggers it via an integrated User App UI, the workflow starts. You can define required input fields that must be filled before the workflow proceeds.'
                }
            ]
        }
    },
    {
        title: 'If / Else',
        description: 'Intelligent decision making.',
        icon: Activity,
        howTo: [
            '1. Value 1: Use the variable picker or type "{{data.field_name}}".',
            '2. Operator: Choose "Equals", "Contains", "Greater Than", etc.',
            '3. Value 2: The static value or variable to compare against.',
        ],
        action: 'Connect nodes to the Green handle (True) and Red handle (False).',
        deepDive: {
            overview: 'The If / Else node is the primary logic gate of the system. It allows the workflow to fork into two separate paths based on whether a condition is met.',
            sections: [
                {
                    title: 'Constructing Conditions',
                    content: 'Conditions consist of three parts: Value 1, an Operator, and Value 2. You can use dynamic variables in both value fields using the {{bracket}} syntax.'
                },
                {
                    title: 'Advanced Operators',
                    content: 'Beyond basic equality, you can use "Contains" (string search), "Starts With", "Regex Match", and numeric comparisons like "Greater Than" or "Between".'
                },
                {
                    title: 'Path Execution',
                    content: 'If the condition evaluates to true, the workflow follows the green (right-top) handle. If false, it follows the red (right-bottom) handle. Both paths eventually can merge back into a single thread using the Merge node.'
                }
            ]
        }
    },
    {
        title: 'Context Memory',
        description: 'Persistent state storage for across your agent fleet.',
        icon: Shield,
        howTo: [
            '1. Operation: Set to "Store" to save data, or "Read" to fetch it.',
            '2. Key Name: A unique name (e.g., "user_context").',
            '3. Scope: Choose "Global" for all users or "Session" for current flow.',
        ],
        deepDive: {
            overview: 'Context Memory acts as the long-term memory of your automated agents. It allows data to persist even after a specific workflow execution has ended, enabling "stateful" behavior.',
            sections: [
                {
                    title: 'Cross-Execution Memory',
                    content: 'Standard variables only exist while the workflow is running. Context Memory allows you to save result of one run and use it as input in a different run tomorrow.'
                },
                {
                    title: 'Shared Intelligence',
                    content: 'By using the "Global" scope, you can share data across different workflows. For example, a "Blacklist" workflow can store a spam ID that an "Order Processor" workflow reads later to decide whether to proceed.'
                }
            ]
        }
    },
    {
        title: 'Recruit Workflow',
        description: 'Call a sub-process inside your main flow.',
        icon: Link,
        howTo: [
            '1. Select Workflow: Choose from your list of created flows.',
            '2. Input Mapping: Pass specific data from your current flow into the sub-flow.',
        ],
        deepDive: {
            overview: 'Recruit Workflow (Sub-flows) allow for modular architecture. Instead of building one massive workflow, you can build small, specialized tools and "recruit" them when needed.',
            sections: [
                {
                    title: 'Modular Design',
                    content: 'Build a standard "Email Notification" sub-flow once. Then, every other workflow in your enterprise can simply call it, passing in the dynamic text required.'
                },
                {
                    title: 'Recursive Logic',
                    content: 'Workflows can even call themselves (with caution) to handle nested data structures or repetitive tasks that require multiple passes.'
                }
            ]
        }
    }
];

// Content for other tabs
const flowControlCards = [
    {
        title: 'Wait / Delay',
        description: 'Pauses the cognitive execution thread.',
        icon: Clock,
        howTo: [
            '1. Set Duration: Input the number of seconds, minutes, or hours.',
            '2. Connect: Place this between two nodes where a delay is required.'
        ],
        deepDive: {
            overview: 'The Wait node introduces a surgical pause in the workflow. This is critical for interacting with external systems that take time to process requests.',
            sections: [
                {
                    title: 'API Polling Patterns',
                    content: 'If you call an AI image generator, it might take 10 seconds to finish. Use a Wait node (10s) followed by a Status check to ensure the data is ready.'
                }
            ]
        }
    },
    {
        title: 'Merge Paths',
        description: 'Re-converges multiple branch paths into a single pipeline.',
        icon: ArrowRightLeft,
        howTo: [
            '1. Connect all divergent paths into the left-side of this node.',
            '2. Extract the unified output from the right.'
        ],
        deepDive: {
            overview: 'Merge Paths is the "Join" operation of the builder. It brings back together workflows that split at an If/Else or Condition node.',
            sections: [
                {
                    title: 'Consolidated Reporting',
                    content: 'If your workflow splits into "Success Path" and "Failure Path", you can use a Merge node at the end to send a single final notification regardless of which branch was taken.'
                }
            ]
        }
    },
    {
        title: 'Split In Batches',
        description: 'Throttles high-volume data arrays into smaller chunks.',
        icon: Database,
        howTo: [
            '1. Batch Size: Input the maximum number of items (e.g., 20).',
            '2. Processing: The node will iteratively trigger the downstream path until the array is exhausted.'
        ],
        deepDive: {
            overview: 'Batch processing is essential for handling large datasets (like 10,000 CRM contacts) without overwhelming external APIs or hitting timeouts.',
            sections: [
                {
                    title: 'Iterative Loops',
                    content: 'The "loop" handle on this node will re-fire for every batch. Once all items are processed, it exits via the "done" handle.'
                }
            ]
        }
    }
];

const systemPluginsCards = [
    {
        title: 'AI Model',
        description: 'Primary generative intelligence block.',
        icon: Bot,
        howTo: [
            '1. Select Task: Choose "Custom", "Summarize", or "Classify".',
            '2. Prompt: Write clear instructions using {{data}} to inject variables.'
        ],
        deepDive: {
            overview: 'The AI Model node provides access to state-of-the-art LLMs (Gemini, GPT, Claude). It is the "brain" of your workflow.',
            sections: [
                {
                    title: 'Prompt Engineering',
                    content: 'Use System Instructions to define the AI persona. Use the bracket syntax to dynamically pass data from previous steps into the prompt.'
                }
            ]
        }
    },
    {
        title: 'AI BPO Agent',
        description: 'Voice and Multimodal reasoning workforce.',
        icon: Phone,
        howTo: [
            '1. Configure Vapi ID: Connect your Vapi.ai account.',
            '2. Set Goal: Define what the agent should achieve on the call.'
        ],
        deepDive: {
            overview: 'The AI BPO Agent is a specialized node for voice-based interactions. It integrates seamlessly with telephony providers to provide human-like reasoning over the phone.',
            sections: [
                {
                    title: 'Real-time Reasoning',
                    content: 'The agent can perform lookups in your database *during* the call using integrated tools, providing the caller with dynamic, personalized information.'
                }
            ]
        }
    },
    {
        title: 'HTTP Request (Webhooks)',
        description: 'Connect to any external REST API.',
        icon: Globe,
        howTo: [
            '1. Method: Choose GET, POST, PUT, DELETE.',
            '2. URL: The target endpoint.',
            '3. Auth: Add headers or tokens as required.'
        ],
        deepDive: {
            overview: 'The HTTP Request node is your bridge to the entire internet. It can interact with any service that provides an API.',
            sections: [
                {
                    title: 'Authentication Protocol',
                    content: 'Supports Bearer Tokens, API Keys, and Basic Auth. You can pass these in headers or as query parameters depending on the service requirements.'
                }
            ]
        }
    },
    {
        title: 'Web Scraper: Ultra-Vision',
        description: 'Extract intelligence from any web architecture.',
        icon: Search,
        howTo: [
            '1. Target URL: The webpage you want to analyze.',
            '2. Extraction Rules: Define CSS selectors or use AI Auto-Detect.'
        ],
        deepDive: {
            overview: 'Our Web Scraper uses headless browser technology (Puppeteer/Playwright) to render pages exactly as a human would, including JavaScript-heavy SPAs.',
            sections: [
                {
                    title: 'Bypassing Protections',
                    content: 'Integrated proxy rotation and stealth headers ensure that your extraction tasks remain undetected by generic bot protection services.'
                }
            ]
        }
    },
    {
        title: 'User App UI',
        description: 'Render interactive forms for humans.',
        icon: LayoutPanelLeft,
        howTo: [
            '1. Add Fields: Define Label, Type (Text, Dropdown, File), and Validation.',
            '2. Flow Execution: Execution pauses until the human submits the generated form.'
        ],
        deepDive: {
            overview: 'The User App UI node transforms your automation into a software application. It pauses workflow execution and waits for human input via a professional web interface.',
            sections: [
                {
                    title: 'BPO Automation',
                    content: 'Ideal for approval steps or data entry where AI cannot be 100% reliable.'
                }
            ]
        }
    },
    {
        title: 'Python Script',
        description: 'Execute custom backend logic.',
        icon: FileCode,
        howTo: [
            '1. Code Editor: Write your script in the browser.',
            '2. Dependencies: List standard libraries needed.',
            '3. Output: Return a dictionary to pass data forward.'
        ],
        deepDive: {
            overview: 'For absolute control, the Python Script node allows you to execute arbitrary code safely in our sandboxed environment.',
            sections: [
                {
                    title: 'Data Science Ready',
                    content: 'Pre-loaded with Pandas, NumPy, and Scikit-learn for advanced data manipulation or machine learning tasks within your workflow.'
                }
            ]
        }
    },
    {
        title: 'SQL / Database',
        description: 'Direct Read/Write to your architecture.',
        icon: Database,
        howTo: [
            '1. Connect: Add your DB credentials.',
            '2. Query: Write structured SQL (SELECT, INSERT, UPDATE).'
        ],
        deepDive: {
            overview: 'Interact directly with PostgreSQL, MySQL, or MongoDB. This node allows you to build workflows that act as the middlelayer between your production database and other cloud services.',
            sections: [
                {
                    title: 'Secure Parameterization',
                    content: 'Supports prepared statements to prevent SQL injection when using dynamic variables in your queries.'
                }
            ]
        }
    },
    {
        title: 'Google Sheets',
        description: 'Read and Write row-based data to your cloud spreadsheets.',
        icon: FileCode,
        howTo: [
            '1. Auth: Connect your Google account.',
            '2. Mode: Append Row, Update Row, or Get Sheet Data.'
        ],
        deepDive: {
            overview: 'Google Sheets is the most common interface for non-technical users. This node allows you to use a spreadsheet as your workflow\'s database or reporting dashboard.',
            sections: [
                {
                    title: 'A1 Notation',
                    content: 'You can target specific cells or ranges (e.g., A1:B10) for surgical data extraction.'
                }
            ]
        }
    },
    {
        title: 'CRM Connector',
        description: 'Sync customer data with Hubspot or Salesforce.',
        icon: Server,
        howTo: [
            '1. Search: Lookup by Email or Phone.',
            '2. Update: Sync workflow results back to the lead record.'
        ],
        deepDive: {
            overview: 'Keep your sales team up to date. This node automatically handles OAuth flow with major CRMs to ensure your AI has the context of every previous customer interaction.',
            sections: [
                {
                    title: 'Lead Enrichment',
                    content: 'Upon receiving a webhook, the workflow can query the CRM, retrieve the "Lifecycle Stage", and use that to branch the AI\'s reasoning.'
                }
            ]
        }
    },
    {
        title: 'Export / End',
        description: 'Terminal node that returns data to the caller.',
        icon: Zap,
        howTo: [
            '1. Output Map: Define the final JSON object to return.',
            '2. Status code: Set to 200 (Success) or 4xx (Error).'
        ],
        deepDive: {
            overview: 'The Export node is the exit point of your workflow. It stops execution and returns the final payload to the original requester (webhook caller or app UI).',
            sections: [
                {
                    title: 'Completion Response',
                    content: 'Whatever data is passed into this node becomes the response body of the original trigger request, closing the loop of the automation.'
                }
            ]
        }
    }
];


export default function KnowledgeBase() {
    const [selectedCategory, setSelectedCategory] = useState("Process Builder Nodes Details");
    const [selectedTab, setSelectedTab] = useState("Core Logic");
    const [dbContent, setDbContent] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDeepDive, setSelectedDeepDive] = useState(null);

    const fetchKnowledgeBase = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const res = await fetch(`${baseUrl}/api/knowledge-base.php`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 'success' && data.data && data.data.length > 0) {
                // Convert array of rows [{section_id: 'core', content_json: '...'}] to a JS object map
                const mappedContent = {};
                data.data.forEach(row => {
                    try {
                        mappedContent[row.section_id] = JSON.parse(row.content_json);
                    } catch (e) { console.error("Parse error for sections", e); }
                });
                setDbContent(mappedContent);
            }
        } catch (err) {
            console.error("Failed to fetch Knowledge Base from DB", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKnowledgeBase();
    }, []);

    // Format DB response to match our local UI components (mapping specific string icons back to Lucide components if needed)
    const mapIconString = (iconName) => {
        const iconMap = {
            'Zap': Zap,
            'Activity': Activity,
            'Shield': Shield,
            'Link': Link,
            'Clock': Clock,
            'ArrowRightLeft': Layers,
            'Database': Database,
            'Brain': Cpu,
            'Monitor': Globe,
            'Search': Search,
            'Webhook': Globe,
            'Terminal': Code,
            'FileCode': FileCode,
            'Cloud': Database,
            'Save': Database,
            'Wand2': Edit2
        };
        return iconMap[iconName] || HelpCircle;
    };

    const renderCards = () => {
        if (loading) return <div className="flex items-center justify-center h-64"><p className="text-slate-500 animate-pulse">Loading intelligence...</p></div>;

        let cardsToRender = [];
        // Map database keys: 'core', 'flow', 'plugins', 'builder'
        if (selectedTab === 'Core Logic') {
            cardsToRender = dbContent['core'] ? dbContent['core'] : coreLogicCards;
        } else if (selectedTab === 'Flow Control') {
            cardsToRender = dbContent['flow'] ? dbContent['flow'] : flowControlCards;
        } else if (selectedTab === 'System Plugins') {
            cardsToRender = dbContent['plugins'] ? dbContent['plugins'] : systemPluginsCards;
        } else if (selectedTab === 'Builder Features') {
            cardsToRender = dbContent['builder'] ? dbContent['builder'] : [];
        } else {
            cardsToRender = [];
        }

        if (cardsToRender.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <HelpCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p>Documentation for {selectedTab} is being updated.</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cardsToRender.map((card, i) => {
                    // Check if it's from DB (string icon) or local (functional/element icon)
                    const IconToRender = typeof card.icon === 'string' ? mapIconString(card.icon) : (typeof card.icon === 'function' ? card.icon : card.icon);
                    return (
                        <div key={i} className="glass-effect bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-4 shadow-xl hover:border-primary/30 transition-all hover:bg-slate-900/60 relative overflow-hidden group">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-card border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                                    <IconToRender className={`w-5 h-5 ${card.color || 'text-amber-500'}`} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">{card.title}</h3>
                                    <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{card.description}</p>
                                </div>
                            </div>

                            {/* Render "HOW TO CONFIGURE" differently based on if it's an Array (local file) or string inside description (seeded DB) */}
                            {card.howTo && (
                                <div className="pt-4 border-t border-white/5 space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">HOW TO CONFIGURE:</h4>
                                    <div className="space-y-1">
                                        {(Array.isArray(card.howTo) ? card.howTo : [card.howTo]).map((step, idx) => (
                                            <p key={idx} className="text-xs text-slate-300 leading-relaxed">{step}</p>
                                        ))}
                                    </div>

                                    {card.proTip && (
                                        <p className="text-xs text-slate-300 leading-relaxed mt-4">
                                            <span className="font-bold text-slate-400 uppercase">PRO TIP: </span>
                                            {card.proTip}
                                        </p>
                                    )}

                                    {card.action && (
                                        <p className="text-xs text-slate-300 leading-relaxed mt-4">
                                            <span className="font-bold text-slate-400 uppercase">ACTION: </span>
                                            {card.action}
                                        </p>
                                    )}

                                    {card.useCase && (
                                        <p className="text-xs text-slate-300 leading-relaxed mt-4">
                                            <span className="font-bold text-slate-400 uppercase">USE CASE: </span>
                                            {card.useCase}
                                        </p>
                                    )}
                                </div>
                            )}

                            {card.deepDive && (
                                <div className="pt-4 border-t border-white/5 mt-4">
                                    <Button onClick={() => setSelectedDeepDive(card)} className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-widest text-[10px] h-10 transition-all">
                                        📖 Read Full Enterprise Manual
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto p-6 lg:p-10 pb-20 custom-scrollbar bg-background font-sans relative">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -mt-40 -mr-40" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 mb-12">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <Layers className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Enterprise Knowledge Base</h1>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search knowledge articles..."
                            className="w-full bg-card border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all text-white placeholder:text-slate-500 shadow-inner"
                        />
                    </div>
                    <Button variant="outline" className="rounded-full border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 font-medium h-10 px-6 gap-2">
                        <Edit2 className="w-4 h-4" /> Edit Database
                    </Button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                {/* Sidebar Categories */}
                <div className="w-full lg:w-64 shrink-0 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-4">Knowledge Categories</h4>
                    <div className="space-y-2">
                        {["Process Builder Nodes Details", "Getting Started Guide", "Integrations & APIs"].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                                    selectedCategory === cat
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {cat === "Process Builder Nodes Details" && <Zap className={cn("w-4 h-4", selectedCategory === cat ? "text-white" : "text-slate-500")} />}
                                {cat === "Getting Started Guide" && <HelpCircle className={cn("w-4 h-4", selectedCategory === cat ? "text-white" : "text-slate-500")} />}
                                {cat === "Integrations & APIs" && <Server className={cn("w-4 h-4", selectedCategory === cat ? "text-white" : "text-slate-500")} />}
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 space-y-8">
                    {/* Tabs */}
                    <div className="flex flex-wrap items-center gap-2 bg-slate-900/50 p-1.5 rounded-full border border-white/5 w-fit">
                        {["Core Logic", "Flow Control", "System Plugins", "Builder Features", "Detailed Directory"].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={cn(
                                    "px-5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                                    selectedTab === tab
                                        ? "bg-slate-800 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                {tab === 'Core Logic' && <Settings className="w-3.5 h-3.5" />}
                                {tab === 'Flow Control' && <Activity className="w-3.5 h-3.5" />}
                                {tab === 'System Plugins' && <Globe className="w-3.5 h-3.5" />}
                                {tab === 'Builder Features' && <Edit2 className="w-3.5 h-3.5" />}
                                {tab === 'Detailed Directory' && <ChevronRight className="w-3.5 h-3.5" />}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="min-h-[400px]">
                        {renderCards()}
                    </div>
                </div>
            </div>

            {/* Deep Dive Modal */}
            {selectedDeepDive && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="w-full max-w-3xl h-full bg-slate-900 border-l border-white/10 shadow-3xl flex flex-col relative"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] pointer-events-none" />

                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                                    {typeof selectedDeepDive.icon === 'string' ?
                                        React.createElement(mapIconString(selectedDeepDive.icon), { className: "w-6 h-6 text-amber-500" }) :
                                        (typeof selectedDeepDive.icon === 'function' ? <selectedDeepDive.icon /> : <selectedDeepDive.icon className="w-6 h-6 text-amber-500" />)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{selectedDeepDive.title} Protocol Guide</h2>
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] relative -top-1">Enterprise Documentation</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDeepDive(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white group">
                                <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar relative z-10">
                            {selectedDeepDive.deepDive?.overview && (
                                <div className="glass-effect p-8 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 shadow-2xl shadow-blue-500/5">
                                    <h3 className="text-xs font-black text-blue-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Zap className="w-4 h-4" /> Overview
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">{selectedDeepDive.deepDive.overview}</p>
                                </div>
                            )}

                            {selectedDeepDive.deepDive?.sections?.map((section, idx) => (
                                <div key={idx} className="space-y-6">
                                    <h3 className="text-xl font-black text-white flex items-center gap-4 tracking-tight">
                                        <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-500 border border-white/5">0{idx + 1}</span>
                                        {section.title}
                                    </h3>
                                    <div className="pl-[2.25rem]">
                                        <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-10 border-t border-white/5 flex justify-center">
                                <Button onClick={() => setSelectedDeepDive(null)} variant="outline" className="rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 px-8">Close Documentation</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
