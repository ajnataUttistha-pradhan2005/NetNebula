import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, AlertTriangle, Zap, Network, TrendingUp, TrendingDown, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CLUSTER_CONFIG = {
  0: { name: "AI & SYNTHETIC", color: '#00fbff' },
  1: { name: "DECENTRALIZED", color: '#39ff14' },
  2: { name: "SOCIAL PULSE", color: '#ff003c' },
  3: { name: "GLOBAL SYSTEMS", color: '#ffae00' },
  4: { name: "CYBERSECURITY", color: '#bc13fe' },
  5: { name: "QUANTUM / BIO", color: '#ff00ff' }
};

const KPICard = ({ title, value, icon: Icon, colorClass, url, tooltip }) => {
  const CardContent = (
    <div className="glass-panel p-4 flex items-center justify-between relative overflow-hidden group hover:bg-white/5 transition-all duration-300" title={tooltip}>
      <div className="z-10 relative">
        <h3 className="text-gray-400 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
          {title}
          <Info size={10} className="text-gray-600 group-hover:text-primary transition-colors" />
        </h3>
        <div className={`text-2xl font-space font-bold mt-1 ${colorClass}`}>{value}</div>
      </div>
      <Icon className={`w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity duration-500 ${colorClass}`} />
      {url && <ExternalLink size={10} className="absolute top-2 right-2 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );

  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
      {CardContent}
    </a>
  ) : CardContent;
};

export default function Dashboard({ stats, signals, mini }) {
  const [expandedTrendIndex, setExpandedTrendIndex] = React.useState(null);
  
  const volumeData = [...signals].reverse().map((s, i) => ({
    time: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: s.value
  })).slice(-20);

  const clusterCounts = signals.reduce((acc, s) => {
    const clusterName = CLUSTER_CONFIG[s.clusterId]?.name || "UNCLASSIFIED";
    acc[clusterName] = (acc[clusterName] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.entries(clusterCounts).map(([name, value]) => ({ name, value }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-2 font-mono text-xs border-[0.5px] border-primary_dim/50">
          <p className="text-gray-400 mb-1">{label}</p>
          <p className="text-primary">{`Signal: ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  if (mini) {
    return (
      <div className="flex flex-col gap-4 p-4 z-10 hidden-scrollbar glass-panel rounded-lg w-full">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#99f7ff]"></div>
          <h1 className="font-space text-lg uppercase tracking-widest text-primary glow-text">NetNebula</h1>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-mono">Signals</span><span className="text-primary font-space font-bold">{stats.totalSignalsProcessed}</span></div>
          <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-mono">Anomalies</span><span className="text-error font-space font-bold">{stats.anomalyCount}</span></div>
          <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-mono">Trend</span><span className="text-secondary font-space font-bold text-xs truncate max-w-[80px]">{stats.topTrending}</span></div>
          <div className="flex flex-col"><span className="text-[10px] text-gray-400 font-mono">Status</span><span className="text-primary_container font-space font-bold">OPTIMAL</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 h-full absolute inset-0 z-10 overflow-y-auto hidden-scrollbar bg-background/90 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 w-full max-w-5xl mx-auto mt-6">
        <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_12px_#99f7ff]"></div>
        <h1 className="font-space text-3xl uppercase tracking-widest text-primary glow-text">Trending Intelligence Reports</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 w-full max-w-5xl mx-auto mt-4">
        <KPICard title="Live Nodes" value={stats.totalSignalsProcessed} icon={Activity} colorClass="text-primary glow-text" tooltip="Active units of intelligence currently in memory." />
        <KPICard title="Total Alerts" value={stats.anomalyCount} icon={AlertTriangle} colorClass="text-error glow-text" tooltip="Sudden surges in attention that breach the normal baseline." />
        <KPICard title="Global Pulse" value={stats.topTrending} icon={Zap} colorClass="text-secondary glow-text" url={stats.trends && stats.trends[0]?.url} tooltip="The most dominant narrative in the current network state." />
        <KPICard title="Net Connections" value={stats.correlationCount} icon={Network} colorClass="text-primary_container glow-text" tooltip="Hidden mathematical links between disparate topics detected via semantic clustering." />
      </div>

      <div className="glass-panel p-6 mt-4 w-full max-w-5xl mx-auto rounded-lg">
        <h3 className="font-mono text-sm text-gray-400 uppercase tracking-widest border-b border-primary/20 pb-2 mb-4 flex items-center gap-2">
          Signal Velocity Timeline
          <span className="text-[9px] text-gray-600">(Real-time ingestion rate of global intelligence packets)</span>
        </h3>
        <div className="h-48 w-full min-h-[192px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volumeData}>
              <XAxis dataKey="time" stroke="#3a3a3a" tick={{fill: '#6b7280', fontSize: 10}} />
              <YAxis domain={['auto', 'auto']} stroke="#3a3a3a" tick={{fill: '#6b7280', fontSize: 10}} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#99f7ff" strokeWidth={2} dot={{r: 2, fill: '#00f1fe'}} activeDot={{ r: 6, fill: '#00f1fe' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.trends && stats.trends.length > 0 && (
        <div className="glass-panel p-6 w-full max-w-5xl mx-auto rounded-lg">
          <h3 className="font-mono text-sm text-gray-400 uppercase tracking-widest border-b border-primary/20 pb-2 mb-6">
            Sector Momentum Briefings
          </h3>
          <div className="grid grid-cols-2 gap-6 mt-2">
            {stats.trends.map((t, idx) => {
              const isSurging = t.momentum >= 0;
              const isExpanded = expandedTrendIndex === idx;
              const cluster = CLUSTER_CONFIG[t.clusterId] || CLUSTER_CONFIG[3];
              return (
                <div 
                  key={idx} 
                  onClick={() => setExpandedTrendIndex(isExpanded ? null : idx)}
                  className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col cursor-pointer transition-all duration-500 relative group
                    ${isExpanded ? 'col-span-2 bg-black/40 border-primary ring-1 ring-primary/30' : 'hover:bg-white/5 border-white/5 hover:border-primary/20'} 
                  `}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-space text-gray-100 text-base font-bold truncate max-w-[240px]">{t.topic}</h4>
                      <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: cluster.color }}>{cluster.name} Domain</span>
                    </div>
                    <div className={`flex flex-col items-end px-3 py-1 rounded-lg bg-black/30 border border-white/5`}>
                      <div className={`flex items-center gap-1 font-bold ${isSurging ? 'text-secondary font-mono' : 'text-error font-mono'}`}>
                        {isSurging ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="text-xs">{isSurging ? '+' : ''}{t.momentum.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 pt-6 border-t border-white/10"
                      >
                        <div className="grid grid-cols-2 gap-8 text-[11px] font-mono">
                          <div className="flex flex-col gap-2">
                            <span className="text-gray-500 uppercase tracking-tighter">Telemetry Report</span>
                            <div className="flex flex-col gap-1 text-gray-300">
                               <p><span className="text-primary/50">TIMESTAMP:</span> {new Date(t.lastUpdated).toLocaleString()}</p>
                               <p><span className="text-primary/50">INTENSITY:</span> {t.currentAttention.toFixed(0)} SYNS</p>
                               <p><span className="text-primary/50">FINGERPRINT:</span> TRND_{t.topic.substring(0,6).toUpperCase().replace(/\W/g, '')}</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                             <span className="text-gray-500 uppercase tracking-tighter">Sector Momentum</span>
                             <div className={`p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col justify-center`}>
                                <span className={isSurging ? 'text-secondary font-bold text-sm' : 'text-error font-bold text-sm'}>
                                  {isSurging ? '🚀 ANOMALOUS SURGE' : '📉 THERMAL RECOIL'}
                                </span>
                                <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Velocity Locked</span>
                             </div>
                          </div>
                        </div>

                        {/* Elaborate AI Analysis Section */}
                        <div className="mt-8 flex flex-col gap-4">
                           <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl relative overflow-hidden group/brief">
                             <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                               <Zap size={14} className="animate-pulse" /> Tactical Intelligence Briefing
                             </h4>
                             <p className="text-sm text-gray-300 leading-relaxed font-inter">
                               {t.analysis || `Inference engine indicates Topic is an active focal point in the ${cluster.name} neural cluster. System indicates high relative attention score with semantic overlap suggesting sustained growth.`}
                             </p>
                             <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                           </div>

                           {
                             (t.url || true) && (
                             <a 
                               href={t.url || `https://www.google.com/search?q=${encodeURIComponent(t.topic)}`} 
                               target="_blank" 
                               rel="noopener noreferrer"
                               className="flex items-center justify-center gap-4 w-full py-5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl text-primary font-space font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.005] group/link shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                               onClick={(e) => e.stopPropagation()}
                             >
                               <span>Access Raw Intelligence Source</span>
                               <ExternalLink size={20} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                             </a>
                           )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Distribution Chart */}
      <div className="glass-panel p-8 w-full max-w-5xl mx-auto rounded-lg mb-20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <h3 className="font-mono text-sm text-gray-400 uppercase tracking-widest border-b border-primary/20 pb-4 mb-8">Intelligence Cluster Distribution</h3>
        <div className="h-64 w-full min-h-[256px] flex items-center justify-center">
          <ResponsiveContainer width="40%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                {pieData.map((entry, index) => {
                    const config = Object.values(CLUSTER_CONFIG).find(c => c.name === entry.name);
                    return <Cell key={`cell-${index}`} fill={config?.color || '#333'} />;
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-4 w-[60%] pl-12 border-l border-white/5">
            {pieData.map((entry, idx) => {
              const config = Object.values(CLUSTER_CONFIG).find(c => c.name === entry.name);
              return (
              <div key={idx} className="flex justify-between items-center font-mono w-full max-w-[340px] group/item">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-1 rounded-full group-hover/item:w-6 transition-all" style={{ backgroundColor: config?.color || '#333' }}></div>
                  <span className="text-gray-400 text-[11px] uppercase tracking-[0.2em] group-hover/item:text-primary transition-colors">{entry.name}</span>
                </div>
                <span className="text-gray-200 font-bold font-space">{entry.value} NODES</span>
              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}
