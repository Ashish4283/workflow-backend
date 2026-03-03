import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Brain } from 'lucide-react';

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-background flex flex-col justify-center relative overflow-hidden text-foreground">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10"></div>
                <div className="absolute inset-0 hero-pattern opacity-40"></div>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
            </div>

            <div className="relative z-20 flex flex-col sm:justify-center items-center pt-6 sm:pt-0">
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Link to="/" className="flex flex-col items-center gap-3 group">
                        <div className="p-3 rounded-2xl bg-card/80 shadow-2xl border border-white/10 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-300">
                            <Brain className="w-10 h-10 text-primary animate-pulse-glow" />
                        </div>
                        <h1 className="text-3xl font-bold font-outfit tracking-tight text-white drop-shadow-md">
                            Reasoning Engine
                        </h1>
                    </Link>
                </div>

                <div className="w-full sm:max-w-md px-6 py-8 bg-card/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-500 delay-150">
                    <Outlet />
                </div>

                <div className="mt-8 text-center text-sm text-slate-500">
                    &copy; {new Date().getFullYear()} Reasoning Engine AI. All rights reserved.
                </div>
            </div>
        </div>
    );
}
