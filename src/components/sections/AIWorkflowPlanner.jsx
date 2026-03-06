import React, { useState } from 'react';
import { Wand2, Loader2, X, CheckCircle, Play, ArrowRight, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';

const generateWorkflowPlan = async (prompt, apiKey) => {
  const systemInstruction = `
You are an expert Workflow Planner for a low-code automation platform.
Your goal is to understand the user's intent and generate a JSON plan for a node-based workflow.

**Available Node Types & Configurations:**
1. **appTrigger** (Start): { "title": "App Name", "interface": "upload" | "form" | "chat", "inputs": [] }
2. **fileRead** (Read Data): { "format": "csv" | "xlsx" | "json" }
3. **transform** (Data Processing): { "operation": "cleaning" | "normalize", "rules": [] }
4. **mrMapping** (Data Mapping): { "operation": "sku_map" | "mapping", "threshold": 0.85 }
5. **aiNode** (AI Tasks): { "taskType": "summarize" | "enrich" | "classify", "config": "prompt..." }
6. **apiNode** (External API): { "url": "https://...", "method": "GET" | "POST" }
7. **fileExport** (Save Output): { "destination": "drive" | "email", "format": "csv" }

**Output Format:**
Return ONLY raw JSON (no markdown formatting).
Structure:
{
  "nodes": [
    { "id": "step_1", "type": "node_type", "config": { ... } }
  ],
  "edges": [
    ["step_1", "step_2"]
  ]
}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemInstruction + "\n\nUser Request: " + prompt }] }]
      })
    });

    if (!response.ok) throw new Error('Gemini API Error');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    console.error("AI Planning Failed:", error);
    throw error;
  }
};

const NODE_TYPE_MAP = {
  appTrigger: 'appNode',
  fileRead: 'fileNode',
  transform: 'dataNode',
  mrMapping: 'dataNode',
  aiNode: 'aiNode',
  apiNode: 'apiNode',
  fileExport: 'exportNode',
  default: 'default'
};

export default function AIWorkflowPlanner({ open, onOpenChange, onPlanApplied }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');

  if (!open) return null;

  const handleGenerate = async () => {
    const effectiveKey = import.meta.env.VITE_GEMINI_API_KEY || apiKey;
    if (!prompt.trim() || !effectiveKey) return;

    setIsGenerating(true);
    try {
      const plan = await generateWorkflowPlan(prompt, effectiveKey);
      setGeneratedPlan(plan);
    } catch (error) {
      console.error("AI Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedPlan) return;

    const newNodes = generatedPlan.nodes.map((node, index) => {
      const mappedType = NODE_TYPE_MAP[node.type] || 'default';

      // Sanitize fields: Ensure options are strings
      if (node.config && node.config.fields) {
        node.config.fields = node.config.fields.map(f => ({
          ...f,
          options: Array.isArray(f.options) ? f.options.join(',') : f.options
        }));
      }

      return {
        id: node.id,
        type: 'workflowNode',
        position: { x: 100 + (index * 350), y: 100 },
        data: {
          label: node.config.title || node.type,
          type: mappedType,
          ...node.config
        }
      };
    });

    const newEdges = generatedPlan.edges.map((edge, i) => ({
      id: `e-${i}`,
      source: edge[0],
      target: edge[1],
      animated: true
    }));

    onPlanApplied(newNodes, newEdges);
    setGeneratedPlan(null);
    setPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-purple-500" /><h3 className="font-semibold text-slate-200">AI Workflow Planner</h3></div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 text-slate-400 hover:text-white"><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-6 space-y-6">
          {!generatedPlan ? (
            <div className="space-y-4">
              {!import.meta.env.VITE_GEMINI_API_KEY && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-2"><Key className="w-3 h-3" /> Gemini API Key</label>
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="Enter your API Key"
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('gemini_api_key', e.target.value); }}
                  />
                  <p className="text-[10px] text-slate-500">Key is stored locally in your browser.</p>
                </div>
              )}
              <div className="space-y-2"><label className="text-sm font-medium text-slate-300">Describe your workflow</label><textarea className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500 resize-none" placeholder="e.g. Create an app where user uploads Excel, cleans product names..." value={prompt} onChange={(e) => setPrompt(e.target.value)} /></div>
              <div className="flex justify-end"><Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim() || (!import.meta.env.VITE_GEMINI_API_KEY && !apiKey)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">{isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generate Plan</Button></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Plan Generated</h4>
                <div className="space-y-2">
                  {generatedPlan.nodes.map((node, i) => (
                    <div key={node.id} className="flex items-center gap-3 text-sm text-slate-400"><span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono">{i + 1}</span><span className="font-medium text-slate-200">{node.type}</span><ArrowRight className="w-3 h-3" /><span className="truncate opacity-70">{JSON.stringify(node.config)}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setGeneratedPlan(null)}>Back</Button><Button onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white gap-2"><Play className="w-4 h-4" /> Apply to Canvas</Button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}