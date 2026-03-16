import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { workflowEngine } from './lib/workflow-engine';
import { storageAdapter } from './lib/workflow-storage';
import { Loader2, Upload, Check, AlertTriangle, File as FileIcon, UploadCloud, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { Minus, Plus, RefreshCcw, Trophy, Save, Table, Download, Trash2, Filter, Search as SearchIcon, ArrowDownWideZap, Table2, Info } from 'lucide-react';

const DataReviewGrid = ({ nodes, data, onSave }) => {
    const [gridData, setGridData] = useState(data || []);
    const [selectedRows, setSelectedRows] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const columns = useMemo(() => {
        if (gridData.length === 0) return [];
        return Object.keys(gridData[0]).map(key => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
        }));
    }, [gridData]);

    const filteredData = gridData.filter(row => 
        Object.values(row).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const handleCellChange = (rowIndex, key, value) => {
        const newData = [...gridData];
        newData[rowIndex] = { ...newData[rowIndex], [key]: value };
        setGridData(newData);
    };

    const toggleSelect = (id) => {
        setSelectedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkApprove = () => {
        const newData = gridData.map((row, idx) => 
            selectedRows.includes(gridData.indexOf(row)) ? { ...row, status: 'approved' } : row
        );
        setGridData(newData);
    };

    if (gridData.length === 0) return <div className="p-12 text-center text-slate-500 italic">No data rows found in the task pool.</div>;

    return (
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Enterprise Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-4 bg-zinc-900 border border-white/5 rounded-2xl shadow-xl gap-4 sticky top-4 z-50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <Table2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">Task Ledger</h2>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold">{gridData.length} records in queue</p>
                    </div>
                </div>

                <div className="flex-1 max-w-sm relative">
                    <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input 
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-300 focus:outline-none focus:border-amber-500/50 transition-all" 
                        placeholder="Search records..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    {selectedRows.length > 0 && (
                        <button 
                            onClick={handleBulkApprove}
                            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-tighter rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            Approve {selectedRows.length} rows
                        </button>
                    )}
                    <button 
                        onClick={() => onSave(gridData)}
                        className="px-6 py-2 bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 active:scale-95 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                    >
                        {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Submit Ledger
                    </button>
                </div>
            </div>

            {/* High-Fidelity Data Grid */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl shadow-2xl overflow-hidden border-separate border-spacing-0">
                <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/60 sticky top-0 z-10 border-b border-white/10 uppercase font-black text-[10px] text-slate-500 tracking-[0.2em] select-none">
                                <th className="px-6 py-5 text-center w-12 border-r border-white/5">
                                    <input type="checkbox" className="rounded border-white/10 bg-transparent text-amber-500 focus:ring-amber-500" onChange={(e) => {
                                        if (e.target.checked) setSelectedRows(gridData.map((_, i) => i));
                                        else setSelectedRows([]);
                                    }} />
                                </th>
                                {columns.map(col => (
                                    <th key={col.key} className="px-6 py-5 border-r border-white/5 last:border-r-0">
                                        <div className="flex items-center justify-between">
                                            {col.label}
                                            <ArrowDownWideZap className="w-3 h-3 text-slate-700" />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row, rowIndex) => (
                                <tr key={rowIndex} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors group ${selectedRows.includes(gridData.indexOf(row)) ? 'bg-amber-500/5' : ''}`}>
                                    <td className="px-6 py-4 text-center border-r border-white/5">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedRows.includes(gridData.indexOf(row))}
                                            onChange={() => toggleSelect(gridData.indexOf(row))}
                                            className="rounded border-white/10 bg-transparent text-amber-500 focus:ring-amber-500" 
                                        />
                                    </td>
                                    {columns.map(col => {
                                        const isStatus = col.key === 'status';
                                        const value = row[col.key];
                                        return (
                                            <td key={col.key} className="p-0 border-r border-white/5 last:border-r-0">
                                                {isStatus ? (
                                                    <div className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                                                            value === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                                            value === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                                                            'bg-zinc-800 text-slate-400 border border-white/5'
                                                        }`}>
                                                            {value || 'pending'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <input 
                                                        className="w-full bg-transparent px-6 py-4 text-xs text-slate-300 font-mono focus:outline-none focus:bg-white/[0.04] focus:text-white transition-all caret-amber-500 border-none rounded-none"
                                                        value={value || ""}
                                                        onChange={(e) => handleCellChange(gridData.indexOf(row), col.key, e.target.value)}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Visual Footer Scoping */}
                <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Sync Connected</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <Info className="w-3 h-3 text-slate-600" />
                             <span className="text-[10px] font-bold text-slate-600 uppercase">Pro Tip: Use Enter to save current cell</span>
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                        Enterprise Ledger Node ID: {nodes?.find(n => n.type === 'qaNode')?.id || 'qa_001'}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CounterWidget = ({ data }) => {
    const [count, setCount] = useState(data.initialValue || 0);
    return (
        <div className="flex flex-col items-center gap-6 py-4 w-full">
            <h3 className="text-xl font-black text-white tracking-tight uppercase tracking-widest">{data.title || 'Counter'}</h3>
            <div className="text-7xl font-black font-mono text-primary animate-in zoom-in duration-300 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                {count}
            </div>
            <div className="flex gap-4">
                <button 
                  onClick={() => setCount(prev => prev - 1)}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
                >
                    <Minus className="w-6 h-6 text-slate-400" />
                </button>
                <button 
                  onClick={() => setCount(0)}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
                >
                    <RefreshCcw className="w-5 h-5 text-slate-500" />
                </button>
                <button 
                  onClick={() => setCount(prev => prev + 1)}
                  className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-90"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const ScoreboardWidget = ({ data }) => {
    const [scoreA, setScoreA] = useState(0);
    const [scoreB, setScoreB] = useState(0);
    
    return (
        <div className="flex flex-col items-center gap-8 py-4 w-full">
             <div className="flex items-center gap-3 text-amber-400">
                <Trophy className="w-5 h-5 fill-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-[0.3em]">{data.title || 'Scoreboard'}</h3>
             </div>
             
             <div className="flex justify-between w-full gap-8">
                 {/* Team A */}
                 <div className="flex-1 space-y-4">
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Team Alpha</div>
                     <div className="text-6xl font-black text-white font-mono bg-black/40 py-6 rounded-2xl border border-white/5">{scoreA}</div>
                     <div className="flex gap-2">
                        <button onClick={() => setScoreA(s => Math.max(0, s-1))} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-slate-400 font-bold">-</button>
                        <button onClick={() => setScoreA(s => s+1)} className="flex-[2] py-3 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all font-bold">+</button>
                     </div>
                 </div>

                 <div className="flex items-center text-slate-700 font-black text-xl italic pt-8">VS</div>

                 {/* Team B */}
                 <div className="flex-1 space-y-4">
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Team Bravo</div>
                     <div className="text-6xl font-black text-white font-mono bg-black/40 py-6 rounded-2xl border border-white/5">{scoreB}</div>
                     <div className="flex gap-2 text-right">
                        <button onClick={() => setScoreB(s => s+1)} className="flex-[2] py-3 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all font-bold">+</button>
                        <button onClick={() => setScoreB(s => Math.max(0, s-1))} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-slate-400 font-bold">-</button>
                     </div>
                 </div>
             </div>

             <button 
                onClick={() => { setScoreA(0); setScoreB(0); }}
                className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
             >
                <RefreshCcw className="w-3 h-3" /> Reset Match
             </button>
        </div>
    );
};
export default function UserApp() {
    const [searchParams] = useSearchParams();
    const workflowId = searchParams.get('id');

    const [workflow, setWorkflow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("idle"); // idle, running, completed, error
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Form State
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        async function loadApp() {
            if (!workflowId) {
                setLoading(false);
                return;
            }
            try {
                const wf = await storageAdapter.loadWorkflow(workflowId);
                setWorkflow(wf);
            } catch (err) {
                setError("App not found. Please check the ID.");
            } finally {
                setLoading(false);
            }
        }
        loadApp();
    }, [workflowId]);

    const getOptions = (field) => {
        if (Array.isArray(field.options)) return field.options;
        if (typeof field.options === 'string') return field.options.split(',').map(o => o.trim());
        return [];
    };

    // Heuristic to determine App Type based on workflow nodes
    const isMediaApp = workflow?.nodes?.some(n => n.type === 'mediaConvert' || n.data?.type === 'mediaConvert');
    const appNode = workflow?.nodes?.find(n => n.type === 'appNode' || n.data?.type === 'appNode' || n.data?.type === 'userApp' || n.type === 'userApp' || n.data?.label === 'User App');
    const widgets = workflow?.nodes?.filter(n => n.data?.type === 'widgetNode');
    const hasWidgets = widgets?.length > 0;

    // Check if this is a Task Pool (Batch / Dependent) app
    const startNode = workflow?.nodes?.find(n => n.data.type === 'default');
    const isDependentTask = startNode?.data?.triggerType === 'manual' && startNode?.data?.manualTaskType === 'dependent';
    const isBulkCsvTrigger = startNode?.data?.triggerType === 'bulk_csv';
    const isBatchMode = isDependentTask || isBulkCsvTrigger;

    const parseCSV = (file) => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (error) => reject(error)
            });
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("running");
        setResult(null);
        setError(null);

        try {
            if (isBatchMode) {
                // Batch Upload Mode: Parse CSV and Send to Tasks API
                if (!file) throw new Error("Please upload a CSV file with your data rows.");

                setStatus("running"); // Optional custom text if needed "Parsing..."
                const parsedData = await parseCSV(file);

                if (parsedData.length === 0) throw new Error("The uploaded file contains no data rows.");

                const tasks = parsedData.map(row => ({
                    data: row,
                    external_ref: row.id || row.email || null // attempt to pull a useful ref id from standard names
                }));

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/tasks/create.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('saas_token')}`
                    },
                    body: JSON.stringify({
                        workflow_id: workflowId,
                        tasks: tasks
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || "Failed to create task batch");
                }

                const responseData = await response.json();
                setResult({ message: responseData.message || `Successfully pushed ${tasks.length} tasks to the worker pool.` });
                setStatus("completed");

            } else {
                // Standard Direct Execution
                const payload = {
                    ...formData,
                    file: file, // Pass the actual File object
                    fileName: file?.name,
                    timestamp: new Date().toISOString()
                };

                const resultContext = await workflowEngine.execute(workflowId, payload, {
                    onLog: (log) => console.log(`[App Log] ${log.message}`)
                });

                // Find the result from the media node if it exists, or the last node
                let output = resultContext.results;
                if (isMediaApp) {
                    const mediaNode = workflow.nodes.find(n => n.data.type === 'mediaConvert');
                    if (mediaNode && resultContext.results[mediaNode.id]) {
                        output = resultContext.results[mediaNode.id];
                    }
                }

                setResult(output);
                setStatus("completed");
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
            setStatus("error");
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
    if (!workflow) return <div className="flex h-screen items-center justify-center text-gray-500">No App ID provided. Launch this from the Builder.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">{workflow.name}</h2>
                    <p className="mt-2 text-sm text-gray-600">Generated App v{workflow.version}</p>
                </div>

                {status === 'completed' ? (
                    <div className="rounded-md bg-green-50 p-4 text-center animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center mb-4">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium text-green-800">Success!</h3>
                        <div className="mt-2 text-sm text-green-700">
                            {isMediaApp && result?.url ? (
                                <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none">
                                    Download Converted File
                                </a>
                            ) : isBatchMode ? (
                                <div className="text-left bg-white p-4 rounded border border-green-200">
                                    <p className="text-sm font-medium">{result?.message || 'Tasks created successfully.'}</p>
                                    <p className="text-xs text-gray-500 mt-2">Team members can now pick up these tasks from the dashboard.</p>
                                </div>
                            ) : (
                                <pre className="text-left bg-white p-2 rounded border border-green-200 overflow-auto max-h-40">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            )}
                        </div>
                        <button
                            onClick={() => { setStatus('idle'); setFile(null); setResult(null); }}
                            className="mt-4 text-sm text-green-600 hover:text-green-500 font-medium"
                        >
                            Start Over
                        </button>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {isMediaApp || isBatchMode ? (
                            <div className="space-y-4">
                                {isBatchMode && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <Users className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-800">Batch Assignment Mode</h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <p>Upload a CSV file containing your dependent task data. Each row will be queued as an individual task for the assigned team to complete.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-purple-400 transition-colors bg-gray-50">
                                    <div className="space-y-1 text-center">
                                        {file ? (
                                            <div className="flex flex-col items-center">
                                                <FileIcon className="mx-auto h-12 w-12 text-purple-500" />
                                                <p className="text-sm text-gray-700 mt-2 font-medium">{file.name}</p>
                                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 mt-2 hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600 justify-center">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none">
                                                        <span>Upload a file</span>
                                                        <input id="file-upload" name="file-upload" type="file" accept={isBatchMode ? ".csv" : "*"} className="sr-only" onChange={(e) => setFile(e.target.files[0])} required />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500">{isBatchMode ? "CSV Files Only" : "Audio, Video, Images, or Documents"}</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : appNode ? (
                            <div className="space-y-4 text-left">
                                {(appNode.data.fields || []).map((field, i) => (
                                    <div key={i} className="space-y-1">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {field.label}
                                            {field.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>

                                        {field.type === 'textarea' || field.type === 'longText' ? (
                                            <textarea
                                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder={field.placeholder || ''}
                                                required={field.required}
                                                onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                                rows={4}
                                            />
                                        ) : field.type === 'select' ? (
                                            <select
                                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                                required={field.required}
                                                onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            >
                                                <option value="">Select an option</option>
                                                {getOptions(field).map((opt, idx) => (
                                                    <option key={idx} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                className="w-full rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder={field.placeholder || ''}
                                                required={field.required}
                                                onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : hasWidgets ? (
                            <div className="space-y-6">
                                {widgets.map((w, idx) => (
                                    <div key={idx} className="p-6 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden relative group">
                                         {/* Decorative backdrop */}
                                         <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                         
                                         <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                                            {w.data.widgetType === 'counter' && (
                                                <CounterWidget data={w.data} />
                                            )}
                                            {w.data.widgetType === 'scoreboard' && (
                                                <ScoreboardWidget data={w.data} />
                                            )}
                                            {!['counter', 'scoreboard'].includes(w.data.widgetType) && (
                                                <div className="py-8 text-slate-500 italic">Widget '{w.data.widgetType}' is coming soon to the PWA runtime.</div>
                                            )}
                                         </div>
                                    </div>
                                ))}
                            </div>
                        ) : workflow?.nodes?.some(n => n.data?.type === 'qaNode') ? (
                           <DataReviewGrid 
                              nodes={workflow.nodes} 
                              data={result || []} 
                              onSave={(newData) => {
                                  console.log("Saving QA Submissions...", newData);
                                  toast({ title: "Ledger Submitted", description: "All manual reviews have been reconciled." });
                              }} 
                           />
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Input Data (JSON)</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    rows={4}
                                    placeholder='{"email": "..."}'
                                    onChange={(e) => {
                                        try {
                                            setFormData(JSON.parse(e.target.value || '{}'));
                                        } catch (e) {
                                            // Ignore parse errors as user types
                                        }
                                    }}
                                />
                            </div>
                        )}

                        {error && (
                            <div className="rounded-md bg-red-50 p-4 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {!isBatchMode && !isMediaApp && (
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        // Specific assignment logic could be added here later,
                                        // for now it acts as an explicit "Claim Task & Run" action
                                        handleSubmit(e);
                                    }}
                                    disabled={status === 'running'}
                                    className={`relative w-1/3 flex justify-center py-2 px-4 border border-purple-200 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all`}
                                >
                                    Assign to me
                                </button>
                                <button
                                    type="submit"
                                    disabled={status === 'running'}
                                    className={`group relative w-2/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${status === 'running' ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all`}
                                >
                                    {status === 'running' ? (
                                        <>
                                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Run App'
                                    )}
                                </button>
                            </div>
                        )}

                        {(isBatchMode || isMediaApp) && (
                            <button
                                type="submit"
                                disabled={status === 'running'}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${status === 'running' ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all`}
                            >
                                {status === 'running' ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                        Processing...
                                    </>
                                ) : (
                                    isBatchMode ? 'Push Tasks to Queue' : 'Convert File'
                                )}
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
}