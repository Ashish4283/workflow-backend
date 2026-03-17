import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Settings, 
  Play, 
  Square, 
  Shield, 
  Bot, 
  History,
  AlertTriangle,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketChart from './MarketChart';
import StrategyTuner from './StrategyTuner';
import CredentialManager from './CredentialManager';

const Dashboard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('paper');
  const [sensex, setSensex] = useState(72450.25);
  const [history, setHistory] = useState([]);
  const [pnl, setPnl] = useState(0);
  const [isBurst, setIsBurst] = useState(false);
  const [engineStatus, setEngineStatus] = useState('WANDERING');
  const [activePositions, setActivePositions] = useState([]);
  const [stats, setStats] = useState({ volatility: 0, confidence: 42 });
  const [ws, setWs] = useState(null);
  const [logs, setLogs] = useState([
    { id: 1, time: '09:15:00', msg: 'System initialized. Waiting for breakout...', type: 'info' },
    { id: 2, time: '10:05:23', msg: 'Momentum check active. Threshold: 120pts', type: 'info' }
  ]);
  const [activeTab, setActiveTab] = useState('trade');

  // WebSocket Connection
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5000/ws');
    
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'QUANTUM_TELEMETRY') {
        setSensex(msg.market.sensex);
        setIsBurst(msg.market.isBurst);
        setEngineStatus(msg.engineStatus);
        setStats(msg.stats);
        setHistory(prev => [...prev, msg.market.sensex].slice(-50));
        setActivePositions(msg.activePositions || []);
      }
      if (msg.type === 'STATUS_UPDATE') {
        setIsRunning(msg.isRunning);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const toggleSystem = async () => {
    try {
      const res = await fetch('/api/toggle', { method: 'POST' });
      const data = await res.json();
      setIsRunning(data.isRunning);
      addLog(data.isRunning ? 'System engaged. Market scanners active.' : 'System disengaged. Positions secured.', data.isRunning ? 'success' : 'info');
    } catch (err) {
      addLog('Failed to toggle system. Check server connection.', 'error');
    }
  };

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ id: Date.now(), time, msg, type }, ...prev].slice(0, 50));
  };

  return (
    <div className="min-h-screen bg-background text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 glass-card sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TradeMaster</h1>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-mono">Quantum Momentum v2.1</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isRunning ? 'bg-secondary/10 border-secondary/30 text-secondary' : 'bg-danger/10 border-danger/30 text-danger'} animate-pulse`}>
            {isRunning ? 'LIVE FEEDING' : 'IDLE'}
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Sensex Spot" 
              value={sensex.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
              sub={isBurst ? 'BREAKOUT DETECTED' : 'Normal Volatility'} 
              highlight={isBurst ? 'danger' : ''}
              trend={isBurst ? 1.2 : 0.05} 
            />
            <StatCard label="Engine Status" value={engineStatus} sub="Auto-Execution" highlight={engineStatus === 'IN_TRADE' ? 'success' : ''} />
            <StatCard label="Today's PnL" value={`₹${pnl.toFixed(2)}`} sub="Realized + Unmatched" highlight={pnl >= 0 ? 'success' : 'danger'} />
            <StatCard label="Win Rate" value="68.4%" sub="Monthly Avg" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Main Chart */}
              <MarketChart data={history} isBurst={isBurst} />
              <div className="glass-card rounded-3xl p-6 border border-white/5 neo-shadow overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-[80px]" />
                
                <div className="flex items-center justify-between mb-8 relative">
                  <div>
                    <h2 className="text-xl font-semibold">Strategy Engine</h2>
                    <p className="text-sm text-white/40">Momentum Breakout + Asymmetric Payoff</p>
                  </div>
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    <button 
                      onClick={() => setMode('paper')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'paper' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      Paper
                    </button>
                    <button 
                      onClick={() => setMode('live')}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === 'live' ? 'bg-danger text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                      Live
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-white/30 uppercase block mb-1">Trigger Condition</span>
                    <span className="text-sm font-medium">≥ 120 pts / 2m</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] text-white/30 uppercase block mb-1">Next Expiry</span>
                    <span className="text-sm font-medium">21 MAY (Weekly)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={toggleSystem}
                    className={`flex-1 h-14 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all transform active:scale-95 ${isRunning ? 'bg-danger/20 text-danger border border-danger/30 group hover:bg-danger/30' : 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90'}`}
                  >
                    {isRunning ? (
                      <>
                        <Square className="w-5 h-5 fill-current" />
                        STOP ENGINE
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 fill-current" />
                        START ENGINE
                      </>
                    )}
                  </button>
                  <button className="h-14 px-6 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
                    <Shield className="w-5 h-5 text-secondary" />
                  </button>
                </div>
              </div>

              {/* Positions Panel (Mobile Scrollable) */}
              <div className="glass-card rounded-3xl p-6 border border-white/5 neo-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Active Positions
                  </h3>
                  <span className="text-[10px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded">AUTO-TRAILING</span>
                </div>
                
                <div className="space-y-3">
                  {activePositions.length > 0 ? (
                    activePositions.map((pos, idx) => (
                      <PositionItem 
                        key={idx}
                        ticker={pos.direction === 'BULLISH' ? 'SENSEX BULL STRANGLE' : 'SENSEX BEAR STRANGLE'} 
                        qty={50} 
                        entry={pos.entryPrice.toFixed(2)} 
                        ltp={sensex.toFixed(2)} 
                        pnl={((sensex - pos.entryPrice) * 50).toFixed(2)} 
                        status={pos.status}
                      />
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                        <Activity className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">No active positions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar / Logs Panel */}
            <div className="space-y-6">
              <StrategyTuner />
              <CredentialManager />

              <div className="glass-card rounded-3xl p-6 border border-white/5 neo-shadow h-full flex flex-col max-h-[400px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Terminal</h3>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-danger/50" />
                    <div className="w-2 h-2 rounded-full bg-accent/50" />
                    <div className="w-2 h-2 rounded-full bg-secondary/50" />
                  </div>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] font-mono text-xs pr-2">
                  <AnimatePresence initial={false}>
                    {logs.map((log) => (
                      <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3 text-white/60 group"
                      >
                        <span className="text-white/20 shrink-0">{log.time}</span>
                        <span className={log.type === 'error' ? 'text-danger' : log.type === 'success' ? 'text-secondary' : ''}>
                          {log.msg}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* AI Filter Widget */}
              <div className="glass-card rounded-3xl p-6 border border-white/5 neo-shadow bg-gradient-to-br from-indigo-500/10 to-transparent">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">AI Pulse Engine</h3>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${stats?.confidence * 100}%` }}
                        className="h-full bg-primary shadow-[0_0_12px_rgba(99,102,241,0.5)]" 
                      />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Confidence Index</p>
                    <p className="text-[10px] text-primary font-bold">{(stats?.confidence * 100).toFixed(0)}%</p>
                  </div>
                  <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-white/30">Volatility:</span>
                      <span className="text-[10px] font-mono font-bold text-accent">{(stats?.volatility * 10).toFixed(2)} σ</span>
                  </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Mobile-First Bottom Nav (Optional) */}
      <footer className="h-16 border-t border-white/5 lg:hidden flex justify-around items-center glass-card px-4">
        <NavButton icon={Activity} label="Trade" active={activeTab === 'trade'} onClick={() => setActiveTab('trade')} />
        <NavButton icon={History} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
        <NavButton icon={Shield} label="Manage" active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} />
      </footer>
    </div>
  );
};

const StatCard = ({ label, value, sub, trend, highlight }) => (
  <div className="glass-card rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all">
    <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider">{label}</span>
    <div className={`text-xl font-bold mt-1 ${highlight === 'success' ? 'text-secondary' : highlight === 'danger' ? 'text-danger' : ''}`}>
      {value}
    </div>
    <div className="flex items-center gap-1 mt-1">
      {trend && (
        <span className={`text-[10px] flex items-center ${trend > 0 ? 'text-secondary' : 'text-danger'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
      <span className="text-[10px] text-white/20">{sub}</span>
    </div>
  </div>
);

const PositionItem = ({ ticker, qty, entry, ltp, pnl, status }) => (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all group">
    <div className="flex justify-between items-start mb-2">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{ticker}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${status === 'CONFIRMING' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'}`}>
            {status}
          </span>
        </div>
        <span className="text-[10px] text-white/30 uppercase font-mono">Qty: {qty} | Avg: {entry}</span>
      </div>
      <div className="text-right">
        <div className={`text-base font-bold ${pnl >= 0 ? 'text-secondary' : 'text-danger'}`}>
          {pnl >= 0 ? '+' : ''}{pnl}
        </div>
        <span className="text-[10px] text-white/30 uppercase font-mono">LTP: {ltp}</span>
      </div>
    </div>
    <div className="flex gap-2">
        <button className="flex-1 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold hover:bg-danger/20 hover:text-danger hover:border-danger/30 border border-transparent transition-all uppercase">Terminated Leg</button>
        <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all flex items-center gap-2">
            <span className="text-[10px] font-bold text-secondary animate-pulse">TRAILING</span>
            <ChevronRight className="w-3 h-3 text-white/40" />
        </button>
    </div>
  </div>
);

const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${active ? 'text-primary' : 'text-white/40 hover:text-white/60'}`}
  >
    <Icon className={`w-5 h-5 ${active ? 'fill-primary/10' : ''}`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default Dashboard;
