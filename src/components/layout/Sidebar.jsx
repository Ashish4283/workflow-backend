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
    User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SidebarLink = ({ to, icon: Icon, label, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={cn(
            "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
            active
                ? "bg-primary/15 text-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
        )}
    >
        {active && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />
        )}
        <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", active && "text-primary")} />
        <span className="font-medium text-sm tracking-wide">{label}</span>
        {active && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
    </Link>
);

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';

    const navLinks = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Hub' },
        { to: '/builder', icon: Workflow, label: 'Processes' },
        { to: '/team', icon: Users, label: 'Team HQ' },
    ];

    if (isAdmin) {
        navLinks.push({ to: '/admin', icon: Shield, label: 'Admin Console' });
    }

    return (
        <aside className="w-72 flex flex-col h-screen border-r border-white/5 bg-slate-950/40 backdrop-blur-2xl relative z-40">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

            {/* Brand */}
            <div className="h-20 flex items-center px-8 border-b border-white/5">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500" />
                        <div className="relative p-2 bg-slate-900 rounded-lg border border-white/10">
                            <Brain className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-outfit font-bold text-lg leading-tight tracking-tight text-white group-hover:text-primary transition-colors">
                            Creative 4 AI
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enterprise</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                <div className="px-4 mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</span>
                </div>

                {navLinks.map((link) => (
                    <SidebarLink
                        key={link.to}
                        {...link}
                        active={location.pathname === link.to}
                    />
                ))}

                <div className="pt-6 px-4">
                    <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary group"
                    >
                        <Link to="/builder">
                            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Create New</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* User / Profile */}
            <div className="p-4 border-t border-white/5 space-y-2">
                <div className="px-4 mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account</span>
                </div>

                <div
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 mb-2 group transition-all hover:bg-white/10 cursor-pointer"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary p-[2px] shadow-lg shadow-primary/20">
                        <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
                            <User className="w-5 h-5 text-white/80" />
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{user?.role || 'Member'}</span>
                    </div>
                </div>

                <Link
                    to="/settings"
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
                >
                    <Settings className="w-4 h-4" /> Settings
                </Link>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>
        </aside>
    );
}
