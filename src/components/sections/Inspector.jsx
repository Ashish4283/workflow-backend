import React, { useState, useEffect } from 'react';
import { Trash2, X, Sliders, ArrowRightLeft, Activity, FileJson, File, Link2, Calendar, PlayCircle, Table, CheckCircle, XCircle, CheckCircle2, X as XIcon, Columns, ArrowRight, Mail, Webhook, FileSpreadsheet, Upload, Cloud, Plus, Minus, Download, FolderOpen, LogOut, Check, Wand2, Eraser, Database, Brain, Monitor, Layout, MessageSquare, Eye, FileText, Terminal, Copy, GripVertical, HelpCircle, BookOpen, GraduationCap, ChevronLeft, Clock, Loader2, Phone, Users, Search, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reorder, useDragControls } from 'framer-motion';
import HelpTooltip from '../workflow/panels/HelpTooltip';
import FieldItem from '../workflow/panels/FieldItem';
import { MOCK_DRIVE_FILES, MOCK_PREVIEW_ROWS, AI_TEMPLATES, TUTORIALS } from '@/lib/constants';


export default function Inspector({ selectedNode, setNodes, setSelectedNode, nodeResults, savedWorkflows = [] }) {
    const [activeTab, setActiveTab] = useState('config');
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [activeTutorial, setActiveTutorial] = useState(null);

    // Ensure fields have IDs for drag and drop
    useEffect(() => {
        if (selectedNode?.data?.type === 'appNode' && selectedNode.data.fields) {
            const fields = selectedNode.data.fields;
            let changed = false;
            const newFields = fields.map(f => {
                if (f && !f.id) {
                    changed = true;
                    return { ...f, id: `f_${Math.random().toString(36).substr(2, 9)}` };
                }
                return f;
            });
            if (changed) {
                handleChange('fields', newFields);
            }
        }
    }, [selectedNode?.id]); // Only run when node ID changes

    if (!selectedNode) return null;

    const handleChange = (key, value) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    const updatedNode = {
                        ...node,
                        data: { ...node.data, [key]: value },
                    };
                    setSelectedNode(updatedNode);
                    return updatedNode;
                }
                return node;
            })
        );
    };

    const handleBulkDataChange = (data) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    const updatedNode = {
                        ...node,
                        data: { ...node.data, ...data },
                    };
                    setSelectedNode(updatedNode);
                    return updatedNode;
                }
                return node;
            })
        );
    };

    const handleTopLevelChange = (key, value) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    const updatedNode = { ...node, [key]: value };
                    setSelectedNode(updatedNode);
                    return updatedNode;
                }
                if (key === 'entry' && value === true) {
                    return { ...node, entry: false };
                }
                return node;
            })
        );
    };

    const handleDelete = () => {
        setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
        setSelectedNode(null);
    };

    // Helper for dynamic list management (e.g. Column Mapping, Input Variables)
    const addListItem = (field, newItem) => {
        const list = selectedNode.data[field] || [];
        handleChange(field, [...list, newItem]);
    };

    const updateListItem = (field, index, key, value) => {
        const list = [...(selectedNode.data[field] || [])];
        list[index] = { ...list[index], [key]: value };
        handleChange(field, list);
    };

    const toggleExpression = (key) => {
        const isExpr = selectedNode.data[`_isExpr_${key}`];
        handleChange(`_isExpr_${key}`, !isExpr);
    };

    const renderParam = (label, key, placeholder, type = 'text', options = null) => {
        const isExpr = selectedNode.data[`_isExpr_${key}`];
        const value = selectedNode.data[key] || '';

        return (
            <div className="space-y-1 group">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</label>
                    <button
                        onClick={() => toggleExpression(key)}
                        className={`p-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${isExpr ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        title="Toggle Expression Mode"
                    >
                        {isExpr ? 'Expression' : 'Fixed'}
                    </button>
                </div>

                {isExpr ? (
                    <div className="relative group/expr">
                        <div className="absolute left-2 top-2 text-indigo-500"><Terminal className="w-3 h-3" /></div>
                        <textarea
                            className="w-full bg-slate-950 border border-indigo-500/30 rounded p-2 pl-7 text-xs font-mono text-indigo-300 focus:border-indigo-500 focus:outline-none min-h-[40px] resize-none"
                            placeholder="{{ data.variable }}"
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                        />
                    </div>
                ) : (
                    <>
                        {options ? (
                            <select
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                                value={value}
                                onChange={(e) => handleChange(key, e.target.value)}
                            >
                                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        ) : (
                            <input
                                type={type}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:border-primary focus:outline-none"
                                placeholder={placeholder}
                                value={value}
                                onChange={(e) => handleChange(key, e.target.value)}
                            />
                        )}
                    </>
                )}
            </div>
        );
    };

    const removeListItem = (field, index) => {
        const list = [...(selectedNode.data[field] || [])];
        list.splice(index, 1);
        handleChange(field, list);
    };

    // Helper to generate variable keys from labels
    const generateVarName = (label) => {
        return label?.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^_+|_+$/g, '') || 'field_name';
    };

    // Helper to generate mock output for preview
    const generateMockOutput = (data) => {
        if (data.fields && data.fields.length > 0) {
            const output = {};
            data.fields.forEach(f => {
                const key = f?.key || generateVarName(f?.label);
                if (['file', 'image', 'audio', 'video', 'pdf', 'document', 'spreadsheet'].includes(f?.type)) {
                    if (f?.type === 'pdf') output[key] = [{ name: 'document.pdf', size: '2.4MB', type: 'application/pdf' }];
                    else if (f?.type === 'spreadsheet') output[key] = [{ name: 'data.xlsx', size: '850KB', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }];
                    else if (f?.type === 'document') output[key] = [{ name: 'contract.docx', size: '1.1MB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }];
                    else if (f?.type === 'image') output[key] = [{ name: 'image.png', size: '1.2MB', type: 'image/png' }];
                    else output[key] = [{ name: 'file.bin', size: '1.2MB', type: 'application/octet-stream' }];
                } else {
                    output[key] = f?.type === 'number' ? 123 : f?.type === 'boolean' ? true : f?.type === 'select' ? 'Option 1' : 'sample_value';
                }
            });
            return output;
        }
        return { timestamp: new Date().toISOString(), triggeredBy: 'user_123' };
    };

    const renderSchemaBuilder = (fieldKey, title, description) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">{title}</label>
                    {description && <p className="text-[10px] text-slate-500">{description}</p>}
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addListItem(fieldKey, { name: '', type: 'String' })}><Plus className="w-4 h-4 text-blue-400" /></Button>
            </div>
            <div className="space-y-2">
                {(selectedNode.data?.[fieldKey] || []).map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Key"
                            value={item.name}
                            onChange={(e) => updateListItem(fieldKey, i, 'name', e.target.value)}
                        />
                        <select
                            className="w-24 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-400 focus:border-blue-500 focus:outline-none"
                            value={item.type}
                            onChange={(e) => updateListItem(fieldKey, i, 'type', e.target.value)}
                        >
                            <option>String</option>
                            <option>Number</option>
                            <option>Boolean</option>
                            <option>Object</option>
                            <option>Array</option>
                            <option>File</option>
                            <option>Image</option>
                            <option>Audio</option>
                            <option>Video</option>
                            <option>PDF</option>
                            <option>Document</option>
                            <option>Spreadsheet</option>
                            <option>Any</option>
                        </select>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-red-400" onClick={() => removeListItem(fieldKey, i)}><Minus className="w-3 h-3" /></Button>
                    </div>
                ))}
                {(selectedNode.data[fieldKey] || []).length === 0 && <p className="text-xs text-slate-600 italic text-center py-4 border border-dashed border-slate-800 rounded">No {title.toLowerCase()} defined.</p>}
            </div>
        </div>
    );

    const renderKeyValueList = (fieldKey, title) => (
        <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">{title}</label>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addListItem(fieldKey, { key: '', value: '' })}><Plus className="w-4 h-4 text-blue-400" /></Button>
            </div>
            <div className="space-y-2">
                {(selectedNode.data[fieldKey] || []).map((item, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => updateListItem(fieldKey, i, 'key', e.target.value)}
                        />
                        <input
                            className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => updateListItem(fieldKey, i, 'value', e.target.value)}
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-red-400" onClick={() => removeListItem(fieldKey, i)}><Minus className="w-3 h-3" /></Button>
                    </div>
                ))}
                {(selectedNode.data[fieldKey] || []).length === 0 && <p className="text-xs text-slate-600 italic text-center py-2 border border-dashed border-slate-800 rounded">No headers defined.</p>}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <span className="font-bold text-slate-200">Configuration</span>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-red-950/50 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-200 h-8 w-8">
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800">
                {[
                    { id: 'config', icon: Sliders, label: 'Config' },
                    { id: 'inputs', icon: ArrowRightLeft, label: 'Inputs' },
                    { id: 'outputs', icon: Activity, label: 'Outputs' },
                    { id: 'advanced', icon: FileJson, label: 'Adv.' },
                    { id: 'debug', icon: Terminal, label: 'Debug' },
                    { id: 'help', icon: BookOpen, label: 'Help' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 p-3 flex justify-center items-center border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-400 bg-slate-800/50'
                            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                            }`}
                        title={tab.label}
                    >
                        <tab.icon className="w-4 h-4" />
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4">
                {activeTab === 'config' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                            <div className="flex items-center gap-2">
                                <PlayCircle className={`w-4 h-4 ${selectedNode.entry ? 'text-green-500' : 'text-slate-500'}`} />
                                <label className="text-xs text-slate-400 font-medium">Start Node</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="rounded bg-slate-900 border-slate-800 text-green-500 focus:ring-green-500 w-4 h-4"
                                    checked={selectedNode.entry || false}
                                    onChange={(e) => handleTopLevelChange('entry', e.target.checked)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Label</label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                                value={selectedNode.data.label || ''}
                                onChange={(e) => handleChange('label', e.target.value)}
                            />
                        </div>

                        {/* Start Trigger (Default Node) */}
                        {selectedNode.data?.type === 'default' && (
                            <div className="space-y-4 pt-2">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Trigger Type <HelpTooltip text="How the workflow starts: manually, on a schedule, or via external event." /></label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'manual', label: 'Manual', icon: PlayCircle },
                                        { id: 'schedule', label: 'Schedule', icon: Calendar },
                                        { id: 'email', label: 'Email', icon: Mail },
                                        { id: 'webhook', label: 'Webhook', icon: Webhook },
                                        { id: 'bulk_csv', label: 'Bulk CSV / Task Pool', icon: FileSpreadsheet },
                                    ].map((trigger) => (
                                        <Button
                                            key={trigger.id}
                                            variant="outline"
                                            className={`flex flex-col h-20 gap-2 ${selectedNode.data.triggerType === trigger.id ? 'border-blue-500 bg-blue-500/10 text-blue-100' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400'}`}
                                            onClick={() => handleChange('triggerType', trigger.id)}
                                        >
                                            <trigger.icon className={`w-6 h-6 ${selectedNode.data.triggerType === trigger.id ? 'text-blue-400' : 'text-slate-500'}`} />
                                            <span className="text-xs font-medium">{trigger.label}</span>
                                        </Button>
                                    ))}
                                </div>

                                {/* Process Builder Enhancement: Manual Triggers */}
                                {selectedNode.data.triggerType === 'manual' && (
                                    <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Task Configuration <HelpTooltip text="Defines the behavior of the manual trigger." /></label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline"
                                                    className={`justify-start gap-2 h-auto py-2 ${selectedNode.data.manualTaskType === 'independent' || !selectedNode.data.manualTaskType ? 'border-blue-500 bg-blue-500/10 text-blue-100' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}
                                                    onClick={() => handleChange('manualTaskType', 'independent')}
                                                >
                                                    <div className="text-left w-full">
                                                        <div className="text-xs font-semibold mb-1">Independent Task</div>
                                                        <div className="text-[9px] text-slate-500 whitespace-normal leading-tight">Assigns to the current user immediately.</div>
                                                    </div>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className={`justify-start gap-2 h-auto py-2 ${selectedNode.data.manualTaskType === 'dependent' ? 'border-blue-500 bg-blue-500/10 text-blue-100' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}
                                                    onClick={() => handleChange('manualTaskType', 'dependent')}
                                                >
                                                    <div className="text-left w-full">
                                                        <div className="text-xs font-semibold mb-1">Dependent Tasks</div>
                                                        <div className="text-[9px] text-slate-500 whitespace-normal leading-tight">Option to upload/share spreadsheet to self or others.</div>
                                                    </div>
                                                </Button>
                                            </div>
                                        </div>

                                        {selectedNode.data.manualTaskType === 'dependent' ? (
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                                                <p className="text-xs text-slate-400 mb-2">Configure Dependent Task Inputs. These will act as a batch input for multiple task assignments within the team/cluster.</p>
                                                <div className="space-y-1 mt-2 mb-3">
                                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Allowed Formats</label>
                                                    <div className="flex gap-2 text-[10px] text-slate-400 flex-wrap">
                                                        <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-full flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> CSV</span>
                                                        <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-full flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> Excel (.xlsx)</span>
                                                        <span className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-full flex items-center gap-1"><Link2 className="w-3 h-3" /> Google Sheets</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Assignment Pool</label>
                                                    <select
                                                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                                                        value={selectedNode.data.taskCluster || 'all'}
                                                        onChange={(e) => handleChange('taskCluster', e.target.value)}
                                                    >
                                                        <option value="all">Everyone in Workspace / Team</option>
                                                        <option value="sales">Sales Team</option>
                                                        <option value="support">Support Team</option>
                                                        <option value="operations">Operations Team</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Input Variables</label>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addListItem('inputs', { name: '', type: 'String' })}><Plus className="w-4 h-4 text-blue-400" /></Button>
                                                </div>
                                                <div className="space-y-2">
                                                    {(selectedNode.data.inputs || []).map((input, i) => (
                                                        <div key={i} className="flex gap-2">
                                                            <input className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-200 focus:border-violet-500 focus:outline-none" placeholder="Var Name" value={input.name} onChange={(e) => updateListItem('inputs', i, 'name', e.target.value)} />
                                                            <select className="w-20 bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-400 focus:border-violet-500 focus:outline-none" value={input.type} onChange={(e) => updateListItem('inputs', i, 'type', e.target.value)}><option>String</option><option>Number</option><option>Boolean</option></select>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-red-400" onClick={() => removeListItem('inputs', i)}><Minus className="w-3 h-3" /></Button>
                                                        </div>
                                                    ))}
                                                    {(selectedNode.data.inputs || []).length === 0 && <p className="text-xs text-slate-600 italic text-center py-2">No inputs defined.</p>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bulk CSV Config */}
                                {selectedNode.data.triggerType === 'bulk_csv' && (
                                    <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                                            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-800 text-blue-500 bg-slate-900 h-4 w-4"
                                                    checked={selectedNode.data.enableTaskPool || false}
                                                    onChange={(e) => handleChange('enableTaskPool', e.target.checked)}
                                                />
                                                Enable Task Pool (Assignments)
                                            </label>
                                            <p className="mt-2 text-xs text-slate-500">
                                                When a list of data is uploaded (e.g. Google Sheets or CSV), each row will become a pending task. Team members can claim tasks from the dashboard pool.
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-400">Assigned Team / Cluster</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                                                value={selectedNode.data.taskCluster || 'all'}
                                                onChange={(e) => handleChange('taskCluster', e.target.value)}
                                            >
                                                <option value="all">Everyone in Workspace</option>
                                                <option value="sales">Sales Team</option>
                                                <option value="support">Support Team</option>
                                                <option value="operations">Operations Team</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Dynamic Trigger Config */}
                                {selectedNode.data.triggerType === 'email' && (
                                    <div className="space-y-3 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-400">Subject Filter</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                                                placeholder="e.g. 'Invoice Received'"
                                                value={selectedNode.data.emailSubject || ''}
                                                onChange={(e) => handleChange('emailSubject', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedNode.data.triggerType === 'schedule' && (
                                    <div className="space-y-3 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-400">Frequency</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                                                value={selectedNode.data.frequency || 'daily'}
                                                onChange={(e) => handleChange('frequency', e.target.value)}
                                            >
                                                <option value="hourly">Every Hour</option>
                                                <option value="daily">Every Day</option>
                                                <option value="weekly">Every Week</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {selectedNode.data.triggerType === 'webhook' && (
                                    <div className="space-y-3 pt-4 border-t border-slate-800 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 break-all">
                                            <span className="text-slate-500 block mb-1">Webhook URL:</span>
                                            https://api.platform.com/hooks/v1/trigger/{selectedNode.id}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dynamic Fields based on Node Type */}
                        {selectedNode.data?.type === 'aiNode' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 flex items-center">Task Type <HelpTooltip text="The specific AI operation (e.g., summarize, classify) to perform." /></label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'custom', label: 'Custom', icon: Brain },
                                            { id: 'enrich', label: 'Enrich Data', icon: Wand2 },
                                            { id: 'summarize', label: 'Summarize', icon: FileText },
                                            { id: 'classify', label: 'Classify', icon: CheckCircle2 },
                                        ].map((task) => (
                                            <Button
                                                key={task.id}
                                                variant="outline"
                                                className={`justify-start gap-2 h-auto py-2 ${selectedNode.data.taskType === task.id ? 'border-purple-500 bg-purple-500/10 text-purple-100' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}
                                                onClick={() => {
                                                    handleChange('taskType', task.id);
                                                    if (AI_TEMPLATES[task.id]) handleChange('config', AI_TEMPLATES[task.id]);
                                                }}
                                            >
                                                <task.icon className="w-4 h-4" />
                                                <span className="text-xs">{task.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">Model Endpoint <HelpTooltip text="The API URL for the AI model provider." /></label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                                        placeholder="https://api.openai.com/v1/..."
                                        value={selectedNode.data.endpoint || ''}
                                        onChange={(e) => handleChange('endpoint', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">API Key</label>
                                    <input
                                        type="password"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                                        placeholder="sk-..."
                                        value={selectedNode.data.apiKey || ''}
                                        onChange={(e) => handleChange('apiKey', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">System Prompt <HelpTooltip text="Instructions defining the AI's behavior and context." /></label>
                                    <textarea
                                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                                        placeholder="You are a helpful assistant..."
                                        value={selectedNode.data.config || ''}
                                        onChange={(e) => handleChange('config', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'vapiBpoNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Voice AI: BPO Agent <HelpTooltip text="Configure a virtual voice agent for customer calls." /></label>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Agent ID</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                                        placeholder="vapi-agent-uuid"
                                        value={selectedNode.data.agentId || ''}
                                        onChange={(e) => handleChange('agentId', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Agent Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                        value={selectedNode.data.agentName || ''}
                                        onChange={(e) => handleChange('agentName', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'smsNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Messaging: Send SMS <HelpTooltip text="Send automated text messages to customers." /></label>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Recipient Number</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-green-500 font-mono"
                                        placeholder="+1234567890"
                                        value={selectedNode.data.to || ''}
                                        onChange={(e) => handleChange('to', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Message Content</label>
                                    <textarea
                                        className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-green-500"
                                        value={selectedNode.data.message || ''}
                                        onChange={(e) => handleChange('message', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'delayNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Execution: Wait / Delay <HelpTooltip text="Pause the workflow for a specific duration." /></label>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Delay (Seconds)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500"
                                        value={selectedNode.data.seconds || 5}
                                        onChange={(e) => handleChange('seconds', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'crmNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">CRM: Registry Lookup <HelpTooltip text="Fetch customer or entity data from your CRM." /></label>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Lookup Key</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                                        placeholder="e.g. email or id"
                                        value={selectedNode.data.query || ''}
                                        onChange={(e) => handleChange('query', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'browserNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Automation: Web Scraper <HelpTooltip text="Extract data from a public website." /></label>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Target URL</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                                        placeholder="https://example.com"
                                        value={selectedNode.data.url || ''}
                                        onChange={(e) => handleChange('url', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'conditionNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Logic: Advanced Branch <HelpTooltip text="Multi-path branching based on a variable match." /></label>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Variable Key</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500 font-mono"
                                        placeholder="e.g. status"
                                        value={selectedNode.data.key || ''}
                                        onChange={(e) => handleChange('key', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Match Value</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                                        placeholder="e.g. completed"
                                        value={selectedNode.data.value || ''}
                                        onChange={(e) => handleChange('value', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'appNode' && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">App Title <HelpTooltip text="Name of the application displayed to end users." /></label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                                        placeholder="e.g. Approval Dashboard"
                                        value={selectedNode.data.appTitle || ''}
                                        onChange={(e) => handleChange('appTitle', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Description</label>
                                    <textarea
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                                        placeholder="Instructions for the user..."
                                        value={selectedNode.data.description || ''}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center">Form Schema <HelpTooltip text="Structure of the form users will fill out." /></label>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsPreviewOpen(true)} title="Preview App UI"><Eye className="w-3 h-3 text-slate-400 hover:text-violet-400" /></Button>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => addListItem('fields', { id: `f_${Date.now()}`, label: 'New Field', key: 'new_field', type: 'text', required: false })}><Plus className="w-3 h-3 mr-1 text-violet-500" /></Button>
                                        </div>
                                    </div>
                                    <Reorder.Group axis="y" values={selectedNode.data?.fields || []} onReorder={(newOrder) => handleChange('fields', newOrder)} className="space-y-2">
                                        {(selectedNode.data?.fields || []).map((field, i) => (
                                            <FieldItem
                                                key={field.id || i}
                                                field={field}
                                                index={i}
                                                updateListItem={updateListItem}
                                                removeListItem={removeListItem}
                                                generateVarName={generateVarName}
                                            />
                                        ))}
                                        {(selectedNode.data?.fields || []).length === 0 && (
                                            <div className="text-center py-4 border-2 border-dashed border-slate-800 rounded-lg">
                                                <p className="text-xs text-slate-500">No fields added</p>
                                                <Button variant="link" size="sm" className="text-violet-500 h-auto p-0 text-xs" onClick={() => addListItem('fields', { id: `f_${Date.now()}`, label: 'New Field', key: 'new_field', type: 'text' })}>Add your first field</Button>
                                            </div>
                                        )}
                                    </Reorder.Group>
                                    <div className="pt-3 mt-2 border-t border-slate-800">
                                        <label className="text-xs text-slate-400 mb-1 block">Submit Button</label>
                                        <div className="flex gap-2">
                                            <input
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                                                placeholder="Label (e.g. 'Run Workflow')"
                                                value={selectedNode.data.submitLabel || ''}
                                                onChange={(e) => handleChange('submitLabel', e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                            <PlayCircle className="w-3 h-3" /> Triggers workflow execution
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'widgetNode' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">PWA Widget Synthesis <HelpTooltip text="Configure a standalone interactive component for your mobile app." /></label>
                                    <p className="text-[10px] text-slate-500 mb-2">Select a widget blueprint to deploy as part of your process.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Widget Blueprint</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'counter', label: 'Counter', icon: Plus },
                                            { id: 'scoreboard', label: 'Scoreboard', icon: Trophy },
                                        ].map((w) => (
                                            <Button
                                                key={w.id}
                                                variant="outline"
                                                className={`justify-start gap-2 h-auto py-3 ${selectedNode.data.widgetType === w.id ? 'border-pink-500 bg-pink-500/10 text-pink-100' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}
                                                onClick={() => handleChange('widgetType', w.id)}
                                            >
                                                <w.icon className={`w-4 h-4 ${selectedNode.data.widgetType === w.id ? 'text-pink-400' : 'text-slate-500'}`} />
                                                <span className="text-xs">{w.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Widget Title</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                                        placeholder="e.g. Activity Tracker"
                                        value={selectedNode.data.title || ''}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400">Initial Value / State</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                                        value={selectedNode.data.initialValue || 0}
                                        onChange={(e) => handleChange('initialValue', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed italic">
                                    Note: This widget will be automatically responsive and compatible with standard iOS/Android PWA manifests.
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'apiNode' && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">Endpoint URL <HelpTooltip text="The destination URL for the API request." /></label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                                        placeholder="https://api.example.com/v1/..."
                                        value={selectedNode.data.url || ''}
                                        onChange={(e) => handleChange('url', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">Method <HelpTooltip text="HTTP method (GET, POST, etc.) for the request." /></label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                                        onChange={(e) => handleChange('method', e.target.value)}
                                        value={selectedNode.data.method || 'GET'}
                                    >
                                        <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                                    </select>
                                </div>

                                {renderKeyValueList('headers', 'Headers')}

                                <div className="space-y-1 pt-2">
                                    <label className="text-xs text-slate-400">Request Body (JSON)</label>
                                    <textarea
                                        className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                                        placeholder='{"key": "value"}'
                                        value={selectedNode.data.body || ''}
                                        onChange={(e) => handleChange('body', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'customNode' && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">Function Code <HelpTooltip text="Custom JavaScript to execute logic." /></label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full h-64 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y"
                                            placeholder="// Write your JavaScript code here..."
                                            value={selectedNode.data.code || ''}
                                            onChange={(e) => handleChange('code', e.target.value)}
                                            spellCheck="false"
                                        />
                                        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded pointer-events-none">
                                            JavaScript (ES6)
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500">
                                        Available variables: <code>data</code> (previous node output). Return an object.
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'pythonNode' && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">Python Script <HelpTooltip text="Execute Python code for ML/Data tasks." /></label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full h-64 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 font-mono leading-relaxed resize-y"
                                            placeholder="# def main(data): ..."
                                            value={selectedNode.data.code || ''}
                                            onChange={(e) => handleChange('code', e.target.value)}
                                            spellCheck="false"
                                        />
                                        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded pointer-events-none">
                                            Python 3.10
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-500">
                                        Define a <code>main(data)</code> function. Returns a dict.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">Requirements (pip) <HelpTooltip text="Libraries to install before execution." /></label>
                                    <textarea
                                        className="w-full h-24 bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-yellow-500 font-mono leading-relaxed resize-y"
                                        placeholder="pandas&#10;numpy&#10;torch"
                                        value={selectedNode.data.requirements || ''}
                                        onChange={(e) => handleChange('requirements', e.target.value)}
                                        spellCheck="false"
                                    />
                                </div>

                                <div className="space-y-1 pt-2 border-t border-slate-800">
                                    <label className="text-xs text-slate-400 flex items-center">Backend URL (Optional) <HelpTooltip text="URL of your Python execution server." /></label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-yellow-500 font-mono"
                                        placeholder="https://workflow-backend-8uwh.onrender.com/execute"
                                        value={selectedNode.data.backendUrl || ''}
                                        onChange={(e) => handleChange('backendUrl', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'driveNode' && (
                            <div className="space-y-4">
                                {!selectedNode.data.oauthConnected ? (
                                    <div className="space-y-3 text-center">
                                        <label className="text-xs text-slate-400 block flex items-center justify-center">Authentication <HelpTooltip text="Connect to external services like Google Drive." /></label>
                                        <div className="p-4 bg-slate-950 border border-dashed border-slate-700 rounded-lg">
                                            <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Cloud className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium mb-1">Google Drive</p>
                                            <p className="text-xs text-slate-500 mb-3">Connect your account to access Sheets and CSVs.</p>
                                            <Button
                                                className="w-full gap-2 bg-white text-black hover:bg-slate-200"
                                                onClick={() => handleChange('oauthConnected', true)}
                                            >
                                                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" />
                                                Sign in with Google
                                            </Button>
                                        </div>
                                    </div>
                                ) : !selectedNode.data.fileId ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs text-slate-400">Select File</label>
                                            <Button variant="ghost" size="xs" className="h-5 text-[10px] text-red-400 hover:text-red-300 gap-1" onClick={() => handleChange('oauthConnected', false)}>
                                                <LogOut className="w-3 h-3" /> Disconnect
                                            </Button>
                                        </div>

                                        {!isPickerOpen ? (
                                            <Button variant="outline" className="w-full h-24 flex flex-col gap-2 border-dashed" onClick={() => setIsPickerOpen(true)}>
                                                <FolderOpen className="w-8 h-8 text-blue-400" />
                                                <span className="text-xs text-slate-400">Open Drive Picker</span>
                                            </Button>
                                        ) : (
                                            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-2 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                                    <span className="text-xs font-medium text-slate-300">Recent Files</span>
                                                    <X className="w-3 h-3 cursor-pointer text-slate-500" onClick={() => setIsPickerOpen(false)} />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {MOCK_DRIVE_FILES.map(file => (
                                                        <div
                                                            key={file.id}
                                                            className="p-2 hover:bg-slate-900 cursor-pointer flex items-center gap-3 transition-colors"
                                                            onClick={() => {
                                                                handleBulkDataChange({ fileId: file.id, fileName: file.name, fileType: file.type });
                                                                setIsPickerOpen(false);
                                                            }}
                                                        >
                                                            {file.type === 'sheet' ? <FileSpreadsheet className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4 text-blue-500" />}
                                                            <div className="flex-grow min-w-0">
                                                                <div className="text-xs text-slate-200 truncate">{file.name}</div>
                                                                <div className="text-[10px] text-slate-500">{file.size} • {file.rows} rows</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-xs text-slate-400">Selected File</label>
                                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
                                            <File className="w-6 h-6 text-blue-400 flex-shrink-0" />
                                            <div className="flex-grow overflow-hidden">
                                                <p className="text-sm text-slate-200 truncate" title={selectedNode.data.fileName}>
                                                    {selectedNode.data.fileName || 'Unknown File'}
                                                </p>
                                                <p className="text-xs text-slate-500 font-mono truncate" title={selectedNode.data.fileId}>
                                                    ID: {selectedNode.data.fileId}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleBulkDataChange({ fileId: null, fileName: null })}>
                                                Change
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-blue-400 border-blue-900/30 hover:bg-blue-950/30" onClick={() => handleChange('showPreview', !selectedNode.data.showPreview)}>
                                                {selectedNode.data.showPreview ? 'Hide Data' : 'Preview Data'}
                                            </Button>
                                        </div>

                                        {/* File Preview */}
                                        {selectedNode.data.showPreview && (
                                            <div className="pt-2 border-t border-slate-800 animate-in slide-in-from-top-2">
                                                <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                                                    <table className="w-full text-[10px] text-left text-slate-400">
                                                        <thead className="bg-slate-900 text-slate-300">
                                                            <tr><th className="p-2">Date</th><th className="p-2">Customer</th><th className="p-2">Amount</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800">
                                                            {MOCK_PREVIEW_ROWS.map(row => (
                                                                <tr key={row.id}>
                                                                    <td className="p-2">{row.date}</td>
                                                                    <td className="p-2 text-slate-200">{row.customer}</td>
                                                                    <td className="p-2 font-mono">{row.amount}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedNode.data?.type === 'mediaConvert' && (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 flex items-center">Default Format <HelpTooltip text="Fallback format if none is provided by the User Form." /></label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                                        value={selectedNode.data.targetFormat || 'pdf'}
                                        onChange={(e) => handleChange('targetFormat', e.target.value)}
                                    >
                                        <option value="pdf">PDF Document</option>
                                        <option value="docx">Word Document</option>
                                        <option value="mp3">MP3 Audio</option>
                                        <option value="mp4">MP4 Video</option>
                                        <option value="jpg">JPG Image</option>
                                        <option value="png">PNG Image</option>
                                    </select>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Tip: If your User App has a field named <code>target_format</code>, it will override this setting automatically.
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'fileNode' && (
                            <div className="space-y-4">
                                {!selectedNode.data.fileName ? (
                                    <div className="space-y-3 text-center">
                                        <label className="text-xs text-slate-400 block">Local File Upload</label>
                                        <div className="p-6 bg-slate-950 border border-dashed border-slate-700 rounded-lg hover:border-slate-500 transition-colors relative group">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        handleBulkDataChange({
                                                            fileName: file.name,
                                                            fileSize: (file.size / 1024).toFixed(1) + ' KB',
                                                            fileType: file.type
                                                        });
                                                    }
                                                }}
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="p-3 bg-slate-900 rounded-full group-hover:bg-slate-800 transition-colors">
                                                    <Upload className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium text-slate-300">Click to upload</p>
                                                    <p className="text-xs text-slate-500">PDF, CSV, JSON, TXT</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <label className="text-xs text-slate-400">Uploaded File</label>
                                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-3">
                                            <File className="w-6 h-6 text-orange-400 flex-shrink-0" />
                                            <div className="flex-grow overflow-hidden">
                                                <p className="text-sm text-slate-200 truncate" title={selectedNode.data.fileName}>
                                                    {selectedNode.data.fileName}
                                                </p>
                                                <p className="text-xs text-slate-500 font-mono truncate">
                                                    {selectedNode.data.fileSize || 'Unknown Size'}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-400" onClick={() => handleBulkDataChange({ fileName: null, fileSize: null })}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedNode.data?.type === 'dataNode' && (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 flex items-center">Operation <HelpTooltip text="Data transformation to apply (e.g., mapping, cleaning)." /></label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'mapping', label: 'Map Columns', icon: Columns },
                                            { id: 'cleaning', label: 'Clean Data', icon: Eraser },
                                            { id: 'normalize', label: 'Normalize', icon: ArrowRightLeft },
                                            { id: 'sku_map', label: 'SKU Match', icon: Database },
                                        ].map((op) => (
                                            <Button
                                                key={op.id}
                                                variant="outline"
                                                className={`justify-start gap-2 h-auto py-2 ${selectedNode.data.operation === op.id ? 'border-yellow-500 bg-yellow-500/10 text-yellow-100' : 'border-slate-800 bg-slate-900/50 text-slate-400'}`}
                                                onClick={() => handleChange('operation', op.id)}
                                            >
                                                <op.icon className="w-4 h-4" />
                                                <span className="text-xs">{op.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Input Source</label>
                                    <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                                        <option>Previous Node Output</option>
                                        <option>Google Drive File</option>
                                        <option>External API</option>
                                    </select>
                                </div>

                                {selectedNode.data.operation === 'cleaning' && (
                                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                                        <label className="text-xs text-slate-400 font-bold">Cleaning Rules</label>
                                        <div className="space-y-2">
                                            {['Remove Duplicates', 'Remove Empty Rows', 'Trim Whitespace', 'Fix Encoding Errors'].map((rule, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input type="checkbox" id={`rule-${i}`} className="rounded bg-slate-950 border-slate-800 text-yellow-500 focus:ring-yellow-500" defaultChecked={i < 2} />
                                                    <label htmlFor={`rule-${i}`} className="text-xs text-slate-300 cursor-pointer">{rule}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedNode.data.operation === 'normalize' && (
                                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-400">Date Format</label>
                                            <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200">
                                                <option>ISO 8601 (YYYY-MM-DD)</option>
                                                <option>US (MM/DD/YYYY)</option>
                                                <option>EU (DD/MM/YYYY)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-400">Currency</label>
                                            <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200">
                                                <option>USD ($)</option>
                                                <option>EUR (€)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {(selectedNode.data.operation === 'mapping' || selectedNode.data.operation === 'sku_map' || !selectedNode.data.operation) && (
                                    <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs text-slate-400">{selectedNode.data.operation === 'sku_map' ? 'SKU Mapping' : 'Column Mapping'}</label>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-400 hover:text-blue-300 px-2" onClick={() => addListItem('mappings', { source: '', target: '' })}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {(selectedNode.data.mappings || [{ source: 'Name', target: 'full_name' }, { source: 'Email', target: 'email_address' }]).map((map, i) => (
                                                <div key={i} className="flex items-center gap-2 group">
                                                    <input className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-200 focus:border-blue-500 focus:outline-none" placeholder="Source Field" value={map.source} onChange={(e) => updateListItem('mappings', i, 'source', e.target.value)} />
                                                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                                    <input className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 text-[10px] text-slate-200 focus:border-blue-500 focus:outline-none" placeholder="Target Field" value={map.target} onChange={(e) => updateListItem('mappings', i, 'target', e.target.value)} />
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400" onClick={() => removeListItem('mappings', i)}><Minus className="w-3 h-3" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <label className="text-xs text-slate-400 flex items-center gap-2"><Table className="w-3 h-3" /> Preview Rows</label>
                                    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                                        <table className="w-full text-[10px] text-left text-slate-400">
                                            <thead className="bg-slate-900">
                                                <tr>
                                                    <th className="p-2 font-medium text-slate-300">Name</th>
                                                    <th className="p-2 font-medium text-slate-300">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                <tr><td className="p-2 text-slate-200">Alice</td><td className="p-2">alice@ex.com</td></tr>
                                                <tr><td className="p-2 text-slate-200">Bob</td><td className="p-2">bob@ex.com</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'logicNode' && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Condition Builder <HelpTooltip text="Logic to determine the workflow path." /></label>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Variable</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                                            placeholder="e.g. data.status"
                                            value={selectedNode.data.conditionVar || ''}
                                            onChange={(e) => handleChange('conditionVar', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-1 space-y-1">
                                            <label className="text-[10px] text-slate-500 uppercase font-semibold">Operator</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                                                value={selectedNode.data.conditionOp || '=='}
                                                onChange={(e) => handleChange('conditionOp', e.target.value)}
                                            >
                                                <option value="==">==</option>
                                                <option value="!=">!=</option>
                                                <option value=">">&gt;</option>
                                                <option value="<">&lt;</option>
                                                <option value="contains">Has</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] text-slate-500 uppercase font-semibold">Value</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                                                placeholder="e.g. 'Success'"
                                                value={selectedNode.data.conditionVal || ''}
                                                onChange={(e) => handleChange('conditionVal', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex flex-col items-center gap-2 text-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-[10px] text-green-400 font-medium uppercase tracking-wide">True Path</span>
                                    </div>
                                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex flex-col items-center gap-2 text-center">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <span className="text-[10px] text-red-400 font-medium uppercase tracking-wide">False Path</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'ifNode' && (
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Visual If / Else <HelpTooltip text="Advanced branching with variable resolution." /></label>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Value 1 (or {{ variable }})</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                                            placeholder="e.g. {{status}}"
                                            value={selectedNode.data.value1 || ''}
                                            onChange={(e) => handleChange('value1', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Operator</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                                            value={selectedNode.data.operator || '=='}
                                            onChange={(e) => handleChange('operator', e.target.value)}
                                        >
                                            <option value="==">is equal to</option>
                                            <option value="!=">is not equal to</option>
                                            <option value=">">is greater than</option>
                                            <option value="<">is less than</option>
                                            <option value="contains">contains string</option>
                                            <option value="exists">exists / is not null</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Value 2</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                                            placeholder="e.g. success"
                                            value={selectedNode.data.value2 || ''}
                                            onChange={(e) => handleChange('value2', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex flex-col items-center gap-2 text-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        <span className="text-[10px] text-green-400 font-medium uppercase tracking-wide">True Handle</span>
                                    </div>
                                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg flex flex-col items-center gap-2 text-center">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <span className="text-[10px] text-red-400 font-medium uppercase tracking-wide">False Handle</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'memoryNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Stateful Memory <HelpTooltip text="Store and retrieve data across different runs." /></label>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Operation</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" className={`h-8 text-[10px] uppercase font-bold ${selectedNode.data.operation === 'get' ? 'border-amber-500 bg-amber-500/10 text-amber-100' : 'border-slate-800'}`} onClick={() => handleChange('operation', 'get')}>Retrieve</Button>
                                        <Button variant="outline" className={`h-8 text-[10px] uppercase font-bold ${selectedNode.data.operation === 'set' ? 'border-amber-500 bg-amber-500/10 text-amber-100' : 'border-slate-800'}`} onClick={() => handleChange('operation', 'set')}>Persist</Button>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Memory Key (Unique Name)</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                                        placeholder="e.g. user_last_preference"
                                        value={selectedNode.data.key || ''}
                                        onChange={(e) => handleChange('key', e.target.value)}
                                    />
                                </div>

                                {selectedNode.data.operation === 'set' && (
                                    <div className="space-y-1 animate-in fade-in">
                                        <label className="text-[10px] text-slate-500 uppercase font-semibold">Value to Save (Variable Name)</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                                            placeholder="e.g. current_sentiment"
                                            value={selectedNode.data.value || ''}
                                            onChange={(e) => handleChange('value', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedNode.data?.type === 'workflowToolNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center underline decoration-violet-500/30">Orchestration: Sub-Workflow <HelpTooltip text="Execute another workflow as a tool/agent." /></label>

                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Target Workflow</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:border-violet-500 focus:outline-none"
                                        value={selectedNode.data.workflowId || ''}
                                        onChange={(e) => handleChange('workflowId', e.target.value)}
                                    >
                                        <option value="">-- Select Deployment --</option>
                                        {savedWorkflows.map(wf => (
                                            <option key={wf.id} value={wf.id}>{wf.name} (v{wf.version})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Input Mapping</label>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                                            const mapping = { ...selectedNode.data.inputMapping, [`var_${Date.now()}`]: '' };
                                            handleChange('inputMapping', mapping);
                                        }}><Plus className="w-3 h-3 text-violet-400" /></Button>
                                    </div>
                                    <div className="space-y-2">
                                        {Object.entries(selectedNode.data.inputMapping || {}).map(([target, source], i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <input
                                                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:border-violet-500 focus:outline-none"
                                                    placeholder="Target Key"
                                                    value={target}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        const mapping = { ...selectedNode.data.inputMapping };
                                                        delete mapping[target];
                                                        mapping[newVal] = source;
                                                        handleChange('inputMapping', mapping);
                                                    }}
                                                />
                                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                                <input
                                                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 focus:border-violet-500 focus:outline-none"
                                                    placeholder="Source Variable"
                                                    value={source}
                                                    onChange={(e) => {
                                                        const mapping = { ...selectedNode.data.inputMapping, [target]: e.target.value };
                                                        handleChange('inputMapping', mapping);
                                                    }}
                                                />
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-red-400" onClick={() => {
                                                    const mapping = { ...selectedNode.data.inputMapping };
                                                    delete mapping[target];
                                                    handleChange('inputMapping', mapping);
                                                }}><Minus className="w-3 h-3" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedNode.data?.type === 'waitNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Execution Halt <HelpTooltip text="Halt the workflow for a specific duration." /></label>

                                {renderParam('Wait Time', 'delay', '5', 'number')}

                                <div className="space-y-1">
                                    <label className="text-[10px] text-slate-500 uppercase font-semibold">Unit</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:border-rose-500 focus:outline-none"
                                        value={selectedNode.data.unit || 'seconds'}
                                        onChange={(e) => handleChange('unit', e.target.value)}
                                    >
                                        <option value="seconds">Seconds</option>
                                        <option value="minutes">Minutes</option>
                                        <option value="hours">Hours</option>
                                    </select>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">Example: Delaying a follow-up email after a lead is captured.</p>
                            </div>
                        )}

                        {selectedNode.data?.type === 'mergeNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Data Convergence <HelpTooltip text="Merge multiple data streams into a single flow." /></label>

                                {renderParam('Merge Mode', 'mode', '', 'text', [
                                    { value: 'append', label: 'Append (Add rows)' },
                                    { value: 'merge', label: 'Combine (Join columns)' },
                                    { value: 'wait', label: 'Wait (Resume when both arrive)' }
                                ])}
                            </div>
                        )}

                        {selectedNode.data?.type === 'batchNode' && (
                            <div className="space-y-4">
                                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider flex items-center">Resource Optimization <HelpTooltip text="Process large datasets in smaller chunks." /></label>

                                {renderParam('Batch Size', 'batchSize', '10', 'number')}

                                <p className="text-[10px] text-slate-500 italic">Prevents API rate limits by processing 10 items at a time.</p>
                            </div>
                        )}

                        {selectedNode.data?.type === 'exportNode' && (
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400 flex items-center">Destination <HelpTooltip text="Where to send the final output." /></label>
                                    <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                                        <button className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${selectedNode.data.destination === 'drive' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleChange('destination', 'drive')}>Cloud Drive</button>
                                        <button className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${selectedNode.data.destination === 'email' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleChange('destination', 'email')}>Email</button>
                                        <button className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${selectedNode.data.destination === 'download' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`} onClick={() => handleChange('destination', 'download')}>Download</button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2 border-t border-slate-800 animate-in fade-in">
                                    {selectedNode.data.destination === 'email' && (
                                        <div className="space-y-1 animate-in fade-in">
                                            <label className="text-xs text-slate-400">Recipient Email</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                                                placeholder="user@example.com"
                                                value={selectedNode.data.emailTo || ''}
                                                onChange={(e) => handleChange('emailTo', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {selectedNode.data.destination === 'drive' && (
                                        <div className="space-y-1 animate-in fade-in">
                                            <label className="text-xs text-slate-400">Folder Path</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                                                placeholder="/Exports/Reports"
                                                value={selectedNode.data.folderPath || ''}
                                                onChange={(e) => handleChange('folderPath', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400">Export Category</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                                            value={selectedNode.data.exportType || 'data'}
                                            onChange={(e) => {
                                                const type = e.target.value;
                                                handleChange('exportType', type);
                                                if (type === 'data') handleChange('format', 'csv');
                                                if (type === 'document') handleChange('format', 'pdf');
                                                if (type === 'media') handleChange('format', 'mp4');
                                                if (type === 'image') handleChange('format', 'png');
                                            }}
                                        >
                                            <option value="data">Data & Spreadsheets</option>
                                            <option value="document">Documents & Text</option>
                                            <option value="media">Media (Audio/Video)</option>
                                            <option value="image">Images</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400">File Format</label>
                                        <select className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" value={selectedNode.data.format || 'csv'} onChange={(e) => handleChange('format', e.target.value)}>
                                            <option value="auto">Auto-detect (from filename)</option>
                                            {(selectedNode.data.exportType === 'data' || !selectedNode.data.exportType) && (
                                                <><option value="csv">CSV (Comma Separated)</option><option value="xlsx">Excel (XLSX)</option><option value="json">JSON Data</option><option value="xml">XML</option><option value="sql">SQL Insert</option></>
                                            )}
                                            {selectedNode.data.exportType === 'document' && (
                                                <><option value="pdf">PDF Document</option><option value="docx">Word Document (DOCX)</option><option value="pptx">PowerPoint (PPTX)</option><option value="txt">Plain Text (TXT)</option><option value="md">Markdown (MD)</option><option value="html">HTML Page</option></>
                                            )}
                                            {selectedNode.data.exportType === 'media' && (
                                                <><option value="mp4">MP4 Video</option><option value="mp3">MP3 Audio</option><option value="wav">WAV Audio</option><option value="mov">MOV Video</option><option value="avi">AVI Video</option><option value="mkv">MKV Video</option><option value="webm">WebM Video</option><option value="flac">FLAC Audio</option><option value="ogg">OGG Audio</option></>
                                            )}
                                            {selectedNode.data.exportType === 'image' && (
                                                <><option value="png">PNG Image</option><option value="jpg">JPEG Image</option><option value="gif">GIF Image</option><option value="svg">SVG Vector</option><option value="webp">WebP Image</option></>
                                            )}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs text-slate-400">Output Filename</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                                            placeholder="e.g. Monthly_Report_{date}"
                                            value={selectedNode.data.filename || ''}
                                            onChange={(e) => handleChange('filename', e.target.value)}
                                        />
                                    </div>

                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                                        <Check className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs text-emerald-400">Ready to export new file</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'inputs' && (
                    <div className="space-y-4">
                        {renderSchemaBuilder('inputs', 'Input Payload', 'Define the data structure this node expects.')}
                    </div>
                )}

                {activeTab === 'outputs' && (
                    <div className="space-y-6">
                        {renderSchemaBuilder('outputs', 'Output Payload', 'Define the data structure this node produces.')}

                        {selectedNode.data.type === 'appNode' && (
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                                    <label className="text-xs text-slate-400 block mb-2 font-bold">Form Derived Output</label>
                                    <pre className="text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(generateMockOutput(selectedNode.data), null, 2)}
                                    </pre>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    These variables will be available to subsequent nodes using <code className="bg-slate-800 px-1 rounded text-slate-300">data.variable_name</code>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'advanced' && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Node ID</label>
                            <div className="p-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-400 select-all">
                                {selectedNode.id}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Node Type</label>
                            <div className="p-2 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-400">
                                {selectedNode.data?.type || 'default'}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'debug' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Node Output</label>
                            {nodeResults && (
                                <Button variant="ghost" size="xs" className="h-6 gap-1 text-[10px]" onClick={() => navigator.clipboard.writeText(JSON.stringify(nodeResults, null, 2))}>
                                    <Copy className="w-3 h-3" /> Copy
                                </Button>
                            )}
                        </div>

                        {selectedNode.data.status === 'running' ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                                <p className="text-xs">Processing...</p>
                            </div>
                        ) : nodeResults ? (
                            <div className="space-y-3">
                                {/* Special handling for Export Node results */}
                                {selectedNode.data?.type === 'exportNode' && nodeResults.url && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs text-emerald-200 font-medium">File Generated</span>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => window.open(nodeResults.url, '_blank')} className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 h-7 text-xs">
                                            <Download className="w-3 h-3 mr-2" /> Download
                                        </Button>
                                    </div>
                                )}

                                {/* Export Node Media Preview */}
                                {selectedNode.data?.type === 'exportNode' && nodeResults.url && (
                                    <div className="space-y-3">
                                        {(['mp4', 'mkv', 'webm', 'mov', 'avi'].includes(selectedNode.data.format) || nodeResults.url.match(/\.(mp4|webm|mkv|mov|avi)$/i)) && (
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                                                <video controls src={nodeResults.url} className="w-full rounded bg-black aspect-video" />
                                            </div>
                                        )}
                                        {(['mp3', 'wav', 'ogg', 'flac'].includes(selectedNode.data.format) || nodeResults.url.match(/\.(mp3|wav|ogg|flac)$/i)) && (
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                                                <audio controls src={nodeResults.url} className="w-full" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Media Preview */}
                                {nodeResults.ui?.type === 'media' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2">
                                            <PlayCircle className="w-4 h-4 text-purple-500" />
                                            <span className="text-xs text-purple-200 font-medium">Media Generated</span>
                                        </div>
                                        {nodeResults.ui.files.map((file, i) => (
                                            <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                                                {file.mime?.startsWith('audio') ? (
                                                    <audio controls src={file.url} className="w-full" />
                                                ) : (
                                                    <video controls src={file.url} className="w-full rounded bg-black aspect-video" />
                                                )}
                                                <div className="mt-2 flex justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => window.open(file.url, '_blank')} className="h-7 text-xs gap-2 border-slate-700 hover:bg-slate-800">
                                                        <Download className="w-3 h-3" /> Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-hidden">
                                    <pre className="text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre-wrap max-h-[400px]">
                                        {JSON.stringify(nodeResults, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-lg">
                                <p className="text-xs text-slate-500">
                                    {selectedNode.data.status === 'error' ? 'Execution failed.' : 'Run the workflow to see output.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'help' && (
                    <div className="space-y-6">
                        {!activeTutorial ? (
                            <>
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <div className="flex items-center gap-3 mb-2">
                                        <GraduationCap className="w-6 h-6 text-blue-400" />
                                        <h3 className="font-semibold text-slate-200">Knowledge Base</h3>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Welcome to the training center. Here you can learn how to build powerful workflows.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Getting Started</h4>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">What is a Workflow?</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    Think of a workflow like a recipe. You start with ingredients (<strong>Inputs</strong>), perform steps (<strong>Nodes</strong>), and get a final dish (<strong>Output</strong>).
                                                    <br /><br />
                                                    Connect nodes together by dragging a line from the right handle of one node to the left handle of another. This passes data between them.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Core Concepts</h4>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">Understanding Nodes</h5>
                                                <p className="text-[10px] text-slate-500">Learn about the different building blocks available in the workflow builder.</p>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">Data Flow</h5>
                                                <p className="text-[10px] text-slate-500">How data passes from one node to another using the `data` variable.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Python & Libraries</h4>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">Installing Libraries</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    You don't need to use a terminal! To use libraries like <code>pandas</code> or <code>numpy</code>:
                                                    <ol className="list-decimal list-inside mt-2 ml-1 space-y-1 mb-2">
                                                        <li>Click your <strong>Python Script</strong> node.</li>
                                                        <li>Find the <strong>Requirements (pip)</strong> box.</li>
                                                        <li>Type the name of the library (e.g., <code>pandas</code>).</li>
                                                        <li>For multiple libraries, put each on a new line.</li>
                                                    </ol>
                                                    <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-slate-300">
                                                        pandas<br />
                                                        numpy<br />
                                                        requests
                                                    </div>
                                                    <span className="block mt-2 text-slate-400">The system installs these automatically when you run the workflow.</span>
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">Writing Python Code</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    Your code must have a <code>main(data)</code> function.
                                                    <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                                        <li><code>data</code>: The input received from the previous node.</li>
                                                        <li><strong>Return:</strong> A dictionary (JSON) to pass to the next node.</li>
                                                    </ul>
                                                    <br />
                                                    Example: <code>return &#123; "result": data["value"] * 2 &#125;</code>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Functions (JS)</h4>
                                        <div className="space-y-2">
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">JavaScript Execution</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    The Custom Function node allows you to run standard JavaScript (ES6) to manipulate data.
                                                    <br /><br />
                                                    <strong>Key Concepts:</strong>
                                                    <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                                        <li><strong>data:</strong> A global variable containing the JSON output from the previous node.</li>
                                                        <li><strong>Return Value:</strong> Your code <em>must</em> return a JSON object to pass data to the next node.</li>
                                                    </ul>
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">Code Example</h5>
                                                <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto">
                                                    <span className="text-slate-500">// Access input data</span><br />
                                                    const items = data.items || [];<br /><br />
                                                    <span className="text-slate-500">// Process data</span><br />
                                                    const total = items.reduce((sum, item) =&gt; sum + item.price, 0);<br /><br />
                                                    <span className="text-slate-500">// Return result object</span><br />
                                                    return {'{'}<br />
                                                    &nbsp;&nbsp;"count": items.length,<br />
                                                    &nbsp;&nbsp;"total_value": total,<br />
                                                    &nbsp;&nbsp;"processed_at": new Date().toISOString()<br />
                                                    {'}'};
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer">
                                                <h5 className="text-sm font-medium text-slate-300 mb-1">Debugging & Limitations</h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    <ul className="list-disc list-inside mt-1 ml-1 space-y-1">
                                                        <li>Use <code>console.log(variable)</code> to inspect values in your browser's Developer Tools (F12).</li>
                                                        <li>This environment is <strong>sandboxed</strong>. You cannot access the DOM, <code>window</code>, or make external <code>fetch</code> calls directly (use the API Node for requests).</li>
                                                        <li>Execution time is limited to prevent freezing the browser.</li>
                                                    </ul>
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tutorials</h4>
                                        <div className="space-y-2">
                                            <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-2 mb-1">Kids Corner 🚀</h5>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer flex items-center gap-3" onClick={() => setActiveTutorial('first-app')}>
                                                <PlayCircle className="w-8 h-8 text-green-500 opacity-50" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-slate-300">My First App: The Feedback Reader</h5>
                                                    <p className="text-[10px] text-slate-500">10 min walkthrough</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer flex items-center gap-3" onClick={() => setActiveTutorial('simple-chatbot')}>
                                                <PlayCircle className="w-8 h-8 text-yellow-500 opacity-50" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-slate-300">Build a Funny Chatbot</h5>
                                                    <p className="text-[10px] text-slate-500">5 min walkthrough</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer flex items-center gap-3" onClick={() => setActiveTutorial('homework-helper')}>
                                                <PlayCircle className="w-8 h-8 text-cyan-500 opacity-50" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-slate-300">Homework Helper</h5>
                                                    <p className="text-[10px] text-slate-500">8 min walkthrough</p>
                                                </div>
                                            </div>

                                            <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-4 mb-1">Advanced</h5>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer flex items-center gap-3" onClick={() => setActiveTutorial('media-converter')}>
                                                <PlayCircle className="w-8 h-8 text-orange-500 opacity-50" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-slate-300">Pro: Media Format Converter</h5>
                                                    <p className="text-[10px] text-slate-500">15 min walkthrough</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer flex items-center gap-3" onClick={() => setActiveTutorial('email-responder')}>
                                                <PlayCircle className="w-8 h-8 text-purple-500 opacity-50" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-slate-300">Build an AI Email Responder</h5>
                                                    <p className="text-[10px] text-slate-500">5 min walkthrough</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors cursor-pointer flex items-center gap-3" onClick={() => setActiveTutorial('approval-app')}>
                                                <PlayCircle className="w-8 h-8 text-pink-500 opacity-50" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-slate-300">Create a Data Approval App</h5>
                                                    <p className="text-[10px] text-slate-500">8 min walkthrough</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-200">
                                <Button variant="ghost" size="sm" onClick={() => setActiveTutorial(null)} className="mb-4 pl-0 hover:pl-2 transition-all gap-1 text-slate-400 hover:text-slate-200">
                                    <ChevronLeft className="w-4 h-4" /> Back to Help
                                </Button>

                                {TUTORIALS[activeTutorial] && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-slate-200">{TUTORIALS[activeTutorial].title}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3" /> {TUTORIALS[activeTutorial].duration}
                                            </p>
                                        </div>

                                        <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:h-full before:w-0.5 before:bg-slate-800">
                                            {TUTORIALS[activeTutorial].steps.map((step, i) => (
                                                <div key={i} className="relative pl-10">
                                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 z-10">
                                                        {i + 1}
                                                    </div>
                                                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                                                        <h5 className="text-sm font-medium text-slate-300 mb-2">{step.title}</h5>
                                                        <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{step.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                                            <p className="text-xs text-blue-200 mb-3">Ready to try it?</p>
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setActiveTutorial(null); setActiveTab('config'); }}>
                                                Start Building
                                            </Button>
                                            <p className="text-[10px] text-slate-500 mt-2">
                                                Tip: You can switch between the "Config" and "Help" tabs at any time without losing your place.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {isPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <h3 className="font-semibold text-slate-200">{selectedNode.data.appTitle || 'Form Preview'}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsPreviewOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 bg-slate-900">
                            {(selectedNode.data.fields || []).length === 0 ? (
                                <div className="text-center text-slate-500 py-8">No fields configured.</div>
                            ) : (
                                (selectedNode.data.fields || []).map((field, i) => (
                                    <div key={i} className="space-y-1">
                                        <label className="text-sm font-medium text-slate-300 block">
                                            {field.label || 'Untitled Field'}
                                            {field.required && <span className="text-pink-500 ml-1">*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500 min-h-[80px]" placeholder={field.placeholder} />
                                        ) : field.type === 'select' ? (
                                            <select className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500">
                                                <option value="">Select an option</option>
                                                {field.options?.split(',').map(opt => (
                                                    <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                                ))}
                                            </select>
                                        ) : field.type === 'checkbox' ? (
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" className="rounded bg-slate-950 border-slate-800 text-pink-500 focus:ring-pink-500 w-4 h-4" />
                                                <span className="text-sm text-slate-400">{field.placeholder || 'Check this option'}</span>
                                            </div>
                                        ) : field.type === 'boolean' ? (
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name={`bool-${i}`} className="text-pink-500 focus:ring-pink-500 bg-slate-950 border-slate-800" />
                                                    <span className="text-sm text-slate-300">Yes</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" name={`bool-${i}`} className="text-pink-500 focus:ring-pink-500 bg-slate-950 border-slate-800" />
                                                    <span className="text-sm text-slate-300">No</span>
                                                </label>
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                                                placeholder={field.placeholder}
                                            />
                                        )}
                                    </div>
                                ))
                            )}
                            <div className="pt-4">
                                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                                    {selectedNode.data.submitLabel || 'Submit'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}