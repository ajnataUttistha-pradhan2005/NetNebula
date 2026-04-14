import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';

const CyberPrism = ({ phase }) => {
  const prismRef = useRef();
  const signalRef = useRef();
  const groupRef = useRef();

  // 1. Data Ribbons (Phase 2-3)
  const ribbons = useMemo(() => {
    const list = [];
    for (let i = 0; i < 8; i++) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -10, 0),
            new THREE.Vector3((Math.random() - 0.5) * 5, -5, (Math.random() - 0.5) * 5),
            new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10),
            new THREE.Vector3(0, 5, 0),
        ]);
        list.push(curve);
    }
    return list;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    if (groupRef.current) {
        groupRef.current.rotation.y = time * 0.2;
    }

    if (prismRef.current) {
        // Transition Prism
        const targetScale = phase >= 4 ? 1 : 0;
        prismRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
        prismRef.current.rotation.x = time * 0.3;
        prismRef.current.rotation.z = time * 0.1;
    }

    if (signalRef.current) {
        // Initial Signal (Phase 1-2)
        const targetHeight = phase === 1 ? 20 : 0.5;
        const targetWidth = phase === 1 ? 0.01 : 0.5;
        signalRef.current.scale.y = THREE.MathUtils.lerp(signalRef.current.scale.y, targetHeight, 0.1);
        signalRef.current.scale.x = THREE.MathUtils.lerp(signalRef.current.scale.x, targetWidth, 0.1);
        signalRef.current.visible = phase < 4;
    }

    // Camera Zoom Out Effect
    const targetZ = phase >= 4 ? 12 : 8;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.02);
  });

  return (
    <group ref={groupRef}>
      {/* 1. Initial Signal Pulse */}
      <mesh ref={signalRef}>
        <cylinderGeometry args={[1, 1, 1, 32]} />
        <meshBasicMaterial color="#00F1FE" transparent opacity={0.8} />
      </mesh>

      {/* 2. The Futuristic Prism (Crystallized Intelligence) */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={prismRef} scale={[0, 0, 0]}>
          <icosahedronGeometry args={[2.5, 1]} />
          <meshBasicMaterial 
            color="#00F1FE" 
            wireframe 
            transparent 
            opacity={0.4} 
            blending={THREE.AdditiveBlending} 
          />
          
          {/* Inner Core Glow */}
          <mesh scale={[0.4, 0.4, 0.4]}>
            <icosahedronGeometry args={[2.5, 0]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
        </mesh>
      </Float>

      {/* 4. Data Ribbons (Flowing into core) */}
      {phase >= 2 && phase < 5 && ribbons.map((curve, i) => (
        <Ribbon key={i} curve={curve} phase={phase} index={i} />
      ))}

      {/* 5. Environment Particles (Subtle) */}
       <points>
         <sphereGeometry args={[15, 32, 32]} />
         <pointsMaterial size={0.02} color="#00F1FE" transparent opacity={0.1} />
       </points>
    </group>
  );
};

const Ribbon = ({ curve, phase, index }) => {
    const meshRef = useRef();
    
    useFrame((state) => {
        const t = (state.clock.getElapsedTime() * 0.5 + index * 0.1) % 1;
        if (meshRef.current) {
            const pos = curve.getPoint(t);
            meshRef.current.position.copy(pos);
            meshRef.current.scale.setScalar(phase === 3 ? 2 : 1);
            meshRef.current.material.opacity = phase === 3 ? 0.8 : 0.3;
        }
    });

    return (
        <mesh ref={meshRef}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#BC6FFB" transparent opacity={0.5} blending={3} />
        </mesh>
    );
}

export default CyberPrism;
