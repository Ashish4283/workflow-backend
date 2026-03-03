import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import logoUrl from '@/img/logo.svg';

const Navbar = ({ isDark, toggleTheme, scrollToSection, activeSection }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = ['home', 'about', 'portfolio', 'studio', 'contact'];

  const handleScrollAndCloseMenu = (sectionId) => {
    scrollToSection(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass-nav py-4 md:py-6"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); handleScrollAndCloseMenu('home'); }}
            className="group flex items-center gap-3 cursor-pointer"
          >
            <div className="relative">
              <img src={logoUrl} alt="Logo" className="h-10 w-auto group-hover:rotate-[360deg] transition-all duration-700 ease-out" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
            </div>
            <span className="text-xl font-black font-outfit tracking-tighter text-white">
              C4AI<span className="text-primary">.</span>
            </span>
          </a>

          <div className="hidden md:flex items-center bg-white/5 border border-white/5 rounded-2xl px-2 py-1 glass-effect">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  activeSection === item
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {item}
              </button>
            ))}
            <div className="w-[1px] h-4 bg-white/10 mx-2" />
            <Link
              to="/builder"
              className="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Engine
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="hidden md:block text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
              Log In
            </Link>
            <Button
              asChild
              className="hidden md:flex h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <Link to="/register">Get Started</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden glass-effect mt-4 mx-4 rounded-3xl overflow-hidden border border-white/5"
          >
            <div className="p-6 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => handleScrollAndCloseMenu(item)}
                  className="block w-full text-left capitalize text-lg font-bold text-slate-200 hover:text-primary transition-colors"
                >
                  {item}
                </button>
              ))}
              <hr className="border-white/5" />
              <Link
                to="/builder"
                className="block w-full text-lg font-bold text-indigo-400"
                onClick={() => setIsMenuOpen(false)}
              >
                Workflow Builder
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;