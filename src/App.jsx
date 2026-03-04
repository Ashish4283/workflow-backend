import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2, Upload, Check, AlertTriangle, File as FileIcon } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import Home from './components/sections/Home';
import WorkflowBuilder from './components/sections/WorkflowBuilder';
import UserApp from './UserApp';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './components/auth/AuthLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard.jsx';
import TeamHQ from './pages/Dashboard/TeamHQ.jsx';
import Settings from './pages/Dashboard/Settings.jsx';
import Executions from './pages/Dashboard/Executions.jsx';
import Credentials from './pages/Dashboard/Credentials.jsx';
import Insights from './pages/Dashboard/Insights.jsx';
import TemplatesPage from './pages/Dashboard/TemplatesPage.jsx';
import TestApps from './pages/Dashboard/TestApps.jsx';
import ProductionApps from './pages/Dashboard/ProductionApps.jsx';
import InvitePage from './pages/InvitePage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import KnowledgeBase from './pages/Dashboard/KnowledgeBase.jsx';
import MainLayout from './components/layout/MainLayout';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, logs: [] };

    // Intercept console logs to preserve them during a crash
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
      this.setState(s => ({ logs: [...s.logs.slice(-20), `[LOG] ${args.join(' ')}`] }));
      originalLog.apply(console, args);
    };
    console.error = (...args) => {
      this.setState(s => ({ logs: [...s.logs.slice(-20), `[ERR] ${args.join(' ')}`] }));
      originalError.apply(console, args);
    };
  }

  static getDerivedStateFromError(error) { return { hasError: true, error }; }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  copyToClipboard = () => {
    const diagnosticData = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      recentLogs: this.state.logs,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
    alert("Diagnostics copied to clipboard! Please paste this in our chat.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-slate-950 flex items-center justify-center min-h-screen font-outfit">
          <div className="max-w-2xl w-full space-y-8 bg-black/40 p-8 rounded-[2rem] border border-red-500/20 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Critical System Failure</h1>
              <p className="text-slate-400">Our enterprise core encountered an unhandled exception. Diagnostics have been captured.</p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-red-950/20 rounded-2xl border border-red-500/10 font-mono text-sm overflow-auto max-h-[300px] custom-scrollbar">
                <div className="text-red-400 font-bold mb-2">Error: {this.state.error?.message}</div>
                <div className="text-red-300 opacity-60 text-[10px] whitespace-pre-wrap leading-relaxed">
                  {this.state.error?.stack}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-4 pt-4 border-t border-red-500/10">
                    <div className="text-blue-400 font-bold mb-2 text-xs uppercase tracking-widest">Component Trace:</div>
                    <div className="text-blue-300 opacity-60 text-[10px] whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  Reload System
                </button>
                <button
                  onClick={this.copyToClipboard}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center gap-2 group"
                >
                  <FileIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Copy Diagnostics
                </button>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-600 uppercase font-black tracking-[0.3em]">
              Creative 4 AI • Enterprise Resilience v2.0
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  console.log("App Component Initializing... v2026.03.04-ULTRA_LOGS");
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<ProtectedRoute requiredRole="agent"><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/builder" element={<ProtectedRoute requiredRole="tech_user"><WorkflowBuilder /></ProtectedRoute>} />
              <Route path="/test-apps" element={<TestApps />} />
              <Route path="/prod-apps" element={<ProductionApps />} />
              <Route path="/executions" element={<Executions />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/credentials" element={<Credentials />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/team" element={<TeamHQ />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
            </Route>

            <Route element={<ProtectedRoute requiredRole="admin"><MainLayout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="/app" element={<UserApp />} />
            <Route path="/invite" element={<InvitePage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;