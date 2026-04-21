import React, { useState } from 'react';
import { Network, Cpu, Zap, Radio, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ConnectionCard = ({ correlation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`glass-panel p-4 mb-4 cursor-pointer transition-all duration-300 border-l-4 group
      ${isExpanded ? 'bg-primary/10 border-primary' : 'hover:bg-primary/5 border-primary/30'}`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded">
            <Network size={16} className="text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Cross-Signal Correlation</span>
            <div className="flex items-center gap-2 text-sm text-gray-100 font-space font-bold mt-0.5">
              <span>{correlation.topicA}</span>
              < ChevronRight size={14} className="text-primary/50" />
              <span>{correlation.topicB}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-mono text-secondary">STRENGTH: {(correlation.strength * 100).toFixed(0)}%</span>
          <span className="text-[9px] text-gray-600 font-mono mt-0.5">{new Date(correlation.timestamp).toLocaleTimeString()}</span>
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
            <div className="flex flex-col gap-6">
               <div className="bg-black/60 p-6 rounded-2xl border border-primary/20 shadow-inner relative group/brief">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Cpu className="text-primary" size={20} />
                    </div>
                    <h5 className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                      Neural Tactical Briefing
                    </h5>
                  </div>
                  
                  {/* Detailed Multi-Paragraph Content */}
                  <div className="space-y-4 text-gray-300 font-inter text-sm leading-relaxed">
                    {correlation.tacticalBriefing ? (
                      correlation.tacticalBriefing.split('\n').map((line, i) => (
                        <p key={i} className={line.startsWith('Impact') || line.startsWith('Strategy') ? 'border-l-2 border-primary/30 pl-4 py-1 italic text-primary/80' : ''}>
                          {line}
                        </p>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 gap-4 opacity-70">
                        <div className="flex gap-2">
                           <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                           <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                           <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">
                          Neural Inference Engine Processing Tactical Briefing...
                        </p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Intelligence Source Tracing */}
               <div className="flex gap-4">
                  <a 
                    href={correlation.urlA || `https://www.google.com/search?q=${encodeURIComponent(correlation.topicA)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} 
                    className="flex-1 p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group/trace hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <span className="text-[10px] font-mono text-gray-400 uppercase">Vector A: {correlation.topicA}</span>
                    <ExternalLink size={14} className="text-gray-600 group-hover/trace:text-primary transition-colors" />
                  </a>
                  <a 
                    href={correlation.urlB || `https://www.google.com/search?q=${encodeURIComponent(correlation.topicB)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()} 
                    className="flex-1 p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group/trace hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <span className="text-[10px] font-mono text-gray-400 uppercase">Vector B: {correlation.topicB}</span>
                    <ExternalLink size={14} className="text-gray-600 group-hover/trace:text-primary transition-colors" />
                  </a>
               </div>
            </div>

            <div className="mt-6 flex gap-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest bg-black/40 p-4 rounded-xl border border-white/5">
              <span className="flex items-center gap-2 border-r border-white/10 pr-6">
                <Zap size={12} className="text-secondary" /> 
                Confidence: <span className="text-secondary font-bold">{(correlation.strength * 100).toFixed(1)}%</span>
              </span>
              <span className="flex items-center gap-2">
                <Radio size={12} className="text-primary animate-pulse" /> 
                Method: Cosine Semantic Proximity
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function InsightPanel({ correlations, stats }) {
  return (
    <div className="flex flex-col h-full p-8 absolute inset-0 z-10 bg-background/90 backdrop-blur-sm pointer-events-auto overflow-hidden">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-full">
        <div className="flex items-center justify-between mb-8 border-b border-primary/30 pb-6">
          <div>
            <h1 className="font-space text-3xl text-primary glow-text uppercase tracking-widest flex items-center gap-3">
               <Network size={32} /> Intelligence Connections
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-2 uppercase tracking-tighter">
              AI-Synthesized Relationship Mapping • Real-time Correlation Matrix
            </p>
          </div>
          <div className="flex flex-col items-end">
             <div className="text-2xl font-space font-bold text-gray-200">{stats?.correlationCount || correlations.length}</div>
             <div className="text-[10px] font-mono text-gray-500">TOTAL IDENTIFIED LINKS</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hidden-scrollbar pr-4 pb-20">
          {correlations.map((c, i) => (
            <ConnectionCard key={i} correlation={c} />
          ))}

          {correlations.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-20">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-3xl opacity-20 animate-pulse" />
                <Network size={80} className="text-primary relative" />
              </div>
              <div className="text-center">
                <h3 className="font-space text-xl text-gray-300 uppercase tracking-[0.3em] mb-2">Matrix Scanning</h3>
                <p className="font-mono text-xs text-gray-500">Establishing latent space connections...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
