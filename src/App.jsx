import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import InvitePage from './pages/InvitePage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import MainLayout from './components/layout/MainLayout';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="user"><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/builder" element={<WorkflowBuilder />} />
            <Route path="/executions" element={<Executions />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/team" element={<TeamHQ />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="admin"><MainLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Public facing app route */}
          <Route path="/app" element={<UserApp />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/legal" element={<LegalPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;