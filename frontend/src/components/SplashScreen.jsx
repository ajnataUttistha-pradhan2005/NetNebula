import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [loadingText, setLoadingText] = useState('Initializing Synaptic Links...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const texts = [
      'Synchronizing Neural Pathways...',
      'Deep Correlation Mapping...',
      'NetNebula Intelligence Live.'
    ];

    let current = 0;
    const textInterval = setInterval(() => {
      setLoadingText(texts[current]);
      current = (current + 1) % texts.length;
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressInterval);
          clearInterval(textInterval);
          setTimeout(onComplete, 1000); // Wait a bit at 100%
          return 100;
        }
        return p + 2;
      });
    }, 60);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-8 overflow-hidden">
      {/* Background Neural Pulse Effect */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 0.1 }}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute inset-0 bg-primary rounded-full blur-[120px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative w-32 h-32 mb-12"
        >
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping" />
          <div className="absolute inset-2 border-2 border-primary/40 rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-primary rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_30px_#99f7ff]">
              <span className="text-background font-space text-3xl font-black -rotate-45">N</span>
            </div>
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-space text-5xl font-black tracking-[0.3em] text-white mb-2 uppercase"
        >
          Net<span className="text-primary glow-text">Nebula</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="font-mono text-[10px] tracking-widest text-gray-400 uppercase mb-4"
        >
          Autonomous Neural Intelligence Cockpit
        </motion.p>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1.2 }}
          className="font-inter text-[11px] text-primary/60 max-w-[400px] text-center mb-12 italic leading-relaxed"
        >
          Mapping the world's latent semantic relationships through real-time ingestion, vector-clustering, and AI correlation synthesis.
        </motion.p>

        {/* Progress Bar Container */}
        <div className="w-64">
           {/* Text Reveal */}
           <div className="h-4 mb-2">
             <AnimatePresence mode="wait">
               <motion.div 
                 key={loadingText}
                 initial={{ y: 5, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -5, opacity: 0 }}
                 className="text-[10px] font-mono text-primary text-center tracking-tighter"
               >
                 {loadingText}
               </motion.div>
             </AnimatePresence>
           </div>

           {/* Bar */}
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                className="h-full bg-primary shadow-[0_0_10px_#99f7ff]"
                style={{ width: `${progress}%` }}
              />
           </div>

           {/* Percentage */}
           <div className="mt-2 text-right">
             <span className="font-mono text-[10px] text-gray-500">{progress}%</span>
           </div>
        </div>
      </div>

      {/* Decorative HUD Elements */}
      <div className="absolute bottom-12 left-12 flex flex-col gap-1 opacity-20 font-mono text-[8px]">
        <span>REGION: GLOBAL_CLUSTER_01</span>
        <span>AUTH: PROTOCOL_NEBULA_V2</span>
      </div>
      <div className="absolute top-12 right-12 flex flex-col gap-1 opacity-20 font-mono text-[8px] text-right">
        <span>STABILITY: OPTIMAL</span>
        <span>LATENCY: 4.2ms</span>
      </div>
    </div>
  );
};

export default SplashScreen;
