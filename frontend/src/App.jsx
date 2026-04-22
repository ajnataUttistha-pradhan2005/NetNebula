import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Database, Cpu } from 'lucide-react';
import NeuralField from './components/NeuralField';
import Dashboard from './components/Dashboard';
import LiveFeed from './components/LiveFeed';
import InsightPanel from './components/InsightPanel';
import SplashScreen from './components/SplashScreen';

const API_BASE = "http://16.171.141.118:3001/api";

function App() {
  const [signals, setSignals] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [correlations, setCorrelations] = useState([]);
  const [stats, setStats] = useState({
    totalSignalsProcessed: 0,
    anomalyCount: 0,
    correlationCount: 0,
    topTrending: "Initialising...",
    systemActivityScore: 0
  });

  const [hasAnomalyWave, setHasAnomalyWave] = useState(false);
  const [activeTab, setActiveTab] = useState('global'); // Default to global as requested
  const [showSplash, setShowSplash] = useState(true);
  const prevAnomalyCount = useRef(0);

  const [isSynthetic, setIsSynthetic] = useState(false);

  const toggleSynthetic = async () => {
    try {
      const newState = !isSynthetic;
      setIsSynthetic(newState);

      // Instantly wipe the frontend cache grids so the UI transitions cleanly
      setSignals([]);
      setAnomalies([]);
      setCorrelations([]);

      await axios.post(`${API_BASE}/mode`, { synthetic: newState });
      fetchData(); // Trigger immediate repopulation from the new stream mode
    } catch (e) {
      console.error("Failed to toggle synthetic mode", e);
    }
  };

  const fetchData = async () => {
    try {
      const [sigRes, anoRes, corRes, staRes] = await Promise.all([
        axios.get(`${API_BASE}/signals?limit=150`),
        axios.get(`${API_BASE}/anomalies?limit=30`),
        axios.get(`${API_BASE}/correlations?limit=25`),
        axios.get(`${API_BASE}/stats`)
      ]);

      setSignals(sigRes.data);
      setAnomalies(anoRes.data);
      setCorrelations(corRes.data);
      setStats(staRes.data);

      if (staRes.data.anomalyCount > prevAnomalyCount.current) {
        setHasAnomalyWave(true);
        setTimeout(() => setHasAnomalyWave(false), 2000);
        prevAnomalyCount.current = staRes.data.anomalyCount;
      }

    } catch (e) {
      console.error("API error:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <motion.div
      className="relative w-screen h-screen bg-background overflow-hidden font-inter text-gray-200 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >

      {/* Top Tab Bar */}
      <div className="absolute top-0 inset-x-0 z-50 h-14 bg-surface_lowest/80 backdrop-blur-md border-b border-primary_dim/30 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#99f7ff]"></div>
          <h1 className="font-space text-xl uppercase tracking-widest text-primary glow-text">NetNebula Sys</h1>
        </div>

        <div className="flex gap-4 font-mono text-xs uppercase tracking-widest">
          {[
            { id: 'global', label: 'Global Attention' },
            { id: 'trending', label: 'Trending Topics' },
            { id: 'connections', label: 'Connections' },
            { id: 'anomalies', label: 'Anomalies & Feed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 transition-all ${activeTab === tab.id ? 'border-primary text-primary glow-text bg-primary/10' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <div
            onClick={toggleSynthetic}
            className={`relative flex items-center w-36 h-7 rounded-full p-1 cursor-pointer transition-all duration-500 border overflow-hidden ${isSynthetic ? 'bg-primary/5 border-primary/50 shadow-[0_0_15px_rgba(0,251,255,0.4)]' : 'bg-black/50 border-white/10 hover:border-white/30'}`}
            title="Toggle Engine Integrity"
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-transform duration-1000 ${isSynthetic ? 'translate-x-full opacity-100' : '-translate-x-full opacity-0'}`} />

            <motion.div
              layout
              className={`flex items-center justify-center w-[48%] h-full rounded-full z-10 ${isSynthetic ? 'bg-primary shadow-[0_0_10px_#00fbff]' : 'bg-surface_high'}`}
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ marginLeft: isSynthetic ? '52%' : '0%' }}
            >
              {isSynthetic ? <Cpu size={12} className="text-black" /> : <Database size={12} className="text-gray-400" />}
            </motion.div>

            <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none font-mono text-[9px] font-bold tracking-widest text-gray-500 z-0">
              <span className={!isSynthetic ? "opacity-0" : "text-primary drop-shadow-[0_0_5px_#00fbff]"}>SYNTH</span>
              <span className={isSynthetic ? "opacity-0" : ""}>LIVE</span>
            </div>
          </div>
          <div className="text-secondary font-mono text-xs blink-anim border-l border-white/10 pl-6 py-1">Network Synchronised</div>
        </div>
      </div>

      <div className="relative flex-1 mt-14 overflow-hidden">
        {/* Always render NeuralField behind but maybe change opacity/controls */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${activeTab === 'global' ? 'opacity-100 pointer-events-auto' : 'opacity-20 pointer-events-none'}`}>
          <NeuralField signals={signals} correlations={correlations} anomalies={anomalies} />
        </div>

        {/* Grid background overlay for HUD feel */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(58, 58, 58, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(58, 58, 58, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Signal Wave / Anomaly Flash effect */}
        <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-[2000ms] ease-out ${hasAnomalyWave ? 'bg-error/10 opacity-100 mix-blend-screen' : 'opacity-0 bg-transparent'}`}>
          {hasAnomalyWave && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-error/20 to-transparent"></div>}
        </div>

        {/* HUD Content based on tab */}
        {activeTab === 'trending' && <Dashboard stats={stats} signals={signals} />}
        {activeTab === 'anomalies' && <LiveFeed signals={signals} anomalies={anomalies} fullWidth />}
        {activeTab === 'connections' && <InsightPanel correlations={correlations} stats={stats} anomalies={anomalies} fullWidth />}

        {/* If global tab, show mini overlay only for Dashboard stats */}
        {activeTab === 'global' && (
          <div className="absolute top-4 left-4 z-10 w-[20vw] pointer-events-none scale-75 origin-top-left opacity-80">
            <Dashboard stats={stats} signals={signals} mini />
          </div>
        )}
      </div>

    </motion.div>
  );
}

export default App;
