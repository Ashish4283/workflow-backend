import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { 
    Database, Plus, X, Eye, EyeOff, Asterisk, 
    Settings2, ChevronDown, ChevronRight, GripVertical, 
    Wand2, Trash2, LayoutPanelTop, Layers, MoveRight,
    Search, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SchemaDesigner = ({ workflow, onUpdate }) => {
    // Schema structure: { root: { label: '', fields: [] }, children: [{ label: '', fields: [] }] }
    const [schema, setSchema] = useState(workflow?.schema || {
        root: { id: 'root', label: 'Base Configuration', fields: [] },
        children: []
    });

    const [collapsed, setCollapsed] = useState({});

    const handleUpdate = (newSchema) => {
        setSchema(newSchema);
        onUpdate(newSchema);
    };

    const addField = (groupId, isRoot = false) => {
        const newField = {
            id: 'field_' + Math.random().toString(36).substr(2, 9),
            label: '',
            key: '',
            type: 'text',
            required: true,
            visible: true,
            isAI: false
        };

        const newSchema = { ...schema };
        if (isRoot) {
            newSchema.root.fields = [...(newSchema.root.fields || []), newField];
        } else {
            const childIdx = newSchema.children.findIndex(c => c.id === groupId);
            if (childIdx !== -1) {
                newSchema.children[childIdx].fields = [...(newSchema.children[childIdx].fields || []), newField];
            }
        }
        handleUpdate(newSchema);
    };

    const updateField = (groupId, fieldId, updates, isRoot = false) => {
        const newSchema = { ...schema };
        let fields = isRoot ? newSchema.root.fields : newSchema.children.find(c => c.id === groupId)?.fields;
        
        if (fields) {
            const fieldIdx = fields.findIndex(f => f.id === fieldId);
            if (fieldIdx !== -1) {
                fields[fieldIdx] = { ...fields[fieldIdx], ...updates };
                // Auto-generate key if label changes and key is empty or looks like an old key
                if (updates.label && (!fields[fieldIdx].key || fields[fieldIdx].key === updates.label.toLowerCase().replace(/\s+/g, '_'))) {
                    fields[fieldIdx].key = updates.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                }
            }
        }
        handleUpdate(newSchema);
    };

    const removeField = (groupId, fieldId, isRoot = false) => {
        const newSchema = { ...schema };
        if (isRoot) {
            newSchema.root.fields = newSchema.root.fields.filter(f => f.id !== fieldId);
        } else {
            const childIdx = newSchema.children.findIndex(c => c.id === groupId);
            if (childIdx !== -1) {
                newSchema.children[childIdx].fields = newSchema.children[childIdx].fields.filter(f => f.id !== fieldId);
            }
        }
        handleUpdate(newSchema);
    };

    const addChildGroup = () => {
        const newGroup = {
            id: 'child_' + Math.random().toString(36).substr(2, 9),
            label: 'New Child Structure',
            fields: []
        };
        handleUpdate({ ...schema, children: [...schema.children, newGroup] });
    };

    const removeChildGroup = (id) => {
        handleUpdate({ ...schema, children: schema.children.filter(c => c.id !== id) });
    };

    const GroupFields = ({ group, isRoot = false }) => (
        <div className={`flex flex-col gap-1 ${!isRoot ? 'ml-4 border-l-2 border-slate-800 pl-4' : ''}`}>
             <div className="flex items-center justify-between py-2 group/header">
                <div className="flex items-center gap-2 flex-1">
                    <div className="cursor-pointer" onClick={() => setCollapsed({...collapsed, [group.id]: !collapsed[group.id]})}>
                        {collapsed[group.id] ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                    <input 
                        className={`bg-transparent border-none text-sm font-black uppercase tracking-tight focus:outline-none flex-1 placeholder:text-slate-700 ${isRoot ? 'text-blue-400' : 'text-emerald-400'}`}
                        value={group.label}
                        placeholder={isRoot ? "Root Collection Name" : "Dependent Record Name"}
                        onChange={(e) => {
                            const newSchema = { ...schema };
                            if (isRoot) newSchema.root.label = e.target.value;
                            else newSchema.children.find(c => c.id === group.id).label = e.target.value;
                            handleUpdate(newSchema);
                        }}
                    />
                    {isRoot && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-black">ROOT</span>}
                </div>
                {!isRoot && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover/header:opacity-100" onClick={() => removeChildGroup(group.id)}>
                        <Trash2 className="w-3 h-3 text-rose-500" />
                    </Button>
                )}
             </div>

             {!collapsed[group.id] && (
                <div className="space-y-2 mb-4">
                    <Reorder.Group axis="y" values={group.fields || []} onReorder={(newFields) => {
                        const newSchema = { ...schema };
                        if (isRoot) newSchema.root.fields = newFields;
                        else {
                            const idx = newSchema.children.findIndex(c => c.id === group.id);
                            newSchema.children[idx].fields = newFields;
                        }
                        handleUpdate(newSchema);
                    }}>
                        {(group.fields || []).map((field, idx) => (
                            <Reorder.Item key={field.id} value={field} className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded group/field">
                                <GripVertical className="w-3 h-3 text-slate-700 cursor-grab active:cursor-grabbing" />
                                <input 
                                    className="flex-1 bg-transparent border-none text-xs text-slate-200 focus:outline-none placeholder:text-slate-600"
                                    placeholder="Enter header name..."
                                    value={field.label}
                                    onChange={(e) => updateField(group.id, field.id, { label: e.target.value }, isRoot)}
                                />
                                <div className="flex items-center gap-1">
                                    <button onClick={() => updateField(group.id, field.id, { isAI: !field.isAI }, isRoot)} className={`p-1 rounded transition-colors ${field.isAI ? 'bg-amber-500/10 text-amber-500' : 'text-slate-700 hover:text-slate-400'}`} title="AI/Manual Toggle"><Wand2 className="w-3 h-3" /></button>
                                    <button onClick={() => updateField(group.id, field.id, { required: !field.required }, isRoot)} className={`p-1 rounded transition-colors ${field.required ? 'bg-rose-500/10 text-rose-500' : 'text-slate-700 hover:text-slate-400'}`} title="Mark Required"><Asterisk className="w-3 h-3" /></button>
                                    <button onClick={() => updateField(group.id, field.id, { visible: !field.visible }, isRoot)} className={`p-1 rounded transition-colors ${field.visible ? 'text-slate-400' : 'text-slate-700'}`} title="Visibility Toggle">{field.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}</button>
                                    <button onClick={() => removeField(group.id, field.id, isRoot)} className="p-1 rounded hover:bg-rose-500/10 text-slate-700 hover:text-rose-500"><X className="w-3 h-3" /></button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                    
                    <button 
                        onClick={() => addField(group.id, isRoot)}
                        className="w-full py-2 border border-dashed border-slate-800 rounded text-[10px] text-slate-500 uppercase font-black tracking-widest hover:border-slate-700 hover:text-slate-400 transition-all"
                    >
                        + Add Column Header
                    </button>
                </div>
             )}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white">
            <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Layers className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Process Architecture</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-80">Define Variables & Relational Hierarchy</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                        <Search className="w-3 h-3 mr-2" /> Sync From Spreadsheet
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                {/* Intro Tooltip */}
                <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl backdrop-blur-md">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                        <span className="text-blue-400 font-black uppercase tracking-widest text-[9px] block mb-1">Architecture Note:</span>
                        Define "Independent" variables in the <span className="text-blue-400 font-black">Root</span> tier. Meta-properties belonging to the global process live here. Individual row-level data should be mapped to <span className="text-emerald-400 font-black">Dependent</span> structures.
                    </p>
                </div>

                {/* The Designer Tree */}
                <div className="space-y-6">
                    <GroupFields group={schema.root} isRoot={true} />

                    {schema.children.map(child => (
                        <div key={child.id} className="relative pt-4">
                            <div className="absolute left-[9px] top-0 h-4 border-l-2 border-slate-800" />
                            <GroupFields group={child} />
                        </div>
                    ))}

                    <button 
                        onClick={addChildGroup}
                        className="ml-8 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all flex items-center gap-2"
                    >
                        <LayoutPanelTop className="w-4 h-4" /> + Add Dependent Record Structure
                    </button>
                </div>
            </div>

            <div className="p-6 border-t border-white/5 shrink-0 bg-black/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Mapping Schema Validated</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-600 leading-tight">
                    Note: Changes to the schema will automatically update the variable pickers in AI, Python, and QA nodes across the process.
                </p>
            </div>
        </div>
    );
};

export default SchemaDesigner;
