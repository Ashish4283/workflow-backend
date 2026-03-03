import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { workflowEngine } from './lib/workflow-engine';
import { storageAdapter } from './lib/workflow-storage';
import { Loader2, Upload, Check, AlertTriangle, File as FileIcon } from 'lucide-react';

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

    // Heuristic to determine App Type based on workflow nodes
    const isMediaApp = workflow?.nodes?.some(n => n.data.type === 'mediaConvert');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("running");
        setResult(null);
        setError(null);

        try {
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
                        {isMediaApp ? (
                            <div className="space-y-4">
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
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0])} required />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500">Audio, Video, Images, or Documents</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Input Data (JSON)</label>
                                <textarea
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                    rows={4}
                                    placeholder='{"email": "..."}'
                                    onChange={(e) => setFormData(JSON.parse(e.target.value || '{}'))}
                                />
                            </div>
                        )}

                        {error && (
                            <div className="rounded-md bg-red-50 p-4 flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

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
                                isMediaApp ? 'Convert File' : 'Run App'
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}