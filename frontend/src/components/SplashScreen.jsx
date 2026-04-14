import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Physics & Math Helpers ───────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(a, b) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function rng(min, max) { return min + Math.random() * (max - min); }

// ─── Particle Factory ─────────────────────────────────────────────────────────
function createNode(w, h, id) {
  const clusterAngle = rng(0, Math.PI * 2);
  const edge = rng(0.15, 0.45);
  return {
    id,
    x: w * 0.5 + Math.cos(clusterAngle) * w * edge,
    y: h * 0.5 + Math.sin(clusterAngle) * h * edge,
    vx: 0, vy: 0,
    spawnX: w * 0.5 + Math.cos(clusterAngle) * w * edge,
    spawnY: h * 0.5 + Math.sin(clusterAngle) * h * edge,
    // Target cluster position
    tx: w * 0.5 + Math.cos(clusterAngle) * w * rng(0.1, 0.3),
    ty: h * 0.5 + Math.sin(clusterAngle) * h * rng(0.06, 0.2),
    opacity: 0,
    radius: rng(1.5, 3.5),
    brightness: rng(0.5, 1.0),
    spawnDelay: rng(0, 800),
    clusterId: Math.floor(Math.random() * 6),
    orbitAngle: rng(0, Math.PI * 2),
    orbitRadius: rng(8, 40),
    orbitSpeed: rng(0.0002, 0.0008) * (Math.random() > 0.5 ? 1 : -1),
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SplashScreen = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const onCompleteRef = useRef(onComplete); // stable ref — never causes re-run
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const stateRef = useRef({
    phase: 1,
    phaseStart: 0,
    nodes: [],
    edges: [],
    t: 0,
    globalAngle: 0,
    fieldCenterX: 0,
    fieldCenterY: 0,
  });
  const rafRef = useRef(null);
  const [showLogo, setShowLogo] = useState(false);
  const [phase, setPhase] = useState(1);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stateRef.current.fieldCenterX = canvas.width / 2;
      stateRef.current.fieldCenterY = canvas.height / 2;
    };
    resize();
    window.addEventListener('resize', resize);

    // Build nodes
    const NODE_COUNT = 55;
    const s = stateRef.current;
    s.nodes = Array.from({ length: NODE_COUNT }, (_, i) =>
      createNode(canvas.width, canvas.height, i)
    );

    // Phase timers
    const t2 = setTimeout(() => { s.phase = 2; setPhase(2); }, 1000);
    const t3 = setTimeout(() => { s.phase = 3; setPhase(3); }, 2200);
    const t4 = setTimeout(() => { s.phase = 4; setPhase(4); }, 3500);
    const t5 = setTimeout(() => {
      s.phase = 5; setPhase(5);
      setShowLogo(true);
    }, 4600);
    const tExit = setTimeout(() => setExiting(true), 7800);
    const t6 = setTimeout(() => onCompleteRef.current?.(), 8500);

    let lastTime = 0;

    // ═══ RENDER LOOP ═══════════════════════════════════════════════════════════
    const render = (ts) => {
      rafRef.current = requestAnimationFrame(render);
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;
      s.t = ts;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // ── BG ──────────────────────────────────────────────────────────────────
      ctx.fillStyle = '#05060A';
      ctx.fillRect(0, 0, w, h);

      // Radial center glow (always present, grows with phase)
      const glowR = Math.min(w, h) * (0.15 + s.phase * 0.06);
      const glowIntensity = Math.min(1, (s.phase - 1) * 0.15);
      if (glowIntensity > 0) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
        grad.addColorStop(0, `rgba(80,200,230,${0.04 * glowIntensity})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Faint grid (Phase 1 only)
      if (s.phase === 1) {
        const gridOpacity = 0.04;
        const gridSize = 48;
        ctx.strokeStyle = `rgba(100,200,220,${gridOpacity})`;
        ctx.lineWidth = 0.5;
        for (let gx = 0; gx < w; gx += gridSize) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
        }
      }

      // ── NODE PHYSICS ────────────────────────────────────────────────────────
      s.nodes.forEach((n) => {
        const elapsed = ts - s.phaseStart;

        if (s.phase === 1) {
          // Void — nothing visible yet
          n.opacity = lerp(n.opacity, 0, 0.05);
          return;
        }

        if (s.phase === 2) {
          // Spawn one by one
          if (ts > n.spawnDelay + 1000) {
            n.opacity = lerp(n.opacity, n.brightness * 0.7, 0.04);
          }
          // Gentle downward drift then stabilize
          const age = ts - Math.max(0, n.spawnDelay + 1000);
          const driftY = Math.max(0, 1 - age / 800) * 0.3;
          n.y += driftY;
          n.x += Math.sin(ts * 0.0008 + n.id) * 0.08;
        }

        if (s.phase === 3) {
          // Spring toward cluster target
          const fx = (n.tx - n.x) * 0.025;
          const fy = (n.ty - n.y) * 0.025;
          n.vx = lerp(n.vx, fx, 0.08);
          n.vy = lerp(n.vy, fy, 0.08);
          n.x += n.vx;
          n.y += n.vy;
          n.opacity = lerp(n.opacity, n.brightness * 0.85, 0.03);
        }

        if (s.phase >= 4) {
          // Orbital breathing around target
          n.orbitAngle += n.orbitSpeed * (s.phase >= 5 ? 0.4 : 1.0);
          const breathX = n.tx + Math.cos(n.orbitAngle) * n.orbitRadius * 0.5;
          const breathY = n.ty + Math.sin(n.orbitAngle) * n.orbitRadius * 0.5;
          n.x = lerp(n.x, breathX, 0.02);
          n.y = lerp(n.y, breathY, 0.02);
          n.opacity = lerp(n.opacity, n.brightness, s.phase >= 5 ? 0.02 : 0.04);
        }
      });

      // Global slow rotation (Phase 4+)
      if (s.phase >= 4) {
        s.globalAngle += 0.0003 * (s.phase >= 5 ? 0.3 : 1);
        const cos = Math.cos(s.globalAngle * 0.1);
        const sin = Math.sin(s.globalAngle * 0.1);
        s.nodes.forEach((n) => {
          const dx = n.x - cx;
          const dy = n.y - cy;
          // Very subtle global rotation — just lightly nudge
          n.x = cx + dx + (-dy * sin * 0.001);
          n.y = cy + dy + (dx * sin * 0.001);
        });
      }

      // ── EDGES ───────────────────────────────────────────────────────────────
      if (s.phase >= 3) {
        const edgeThreshold = s.phase >= 4 ? 80 : 60;
        const edgeOpacity = s.phase >= 4 ? 0.15 : 0.07;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < s.nodes.length; i++) {
          for (let j = i + 1; j < s.nodes.length; j++) {
            const a = s.nodes[i];
            const b = s.nodes[j];
            if (a.clusterId !== b.clusterId) continue;
            const d = dist(a, b);
            if (d < edgeThreshold) {
              const alpha = (1 - d / edgeThreshold) * edgeOpacity * Math.min(a.opacity, b.opacity);
              ctx.strokeStyle = `rgba(100,230,245,${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              // Slight curve
              const mx = (a.x + b.x) / 2 + (Math.random() - 0.5) * 4;
              const my = (a.y + b.y) / 2 + (Math.random() - 0.5) * 4;
              ctx.quadraticCurveTo(mx, my, b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      // ── DENSITY FOG / NEBULA ─────────────────────────────────────────────────
      if (s.phase >= 4) {
        // Group nodes by cluster, compute centroid
        const clusterMap = {};
        s.nodes.forEach((n) => {
          if (!clusterMap[n.clusterId]) clusterMap[n.clusterId] = { x: 0, y: 0, count: 0, op: 0 };
          clusterMap[n.clusterId].x += n.x;
          clusterMap[n.clusterId].y += n.y;
          clusterMap[n.clusterId].op += n.opacity;
          clusterMap[n.clusterId].count++;
        });

        Object.values(clusterMap).forEach((cl) => {
          cl.x /= cl.count;
          cl.y /= cl.count;
          cl.op /= cl.count;
          const fogRadius = 50 + cl.count * 4;
          const pulse = 1 + Math.sin(ts * 0.001) * 0.05;
          const grad = ctx.createRadialGradient(cl.x, cl.y, 0, cl.x, cl.y, fogRadius * pulse);
          const fogAlpha = cl.op * (s.phase >= 5 ? 0.12 : 0.07);
          grad.addColorStop(0, `rgba(100,220,240,${fogAlpha})`);
          grad.addColorStop(0.4, `rgba(120,100,220,${fogAlpha * 0.4})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        });
      }

      // ── NODES ───────────────────────────────────────────────────────────────
      s.nodes.forEach((n) => {
        if (n.opacity < 0.01) return;
        // Glow halo
        const haloGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 5);
        haloGrad.addColorStop(0, `rgba(153,247,255,${n.opacity * 0.3})`);
        haloGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(200,245,255,${n.opacity})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearTimeout(t5); clearTimeout(tExit); clearTimeout(t6);
    };
  }, []); // empty dep array — timers run exactly once

  return (
    <div className="fixed inset-0 z-[100] bg-[#05060A] overflow-hidden">
      {/* Canvas — full screen live render */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Logo Reveal */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.h1
                initial={{ filter: 'blur(24px)', opacity: 0, y: 6 }}
                animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                className="font-space text-[5.5rem] font-black tracking-[0.35em] text-white uppercase leading-none"
                style={{ textShadow: '0 0 40px rgba(153,247,255,0.35)' }}
              >
                Net<span className="text-[#99f7ff]">Nebula</span>
              </motion.h1>

              {/* Glow line — single pulse */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: [0, 1.1, 1], opacity: [0, 0.8, 0.3] }}
                transition={{ delay: 0.5, duration: 1.8, ease: 'easeOut' }}
                className="w-72 h-[1px]"
                style={{ background: 'linear-gradient(90deg, transparent, #99f7ff, transparent)', boxShadow: '0 0 12px rgba(153,247,255,0.6)' }}
              />

              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 0.35, y: 0 }}
                transition={{ delay: 1.2, duration: 1.2 }}
                className="font-mono text-[0.6rem] tracking-[0.7em] text-[#99f7ff] uppercase"
              >
                Intelligence Synchronized
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Phase readout — ultra minimal */}
      <div className="absolute bottom-10 left-10 z-20 flex items-center gap-3 select-none pointer-events-none">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1 h-1 rounded-full bg-[#99f7ff]"
        />
        <span className="font-mono text-[8px] tracking-[0.5em] text-white/20 uppercase">
          {['', 'System_Ready', 'Data_Ingestion', 'Structure_Discovery', 'Nebula_Emergence', 'Intelligence_Locked'][phase]}
        </span>
      </div>

      {/* Skip */}
      <button
        onClick={onComplete}
        className="absolute top-10 right-10 z-20 font-mono text-[8px] tracking-[0.4em] text-white/10 hover:text-white/30 transition-colors duration-500 uppercase"
      >
        Skip
      </button>

      {/* Seamless exit fade overlay */}
      <motion.div
        className="absolute inset-0 z-50 bg-[#05060A] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 1 : 0 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />
    </div>
  );
};

export default SplashScreen;
