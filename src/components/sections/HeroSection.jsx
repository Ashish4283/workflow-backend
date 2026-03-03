import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Brain, Palette, Zap, ChevronDown, Hammer, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../context/AuthContext';

const HeroSection = ({ scrollToSection }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLaunch = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden mesh-gradient">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[128px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 blur-[128px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/10 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 glass-effect"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              The Evolution of Digital Intelligence
            </span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black font-outfit leading-[0.9] tracking-tighter text-white mb-8">
            Build the <span className="text-gradient">Future</span> <br className="hidden md:block" />
            of Reasoning.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
            Unleash the next generation of AI-driven automation.
            A professional-grade environment where complex logic meets intuitive design.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleLaunch} size="lg" className="h-16 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/40 transition-all group animate-shine">
                <Hammer className="w-5 h-5 group-hover:-rotate-12 transition-transform mr-3" />
                Launch Control Center
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                className="h-16 px-10 rounded-2xl border-white/10 hover:bg-white/5 text-white font-black uppercase tracking-widest text-xs transition-all"
                onClick={() => scrollToSection('studio')}
              >
                The Hub
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Floating Pro Visuals */}
        <motion.div
          className="absolute top-[15%] left-[5%] hidden lg:block"
          animate={{
            y: [0, -30, 0],
            rotate: [0, 8, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-3xl">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Brain className="w-8 h-8 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-[20%] right-[8%] hidden lg:block"
          animate={{
            y: [0, 40, 0],
            rotate: [0, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="glass-effect p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-3xl">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <Zap className="w-8 h-8 text-accent" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-[40%] right-[12%] hidden lg:block"
          animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="glass-effect p-5 rounded-3xl border border-white/5 shadow-2xl">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        onClick={() => scrollToSection('about')}
        role="button"
        aria-label="Scroll to about section"
      >
        <ChevronDown className="w-6 h-6 text-muted-foreground" />
      </motion.div>
    </section>
  );
};

export default HeroSection;