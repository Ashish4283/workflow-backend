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
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Global Error Caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-950 text-red-200 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Critical System Failure</h1>
          <pre className="p-4 bg-black/40 rounded border border-red-500/30 overflow-auto">
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 rounded">Reload System</button>
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