import React, { memo } from 'react';
import BaseNode from './BaseNode';
import { PlayCircle, Zap, FileText, Download, Box, Database, Terminal, FileSpreadsheet, Bot, Wand2, Activity, Globe, Send, Image, LayoutPanelLeft, Phone, MessageSquare, Clock, Users, GitMerge, Search, ArrowRightLeft, CheckCircle } from 'lucide-react';

const NODE_TYPES = {
    // TRIGGERS
    default: { icon: Zap, title: 'Start Trigger', colors: { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' }, isEntry: true },
    webhookNode: { icon: Globe, title: 'Webhook Trigger', colors: { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500/10', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' }, isEntry: true },
    appNode: { icon: LayoutPanelLeft, title: 'User App UI', colors: { border: 'border-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' }, help: "Creates an interactive form for end users" },

    // AI / BPO / PROCESSING
    aiNode: { icon: Bot, title: 'AI Model', colors: { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' }, help: "Runs generative AI tasks" },
    vapiBpoNode: { icon: Phone, title: 'AI BPO Agent', colors: { border: 'border-blue-400', text: 'text-blue-300', bg: 'bg-blue-400/10', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' }, help: "Configures a Voice AI agent via Vapi" },
    pythonNode: { icon: Terminal, title: 'Python Script', colors: { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' } },
    logicNode: { icon: Activity, title: 'Logic Gate (Legacy)', colors: { border: 'border-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10', shadow: 'shadow-[0_0_15px_rgba(100,116,139,0.3)]' }, routes: [{ id: 'true', colorClass: '!border-green-500' }, { id: 'false', colorClass: '!border-red-500' }] },
    ifNode: { icon: Activity, title: 'If / Else', colors: { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500/10', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' }, routes: [{ id: 'true', colorClass: '!border-green-500' }, { id: 'false', colorClass: '!border-red-500' }] },
    conditionNode: { icon: GitMerge, title: 'Adv. Condition', colors: { border: 'border-sky-500', text: 'text-sky-400', bg: 'bg-sky-500/10', shadow: 'shadow-[0_0_15px_rgba(14,165,233,0.3)]' }, routes: [{ id: 'match', colorClass: '!border-green-500' }, { id: 'default', colorClass: '!border-slate-500' }] },
    memoryNode: { icon: Database, title: 'Persistent Memory', colors: { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' } },
    workflowToolNode: { icon: Wand2, title: 'Recruit Workflow', colors: { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' } },
    mediaConvert: { icon: Image, title: 'Media Converter', colors: { border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' } },
    delayNode: { icon: Clock, title: 'Wait / Delay', colors: { border: 'border-slate-400', text: 'text-slate-300', bg: 'bg-slate-400/10', shadow: 'shadow-[0_0_15px_rgba(148,163,184,0.3)]' } },

    waitNode: { icon: Clock, title: 'Wait / Delay', colors: { border: 'border-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]' } },
    mergeNode: { icon: ArrowRightLeft, title: 'Merge Paths', colors: { border: 'border-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]' } },
    batchNode: { icon: Activity, title: 'Split In Batches', colors: { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' } },

    // INTEGRATIONS & OUTPUT
    httpRequestNode: { icon: Globe, title: 'HTTP Request', colors: { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' } },
    sqlNode: { icon: Database, title: 'SQL Query', colors: { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]' } },
    googleSheetsNode: { icon: FileSpreadsheet, title: 'Google Sheets', colors: { border: 'border-emerald-600', text: 'text-emerald-500', bg: 'bg-emerald-600/10', shadow: 'shadow-[0_0_15px_rgba(5,150,105,0.3)]' } },
    emailNode: { icon: Send, title: 'Send Email', colors: { border: 'border-red-500', text: 'text-red-400', bg: 'bg-red-500/10', shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' } },
    smsNode: { icon: MessageSquare, title: 'Send SMS', colors: { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-500/10', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.3)]' } },
    crmNode: { icon: Users, title: 'CRM Lookup', colors: { border: 'border-blue-400', text: 'text-blue-300', bg: 'bg-blue-400/10', shadow: 'shadow-[0_0_15px_rgba(96,165,250,0.3)]' } },
    browserNode: { icon: Search, title: 'Web Scraper', colors: { border: 'border-orange-400', text: 'text-orange-300', bg: 'bg-orange-400/10', shadow: 'shadow-[0_0_15px_rgba(251,146,60,0.3)]' } },
    exportNode: { icon: Download, title: 'Export / End', colors: { border: 'border-teal-500', text: 'text-teal-400', bg: 'bg-teal-500/10', shadow: 'shadow-[0_0_15px_rgba(20,184,166,0.3)]' }, isEnd: true },
    widgetNode: { icon: Box, title: 'PWA Widget', colors: { border: 'border-pink-500', text: 'text-pink-400', bg: 'bg-pink-500/10', shadow: 'shadow-[0_0_15px_rgba(236,72,153,0.3)]' }, help: "Interactive UI widget for PWAs" },
    mappingNode: { icon: ArrowRightLeft, title: 'Data Mapper', colors: { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' }, help: "Map source columns to target fields" },
    qaNode: { icon: CheckCircle, title: 'Human QA Pool', colors: { border: 'border-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' }, help: "Multi-row spreadsheet review tasks" },
    billingNode: { icon: Activity, title: 'Billing Control', colors: { border: 'border-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]' }, help: "Track COGS, Revenue and Profits" },
    // UTILS
    setNode: { icon: Box, title: 'Set Variable', colors: { border: 'border-slate-400', text: 'text-slate-300', bg: 'bg-slate-400/10', shadow: 'shadow-[0_0_15px_rgba(148,163,184,0.3)]' } },
    fileNode: { icon: FileText, title: 'Read File', colors: { border: 'border-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10', shadow: 'shadow-[0_0_15px_rgba(100,116,139,0.3)]' } }
};

const WorkflowNode = ({ id, data, selected }) => {
    // Fallback to a generic node type if not found
    const typeDef = NODE_TYPES[data.type] || { icon: Box, title: 'Generic Node', colors: { border: 'border-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10', shadow: 'shadow-[0_0_15px_rgba(100,116,139,0.3)]' } };

    // Determine dynamic properties
    let routes = typeDef.routes;
    if (data.type === 'logicNode' || data.type === 'ifNode') {
        routes = [{ id: 'true', colorClass: '!border-green-500' }, { id: 'false', colorClass: '!border-red-500' }];
    } else if (data.type === 'conditionNode') {
        routes = [{ id: 'match', colorClass: '!border-sky-500' }, { id: 'default', colorClass: '!border-slate-500' }];
    }

    return (
        <BaseNode
            id={id}
            data={{ ...data, isEntry: typeDef.isEntry, isEnd: typeDef.isEnd, routes }}
            selected={selected}
            icon={typeDef.icon}
            title={typeDef.title}
            colorClass={typeDef.colors.text}
            borderClass={typeDef.colors.border}
            bgClass={typeDef.colors.bg}
            shadowClass={typeDef.colors.shadow}
            helpText={typeDef.help}
        >
            {/* Contextual content inside the node based on type */}
            <div className="flex flex-col gap-1.5">
                {data.type === 'default' && data.triggerType && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Type:</span> <span className="text-amber-400">{data.triggerType.toUpperCase()}</span>
                    </div>
                )}

                {data.type === 'appNode' && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800">
                        {data.fields?.length || 0} fields configured
                    </div>
                )}

                {data.type === 'aiNode' && data.taskType && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Task:</span> <span className="text-violet-400">{data.taskType}</span>
                    </div>
                )}

                {data.type === 'vapiBpoNode' && data.agentName && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Agent:</span> <span className="text-indigo-400 font-bold">{data.agentName}</span>
                    </div>
                )}

                {data.type === 'httpRequestNode' && data.url && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 truncate" title={data.url}>
                        {data.method || 'GET'} {new URL(data.url).hostname}
                    </div>
                )}

                {data.type === 'exportNode' && data.destination && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>To:</span> <span className="text-teal-400 hover:text-teal-300">{data.destination}</span>
                    </div>
                )}

                {data.type === 'mediaConvert' && data.targetFormat && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Output:</span> <span className="text-cyan-400 uppercase">{data.targetFormat}</span>
                    </div>
                )}

                {data.type === 'ifNode' && data.operator && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between gap-2 overflow-hidden">
                        <span className="truncate">{data.value1}</span>
                        <span className="text-indigo-400">{data.operator}</span>
                        <span className="truncate">{data.value2}</span>
                    </div>
                )}

                {data.type === 'conditionNode' && data.key && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between gap-2 overflow-hidden">
                        <span className="text-sky-400 font-bold">MATCH:</span>
                        <span className="truncate">{data.key}</span>
                        <span className="text-sky-400 font-bold">==</span>
                        <span className="truncate">{data.value}</span>
                    </div>
                )}

                {data.type === 'memoryNode' && data.operation && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span className="capitalize">{data.operation}:</span> <span className="text-amber-400 truncate ml-2 font-bold">{data.key}</span>
                    </div>
                )}

                {data.type === 'crmNode' && data.lookupField && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Lookup:</span> <span className="text-blue-400 font-bold">{data.lookupField}</span>
                    </div>
                )}

                {data.type === 'smsNode' && data.to && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 truncate">
                        <span className="text-green-400">SMS to:</span> {data.to}
                    </div>
                )}

                {data.type === 'waitNode' && data.delay && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Wait:</span> <span className="text-rose-400 font-bold">{data.delay}{data.unit?.[0] || 's'}</span>
                    </div>
                )}

                {data.type === 'mergeNode' && data.mode && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Mode:</span> <span className="text-cyan-400 font-bold capitalize">{data.mode}</span>
                    </div>
                )}

                {data.type === 'batchNode' && data.batchSize && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Size:</span> <span className="text-emerald-400 font-bold">{data.batchSize} items</span>
                    </div>
                )}

                {data.type === 'browserNode' && data.action && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Browser:</span> <span className="text-orange-400">{data.action.toUpperCase()}</span>
                    </div>
                )}
                {data.type === 'widgetNode' && data.widgetType && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Widget:</span> <span className="text-pink-400 uppercase font-black">{data.widgetType}</span>
                    </div>
                )}
                {data.type === 'billingNode' && data.ratePerUnit && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Rate:</span> <span className="text-rose-400 font-black">${data.ratePerUnit}/unit</span>
                    </div>
                )}
                {data.type === 'qaNode' && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Review:</span> <span className="text-amber-400 font-black">GRID EDIT</span>
                    </div>
                )}

                {data.type === 'workflowToolNode' && data.workflowId && (
                    <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded border border-slate-800 flex justify-between">
                        <span>Run ID:</span> <span className="text-violet-400 font-bold ml-2 truncate">{data.workflowId.substring(0, 8)}...</span>
                    </div>
                )}

                {/* Show short note if added */}
                {data.note && (
                    <div className="text-[10px] text-slate-500 italic mt-1 pb-1 border-b border-white/5 border-dashed">
                        {data.note}
                    </div>
                )}
            </div>
        </BaseNode>
    );
};

export default memo(WorkflowNode);
