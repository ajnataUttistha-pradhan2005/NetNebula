import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { forceSimulation, forceLink, forceManyBody, forceX, forceY, forceZ, forceCollide } from 'd3-force-3d';
import { ExternalLink, Database, Activity, ShieldAlert, Cpu, Info, BookOpen } from 'lucide-react';

const CLUSTER_CONFIG = {
  0: { name: "AI & SYNTHETIC", color: '#00fbff', focus: { x: 25, y: 25, z: 25 } }, // Neon Cyan
  1: { name: "DECENTRALIZED", color: '#39ff14', focus: { x: -25, y: -25, z: 25 } }, // Neon Green
  2: { name: "SOCIAL PULSE", color: '#ff003c', focus: { x: -25, y: 25, z: -25 } }, // Neon Crimson
  3: { name: "GLOBAL SYSTEMS", color: '#ffae00', focus: { x: 25, y: -25, z: -25 } }, // Neon Gold
  4: { name: "CYBER ATTACK", color: '#bc13fe', focus: { x: 0, y: 35, z: 0 } },      // Neon Purple
  5: { name: "QUANTUM / BIO", color: '#ff00ff', focus: { x: 0, y: -35, z: 0 } }      // Neon Magenta
};

const ManualHUD = () => (
  <div className="absolute top-20 right-8 z-30 w-[280px] glass-panel p-5 animate-in fade-in slide-in-from-right duration-1000 border-r-4 border-primary">
    <div className="flex items-center gap-3 mb-4 border-b border-primary/20 pb-2">
      <BookOpen size={18} className="text-primary" />
      <h3 className="font-space text-xs font-bold text-primary uppercase tracking-widest">Protocol Intelligence Manual</h3>
    </div>
    <div className="space-y-4 text-[10px] font-mono text-gray-400 leading-relaxed uppercase">
      <div className="relative pl-4 border-l border-primary/30">
        <span className="text-primary font-bold block mb-1">01. Neural Nodes</span>
        Represents unique intelligence signals. Size corresponds to immediate attention volume.
      </div>
      <div className="relative pl-4 border-l border-primary/30">
        <span className="text-secondary font-bold block mb-1">02. Synaptic Edges</span>
        Mathematical links showing **Semantic Relationship**. Occurs when two topics share deep conceptual overlap.
      </div>
      <div className="relative pl-4 border-l border-primary/30">
        <span className="text-error font-bold block mb-1">03. System Anomalies</span>
        Detected when a signal breaches the normal 24-hour baseline attention by &gt;150%.
      </div>
    </div>
    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between opacity-30">
        <Info size={12} />
        <span className="text-[8px] font-mono">ENCRYPTED HUD V1.4</span>
    </div>
  </div>
);

const NeuralNodes = ({ signals, correlations, anomalies, onHoverNode }) => {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [isRippling, setIsRippling] = useState(false);
  
  useEffect(() => {
    if (anomalies.length > 0) {
      setIsRippling(true);
      const timer = setTimeout(() => setIsRippling(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [anomalies.length]);

  useEffect(() => {
    const d3Nodes = signals.map(s => ({
      ...s,
      id: s.id || s._id,
      x: (CLUSTER_CONFIG[s.clusterId] || CLUSTER_CONFIG[3]).focus.x + (Math.random() - 0.5) * 20,
      y: (CLUSTER_CONFIG[s.clusterId] || CLUSTER_CONFIG[3]).focus.y + (Math.random() - 0.5) * 20,
      z: (CLUSTER_CONFIG[s.clusterId] || CLUSTER_CONFIG[3]).focus.z + (Math.random() - 0.5) * 20
    }));

    const d3Links = correlations.map(c => {
      // PRECISION ID MATCHING (Fixes "Missing Edges" bug)
      const source = d3Nodes.find(n => n.id === c.sourceA_id);
      const target = d3Nodes.find(n => n.id === c.sourceB_id);
      
      if (source && target) return { source: source.id, target: target.id, strength: c.strength };
      return null;
    }).filter(l => l !== null);

    const simulation = forceSimulation(d3Nodes, 3)
      .alphaDecay(0.01)
      .velocityDecay(0.6)
      .force('link', forceLink(d3Links).id(d => d.id).distance(30).strength(d => d.strength * 0.6))
      .force('charge', forceManyBody().strength(-60))
      .force('collide', forceCollide().radius(7))
      .force('x', forceX(d => (CLUSTER_CONFIG[d.clusterId] || CLUSTER_CONFIG[3]).focus.x).strength(0.12))
      .force('y', forceY(d => (CLUSTER_CONFIG[d.clusterId] || CLUSTER_CONFIG[3]).focus.y).strength(0.12))
      .force('z', forceZ(d => (CLUSTER_CONFIG[d.clusterId] || CLUSTER_CONFIG[3]).focus.z).strength(0.12))
      .on('tick', () => {
        setNodes([...simulation.nodes()]);
        setLinks([...simulation.force('link').links()]);
      });

    for (let i = 0; i < 80; ++i) simulation.tick(); 
    return () => simulation.stop();
  }, [signals, correlations]);

  return (
    <group>
      {links.map((link, i) => (
        <Line
          key={`link-${i}`}
          points={[[link.source.x, link.source.y, link.source.z], [link.target.x, link.target.y, link.target.z]]}
          color={CLUSTER_CONFIG[link.source.clusterId]?.color || "#0ff"}
          lineWidth={1 + (link.strength || 0) * 2}
          transparent
          opacity={0.25 + (link.strength || 0) * 0.5}
          dashed={false}
        />
      ))}

      {nodes.map(node => {
        const config = CLUSTER_CONFIG[node.clusterId] || CLUSTER_CONFIG[3];
        const size = Math.min(2.5, Math.max(0.8, node.value / 60)); 

        return (
          <mesh 
            key={node.id} 
            position={[node.x, node.y, node.z]}
            onPointerOver={(e) => { e.stopPropagation(); onHoverNode(node); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { onHoverNode(null); document.body.style.cursor = 'auto'; }}
          >
            <sphereGeometry args={[size, 16, 16]} />
            <meshStandardMaterial 
                color={config.color} 
                emissive={config.color} 
                emissiveIntensity={isRippling ? 20 : 2} 
                transparent opacity={0.95} 
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default function NeuralField({ signals, correlations, anomalies }) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [persistentNode, setPersistentNode] = useState(null);
  const closeTimer = useRef(null);

  const handleHoverNode = (node) => {
    if (node) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setHoveredNode(node);
      setPersistentNode(node);
    } else {
      closeTimer.current = setTimeout(() => {
        setHoveredNode(null);
        setPersistentNode(null);
      }, 500);
    }
  };

  const activeNode = hoveredNode || persistentNode;

  return (
    <div className="absolute inset-0 z-0 pointer-events-auto overflow-hidden">
      <div className="absolute bottom-12 left-10 z-20 flex flex-col gap-3 pointer-events-none select-none">
        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3 font-space border-l-2 border-primary pl-4">Neural Cluster Indices</h4>
        {Object.entries(CLUSTER_CONFIG).map(([id, config]) => (
          <div key={id} className="flex items-center gap-4 animate-in slide-in-from-left duration-700">
            <div className="w-4 h-1 rounded-full shadow-[0_0_12px_currentColor]" style={{ backgroundColor: config.color, color: config.color }}></div>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-none">{config.name} LINK</span>
          </div>
        ))}
      </div>

      <ManualHUD />

      {activeNode && (
        <div 
          className="absolute bottom-10 right-10 z-40 pointer-events-auto"
          onMouseEnter={() => closeTimer.current && clearTimeout(closeTimer.current)}
          onMouseLeave={() => closeTimer.current = setTimeout(() => { setHoveredNode(null); setPersistentNode(null); }, 500)}
        >
          <div className="glass-panel p-7 min-w-[340px] max-w-[420px] border-l-4 shadow-[0_0_80px_rgba(0,18,31,0.6)] animate-in fade-in slide-in-from-right-6 duration-400 relative overflow-hidden"
               style={{ borderLeftColor: CLUSTER_CONFIG[activeNode.clusterId]?.color || '#99f7ff' }}>
            
            <div className="flex justify-between items-start mb-5 pb-3 border-b border-white/5">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">
                  {CLUSTER_CONFIG[activeNode.clusterId]?.name} NODE
                </span>
                <span className="text-[9px] text-gray-500 font-mono tracking-tighter uppercase">Protocol Target: {activeNode.id?.substring(0,8)}</span>
              </div>
              {activeNode.url && (
                <a href={activeNode.url} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-primary hover:bg-primary/30 transition-all">
                  <ExternalLink size={16} />
                </a>
              )}
            </div>

            <h3 className="text-gray-100 font-space text-lg font-bold leading-snug mb-5">{activeNode.title}</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/60 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase flex items-center gap-2 mb-2 font-mono"><Activity size={12} className="text-primary" /> Attention Score</span>
                <span className="text-secondary font-mono font-bold text-base">{activeNode.value.toFixed(1)}</span>
              </div>
              <div className="bg-black/60 p-4 rounded-xl border border-white/5 flex flex-col">
                <span className="text-[9px] text-gray-500 uppercase flex items-center gap-2 mb-2 font-mono"><Cpu size={12} className="text-primary" /> System Node</span>
                <span className="text-primary font-mono font-bold text-base tracking-tighter uppercase">Verified</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em] pt-4 border-t border-white/5">
              <span className="flex items-center gap-1.5 font-bold"><Database size={11} className="text-primary/50" /> System V1.4</span>
              <span className="animate-pulse flex items-center gap-2 text-primary/80"><ShieldAlert size={11} /> Active Baseline</span>
            </div>
          </div>
        </div>
      )}

      <Canvas camera={{ position: [0, 0, 110], fov: 45 }}>
        <color attach="background" args={['#020202']} />
        <ambientLight intensity={0.4} />
        <pointLight position={[50, 50, 50]} intensity={2} />
        <NeuralNodes signals={signals} correlations={correlations} anomalies={anomalies} onHoverNode={handleHoverNode} />
        <OrbitControls enableZoom={true} enablePan={true} autoRotate autoRotateSpeed={0.02} dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
