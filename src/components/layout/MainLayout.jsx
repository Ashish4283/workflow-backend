import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MainLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex bg-[#00122e] min-h-screen text-slate-100 font-inter selection:bg-primary/30">
            {/* Dynamic Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
                <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-secondary/15 blur-[100px]" />
                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-accent/10 blur-[130px]" />
            </div>

            {/* Desktop Sidebar */}
            <div className={`hidden lg:flex relative z-30 transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}>
                <Sidebar isCollapsed={isSidebarCollapsed} onCollapse={setIsSidebarCollapsed} />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar onMobileClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden h-screen">
                {/* Top Header / Bar */}
                <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-white/5 bg-slate-950/20 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Search Bar - Professional Look */}
                        <div className="hidden md:flex items-center flex-1 max-w-md relative group">
                            <Search className="w-4 h-4 absolute left-3 text-slate-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search workflows, users, or data..."
                                className="w-full h-10 bg-white/5 border border-white/5 focus:border-primary/50 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6">
                        <button className="relative p-2 text-slate-400 hover:text-white transition-colors group">
                            <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-slate-900 group-hover:animate-pulse" />
                        </button>
                        <div className="h-8 w-[1px] bg-white/5 hidden sm:block" />
                        <Button className="hidden sm:flex rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95">
                            Support
                        </Button>
                    </div>
                </header>

                {/* Global Page Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
