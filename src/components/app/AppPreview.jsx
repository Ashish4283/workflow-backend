import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { storageAdapter } from '@/lib/workflow-storage';
import { workflowEngine } from '@/lib/workflow-engine';
import { Loader2, AlertTriangle, CheckCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export default function AppPreview() {
    const [searchParams] = useSearchParams();
    const [workflow, setWorkflow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        loadWorkflow();
    }, []);

    const loadWorkflow = async () => {
        try {
            const id = searchParams.get('id');
            let wf;

            if (id) {
                wf = await storageAdapter.loadWorkflow(id);
            } else {
                // Fallback: Load the most recent workflow if no ID provided
                const list = await storageAdapter.listWorkflows();
                if (list.length > 0) {
                    wf = await storageAdapter.loadWorkflow(list[0].id);
                }
            }

            if (!wf) throw new Error("No workflow found.");
            setWorkflow(wf);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getAppNode = () => {
        if (!workflow) return null;
        return workflow.nodes.find(n => n.type === 'appNode' || n.data?.type === 'appNode' || n.type === 'userApp' || n.data?.type === 'userApp' || n.data?.label === 'User App');
    };

    const getOptions = (field) => {
        if (Array.isArray(field.options)) return field.options;
        if (typeof field.options === 'string') return field.options.split(',').map(o => o.trim());
        return [];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);

        try {
            const payload = {
                ...formData,
                _meta: { timestamp: new Date().toISOString(), source: 'app_preview' }
            };

            const execution = await workflowEngine.execute(workflow.id, payload, {
                environment: workflow.environment || 'draft'
            });

            setResult(execution);
            if (execution.status === 'failed') throw new Error("Workflow execution failed.");

            toast({ title: "Success", description: "Workflow executed successfully." });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-slate-50 text-red-500 flex-col gap-2"><AlertTriangle className="w-8 h-8" /><p>{error}</p></div>;

    const appNode = getAppNode();

    if (!appNode) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-slate-700">No App Interface Found</h2>
                    <p className="mt-2">This workflow does not have a "User App" node configured.</p>
                </div>
            </div>
        );
    }

    const { appTitle, description, fields, submitLabel } = appNode.data;

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white">{appTitle || 'Untitled App'}</h1>
                    {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {(fields || []).map((field, i) => (
                        <div key={i} className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-700">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {field.type === 'textarea' ? (
                                <textarea
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                                    type={field.type}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                />
                            )}
                        </div>
                    ))}

                    <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        {submitLabel || 'Submit'}
                    </Button>
                </form>

                {result && (
                    <div className={`border-t ${result.status === 'completed' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} p-6`}>
                        <div className="flex items-center gap-2 mb-2">
                            {result.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                            <h3 className={`font-semibold ${result.status === 'completed' ? 'text-green-800' : 'text-red-800'}`}>
                                {result.status === 'completed' ? 'Success' : 'Failed'}
                            </h3>
                        </div>
                        <pre className="text-xs bg-white/50 p-3 rounded border border-black/5 overflow-auto max-h-40">
                            {JSON.stringify(result.results, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}