import React from 'react';
import { Activity, AlertTriangle, Zap, ExternalLink } from 'lucide-react';

const AnomalyItem = ({ anomaly }) => (
  <div className={`p-4 rounded border-l-4 mb-3 animate-in fade-in slide-in-from-left duration-500 relative group
    ${anomaly.severity === 'CRITICAL' ? 'bg-red-900/10 border-red-500' : 'bg-orange-900/10 border-orange-500'}`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className={anomaly.severity === 'CRITICAL' ? 'text-red-500' : 'text-orange-500'} size={14} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
            {anomaly.severity} DETECTED
          </span>
        </div>
        <h4 className="font-space text-sm text-gray-200">{anomaly.title}</h4>
        <div className="flex gap-4 mt-2 font-mono text-[10px] text-gray-500">
          <span>VALUE: {anomaly.value.toFixed(1)}</span>
          <span>DEV: +{((anomaly.value - anomaly.avg) / anomaly.avg * 100).toFixed(0)}%</span>
        </div>
      </div>
      {anomaly.url && (
        <a 
          href={anomaly.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 rounded hover:bg-white/10 text-gray-400 hover:text-primary_container"
          title="Verify Source"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  </div>
);

const SignalItem = ({ signal }) => (
  <div className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex justify-between items-center group">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1 h-1 rounded-full bg-primary/40"></span>
        <span className="text-[9px] font-mono text-gray-500 uppercase">{signal.source}</span>
        <span className="text-[9px] font-mono text-gray-600">[{new Date(signal.timestamp).toLocaleTimeString()}]</span>
      </div>
      <p className="text-xs text-gray-300 truncate font-inter">{signal.title}</p>
    </div>
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20">
        +{signal.value.toFixed(0)}
      </span>
      {signal.url && (
        <a 
          href={signal.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-primary"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  </div>
);

export default function LiveFeed({ signals, anomalies }) {
  return (
    <div className="flex h-full gap-6 p-8 absolute inset-0 z-10 bg-background/90 backdrop-blur-sm pointer-events-auto overflow-hidden">
      {/* Anomalies Panel */}
      <div className="w-[400px] flex flex-col glass-panel p-6 border-r border-primary/20">
        <div className="flex items-center justify-between mb-6 border-b border-primary/20 pb-4">
          <h3 className="font-space text-lg text-primary flex items-center gap-2">
            <Zap size={20} className="animate-pulse" /> SYSTEM ALERTS
          </h3>
          <span className="font-mono text-[10px] text-error bg-error/10 px-2 rounded">{anomalies.length} ACTIVE</span>
        </div>
        
        <div className="flex-1 overflow-y-auto hidden-scrollbar">
          {anomalies.map((a, i) => (
            <AnomalyItem key={i} anomaly={a} />
          ))}
          {anomalies.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3 grayscale opacity-30">
              <Activity size={40} />
              <p className="font-mono text-xs uppercase tracking-widest">Network Stable</p>
            </div>
          )}
        </div>
      </div>

      {/* Primary Ingestion Stream */}
      <div className="flex-1 flex flex-col glass-panel p-6">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h3 className="font-space text-lg text-gray-200 flex items-center gap-2">
            <Activity size={20} /> LIVE INGESTION STREAM
          </h3>
          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
             <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
             SYNCHRONIZED
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar pr-4 relative">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/50 z-10" />
          {signals.map((s, i) => (
            <SignalItem key={i} signal={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
