import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments } from 'three';

const NeuralNebula = ({ phase }) => {
  const pointsRef = useRef();
  const linesRef = useRef();
  const count = 100; // Controlled number of nodes for a clear graph look
  
  // 1. Initial State Data
  const { positions, targets, drift, connections } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const tars = new Float32Array(count * 3);
    const d = new Float32Array(count * 3);
    const connIndices = [];

    for (let i = 0; i < count; i++) {
      // Random starting positions (Void/Sparks)
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      
      // Data Graph Target Positions (Structured look)
      // Create a clustered core + some outer branches
      const radius = i < count * 0.4 ? Math.random() * 2 : Math.random() * 6;
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      tars[i * 3] = radius * Math.sin(phi) * Math.cos(angle);
      tars[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(angle);
      tars[i * 3 + 2] = radius * Math.cos(phi);

      // Random drift vectors
      d[i * 3] = (Math.random() - 0.5) * 0.005;
      d[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      d[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    // Connections (Nearest Neighbors for a Neural look)
    for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
            const dx = tars[i * 3] - tars[j * 3];
            const dy = tars[i * 3 + 1] - tars[j * 3 + 1];
            const dz = tars[i * 3 + 2] - tars[j * 3 + 2];
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist < 1.5) {
                connIndices.push(i, j);
            }
        }
    }

    return { 
        positions: pos, 
        targets: tars, 
        drift: d, 
        connections: new Uint16Array(connIndices) 
    };
  }, [count]);

  // 2. Animation Logic
  const tempPos = new THREE.Vector3();
  const tempTarget = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const currentAttr = pointsRef.current.geometry.attributes.position;
    const array = currentAttr.array;

    for (let i = 0; i < count; i++) {
      tempPos.set(array[i * 3], array[i * 3 + 1], array[i * 3 + 2]);
      tempTarget.set(targets[i * 3], targets[i * 3 + 1], targets[i * 3 + 2]);

      if (phase === 2) {
        // Sparks: Subtle drift
        array[i * 3] += drift[i * 3];
        array[i * 3 + 1] += drift[i * 3 + 1];
        array[i * 3 + 2] += drift[i * 3 + 2];
      } 
      else if (phase === 3) {
        // Nebula: Slow attract to center (clustering)
        tempPos.lerp(new THREE.Vector3(0, 0, 0), 0.02);
        array[i * 3] = tempPos.x;
        array[i * 3 + 1] = tempPos.y;
        array[i * 3 + 2] = tempPos.z;
      }
      else if (phase >= 4) {
        // Snap & Stabilize: Snap to graph positions
        const lerpSpeed = phase === 4 ? 0.08 : 0.03; // Fast snap, then slow stabilize
        tempPos.lerp(tempTarget, lerpSpeed);
        
        // Add subtle organic "breathing" movement in final phase
        if (phase === 5) {
           tempPos.x += Math.sin(time + i) * 0.002;
           tempPos.y += Math.cos(time + i * 0.5) * 0.002;
        }

        array[i * 3] = tempPos.x;
        array[i * 3 + 1] = tempPos.y;
        array[i * 3 + 2] = tempPos.z;
      }
    }

    currentAttr.needsUpdate = true;

    // Sync line positions with points
    if (linesRef.current) {
        linesRef.current.geometry.attributes.position.array.set(array);
        linesRef.current.geometry.attributes.position.needsUpdate = true;
        linesRef.current.visible = phase >= 4;
        linesRef.current.material.opacity = THREE.MathUtils.lerp(
            linesRef.current.material.opacity, 
            phase >= 4 ? 0.2 : 0, 
            0.05
        );
    }

    // Scene rotation
    pointsRef.current.rotation.y = time * 0.05;
    if (linesRef.current) linesRef.current.rotation.y = time * 0.05;
  });

  return (
    <group>
      {/* 5. The Nebula Ghostly Glow (Cloud) */}
      <points>
        <sphereGeometry args={[4, 32, 32]} />
        <pointsMaterial 
          size={0.02} 
          color="#99f7ff" 
          transparent 
          opacity={phase >= 3 ? 0.05 : 0} 
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* 4. The Data Nodes (Sparks) */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#99f7ff"
          transparent
          opacity={phase >= 2 ? 0.8 : 0}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>

      {/* 3. The Neural Connections (Lines) */}
      <lineSegments ref={linesRef}>
          <bufferGeometry>
              <bufferAttribute 
                attach="attributes-position"
                count={count}
                array={new Float32Array(count * 3)}
                itemSize={3}
              />
              <bufferAttribute 
                attach="index"
                count={connections.length}
                array={connections}
                itemSize={1}
              />
          </bufferGeometry>
          <lineBasicMaterial 
            color="#bc6ffb" 
            transparent 
            opacity={0} 
            blending={THREE.AdditiveBlending} 
          />
      </lineSegments>
    </group>
  );
};

export default NeuralNebula;
