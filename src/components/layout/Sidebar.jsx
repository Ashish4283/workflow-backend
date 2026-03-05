import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Brain,
    LayoutDashboard,
    Workflow,
    Users,
    Settings,
    LogOut,
    Shield,
    PlusCircle,
    ChevronRight,
    User,
    Activity,
    Layout,
    Key,
    PieChart,
    HelpCircle,
    ChevronLeft,
    X,
    Zap,
    Menu,
    Monitor,
    Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const SidebarLink = ({ to, icon: Icon, label, active, onClick, isCollapsed }) => (
    <Link
        to={to}
        onClick={onClick}
        title={isCollapsed ? label : ''}
        className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden justify-center",
            isCollapsed ? "justify-center" : "lg:justify-start",
            active
                ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
        )}
    >
        {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
        )}
        <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110 shrink-0", active && "text-primary")} />
        {!isCollapsed && <span className="font-medium text-sm tracking-wide hidden lg:inline">{label}</span>}
        {!isCollapsed && active && <ChevronRight className="w-4 h-4 ml-auto opacity-50 hidden lg:block" />}
    </Link>
);

export default function Sidebar({ isCollapsed = false, onCollapse = () => { }, onMobileClose }) {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isSuperAdmin = user?.role === 'super_admin';
    const isAdmin = user?.role === 'admin';
    const isManager = user?.role === 'manager';
    const isTechUser = user?.role === 'tech_user';
    const isAgent = user?.role === 'agent';

    const mainLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    ];

    // Tech Users and higher can see/edit Workflows
    if (!isAgent) {
        mainLinks.push({ to: '/builder', icon: Workflow, label: 'Workflows' });
    }

    // Tech Users see both dashboards, Agents see Production + Test for practice
    if (isTechUser || isSuperAdmin || isAdmin || isManager) {
        mainLinks.push({ to: '/test-apps', icon: Zap, label: 'App Test Dashboard' });
    } else if (isAgent) {
        mainLinks.push({ to: '/test-apps', icon: HelpCircle, label: 'Practice (Test Apps)' });
    }

    mainLinks.push({ to: '/prod-apps', icon: Monitor, label: 'App Production Dashboard' });

    mainLinks.push({ to: '/executions', icon: Activity, label: 'Execution Logs' });

    if (!isAgent) {
        mainLinks.push({ to: '/templates', icon: Layout, label: 'Templates' });
    }

    const mgmtLinks = [
        { to: '/credentials', icon: Key, label: 'Credentials' },
        { to: '/team', icon: Users, label: 'Team HQ' },
        { to: '/insights', icon: PieChart, label: 'Insights' },
    ];

    if (user?.role === 'admin' || user?.role === 'super_admin') {
        mgmtLinks.push({ to: '/admin', icon: Shield, label: 'Admin Portal' });
    }

    return (
        <aside
            className={cn(
                "flex flex-col h-screen border-r border-white/5 bg-slate-950/80 backdrop-blur-2xl relative z-40 transition-all duration-500 ease-in-out overflow-hidden shadow-2xl",
                isCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

            {/* Brand */}
            <div className={cn(
                "h-20 flex items-center border-b border-white/5 transition-all duration-500 relative z-10",
                isCollapsed ? "px-4 justify-center" : "px-8 justify-between"
            )}>
                <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 group">
                    <div className="relative shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500" />
                        <div className="relative p-2 bg-slate-900 rounded-lg border border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                            <Brain className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0 animate-in fade-in slide-in-from-left-2">
                            <span className="font-outfit font-bold text-lg leading-tight tracking-tight text-white group-hover:text-primary transition-colors">
                                Creative 4 AI
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise</span>
                        </div>
                    )}
                </Link>

                {!isCollapsed && !onMobileClose && (
                    <button
                        onClick={() => onCollapse(true)}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-500 hover:text-white"
                        title="Collapse"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}

                {onMobileClose && (
                    <button
                        onClick={onMobileClose}
                        className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-slate-500 hover:text-white"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {isCollapsed && (
                <div className="flex justify-center py-4 border-b border-white/5 relative z-10">
                    <button
                        onClick={() => onCollapse(false)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-primary/20 text-slate-500 hover:text-primary transition-all group"
                        title="Expand"
                    >
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            )}

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-8 px-4 space-y-6">
                <div className="space-y-2">
                    {!isCollapsed && (
                        <div className="px-4 mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</span>
                        </div>
                    )}
                    {mainLinks.map((link) => (
                        <SidebarLink
                            key={link.to}
                            {...link}
                            active={location.pathname === link.to}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </div>

                {(isSuperAdmin || isAdmin || isManager) && (
                    <div className="space-y-2">
                        {!isCollapsed && (
                            <div className="px-4 mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Management</span>
                            </div>
                        )}
                        {mgmtLinks.map((link) => (
                            <SidebarLink
                                key={link.to}
                                {...link}
                                active={location.pathname === link.to}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </div>
                )}

                {!isAgent && (
                    <div className="pt-2 px-4">
                        <Button
                            asChild
                            variant="outline"
                            className="w-full justify-center lg:justify-start gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary group rounded-xl"
                            title={isCollapsed ? 'Initiate Flow' : ''}
                        >
                            <Link to="/builder">
                                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300 shrink-0" />
                                {!isCollapsed && <span>Initiate Flow</span>}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>

            {/* User / Profile */}
            <div className="p-4 border-t border-white/5 space-y-2">
                {!isCollapsed && (
                    <div className="px-4 mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account</span>
                    </div>
                )}

                <div
                    onClick={() => navigate('/settings')}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 mb-2 group transition-all hover:bg-white/10 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? `${user?.name || 'User'}` : ''}
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary p-[2px] shadow-lg shadow-primary/20 shrink-0">
                        <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
                            <User className="w-5 h-5 text-white/80" />
                        </div>
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{user?.role || 'Member'}</span>
                        </div>
                    )}
                </div>

                <Link
                    to="/settings"
                    title={isCollapsed ? 'Settings' : ''}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors justify-center lg:justify-start"
                >
                    <Settings className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Settings</span>}
                </Link>

                <button
                    onClick={logout}
                    title={isCollapsed ? 'Sign Out' : ''}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors justify-center lg:justify-start"
                >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
