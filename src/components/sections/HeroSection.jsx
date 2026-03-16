import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Brain, Palette, Zap, ChevronDown, Hammer, Activity } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../context/AuthContext';
import scoreboardVideo from '@/img/Portfolio/Scoreboard_Demo.mp4';

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

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center lg:text-left"
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

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <a
                href="https://creative4ai.com/scoreboard/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors group"
              >
                <span className="px-2 py-0.5 rounded-lg bg-primary text-[10px] font-bold text-white uppercase tracking-wider">New</span>
                <span className="text-sm font-semibold text-primary underline-offset-4 group-hover:underline">Scoreboard PWA is Live!</span>
                <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-outfit leading-[0.9] tracking-tighter text-white mb-8">
              Build the <span className="text-gradient">Future</span> <br className="hidden md:block" />
              of Reasoning.
            </h1>

            <p className="text-lg text-slate-400 mb-12 max-w-xl lg:mx-0 mx-auto font-medium leading-relaxed">
              Unleash the next generation of AI-driven automation.
              A professional-grade environment where complex logic meets intuitive design.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center">
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

          {/* Mobile Showcase Frame */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="hidden lg:flex justify-center items-center relative"
          >
            <div className="relative group">
              {/* Outer Glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary to-accent opacity-20 blur-[30px] rounded-[3.5rem] group-hover:opacity-40 transition-opacity" />
              
              {/* Phone Frame */}
              <div className="relative w-[300px] h-[610px] bg-slate-950 rounded-[3.5rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-900 rounded-b-3xl z-30 flex items-center justify-center">
                  <div className="w-10 h-1 bg-white/10 rounded-full" />
                </div>
                
                <video
                  className="w-full h-full object-cover"
                  src={scoreboardVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
                
                {/* Screen Glare Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-30" />
              </div>
              
              {/* Floating Decorative Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-10 glass-effect p-4 rounded-3xl border border-white/10 shadow-xl"
              >
                <Sparkles className="w-6 h-6 text-primary" />
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-6 -left-10 glass-effect p-4 rounded-3xl border border-white/10 shadow-xl"
              >
                <Activity className="w-6 h-6 text-accent" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Floating Pro Visuals - Kept for depth but repositioned */}
        <motion.div
          className="absolute top-[20%] right-[45%] hidden xl:block"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <div className="glass-effect p-4 rounded-2xl border border-white/5 shadow-xl">
            <Brain className="w-6 h-6 text-primary/50" />
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