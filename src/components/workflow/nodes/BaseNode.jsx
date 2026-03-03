import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import * as LucideIcons from 'lucide-react';

const BaseNode = ({ id, data, selected, icon, title, colorClass, borderClass, bgClass, shadowClass, children, helpText }) => {
    // Safely resolve the icon:
    // 1. If 'icon' is a string (e.g., "Activity"), look it up in LucideIcons.
    // 2. If it's already a component, use it.
    // 3. Fallback to HelpCircle if nothing is found.
    const IconComponent = (typeof icon === 'string' ? LucideIcons[icon] : icon) || LucideIcons.HelpCircle;

    return (
        <div className={`relative min-w-[280px] rounded-xl border-2 transition-all duration-300 ${selected ? `${borderClass} ${shadowClass} scale-105 z-50` : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'} backdrop-blur-xl group`}>
            {/* Visual Header */}
            <div className={`flex items-center justify-between p-3 rounded-t-xl ${bgClass} border-b border-white/5`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-white/10 ${colorClass}`}>
                        <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-200 tracking-wide font-outfit">{data.label || title}</h3>
                        <p className="text-[10px] text-slate-400 font-medium">{title}</p>
                    </div>
                </div>
                {/* Node Status Indicator */}
                {data.status && (
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 status-indicator ${data.status}`} title={`Status: ${data.status}`}></div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4 bg-slate-900/60 rounded-b-xl relative overflow-hidden">
                {/* Subtle Grid Background for content area */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

                <div className="relative z-10 space-y-2">
                    {children}
                </div>
            </div>

            {/* Connection Handles - Moved outside overflow-hidden to prevent clipping */}
            {!data.isEntry && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="w-4 h-4 !bg-slate-800 border-2 !border-slate-500 hover:!bg-slate-500 hover:scale-125 transition-all -ml-2 z-50"
                />
            )}
            {!data.isEnd && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className={`w-4 h-4 !bg-slate-800 border-2 ${borderClass.replace('border', '!border')} hover:!bg-white hover:scale-125 transition-all -mr-2 z-50`}
                />
            )}

            {/* Custom Output Handles based on routing (e.g. ifNode) */}
            {data.routes && data.routes.map((route, i) => (
                <Handle
                    key={route.id}
                    type="source"
                    position={Position.Right}
                    id={route.id}
                    style={{ top: `${50 + (i * 20)}%` }}
                    className={`w-4 h-4 !bg-slate-800 border-2 ${route.colorClass || borderClass.replace('border', '!border')} hover:!bg-white hover:scale-125 transition-all -mr-2 z-50`}
                />
            ))}

            {/* Context Tooltip Hint */}
            {helpText && selected && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-xs text-slate-300 py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in duration-200 z-50 flex items-center gap-1.5">
                    <HelpCircle className="w-3 h-3" /> {helpText}
                </div>
            )}
        </div>
    );
};

export default memo(BaseNode);
