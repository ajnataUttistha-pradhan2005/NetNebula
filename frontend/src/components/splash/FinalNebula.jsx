import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FinalNebula = ({ phase }) => {
  const pointsRef = useRef();
  const fogRef = useRef();
  const count = 400; // Optimal for high density without lag
  const clusterCount = 5;

  // 1. Core Data
  const { positions, clusters, velocity } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const clus = [];

    // Define random cluster centers
    for (let i = 0; i < clusterCount; i++) {
        clus.push({
            center: new THREE.Vector3(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            ),
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            orbitSpeed: (Math.random() - 0.5) * 0.01,
            particles: []
        });
    }

    // Assign particles to clusters for structured chaos
    for (let i = 0; i < count; i++) {
        const clusterIdx = Math.floor(Math.random() * clusterCount);
        clus[clusterIdx].particles.push(i);

        // Random starting positions (Void/Seeds)
        pos[i * 3] = (Math.random() - 0.5) * 15;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        
        vel[i * 3] = (Math.random() - 0.5) * 0.01;
        vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    return { positions: pos, clusters: clus, velocity: vel };
  }, [count, clusterCount]);

  // 2. Physics Simulation
  const tempPos = new THREE.Vector3();
  const tempTarget = new THREE.Vector3();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const array = pointsRef.current.geometry.attributes.position.array;
    const fogArray = fogRef.current?.geometry.attributes.position.array;

    clusters.forEach((cluster, cIdx) => {
        // Orbital motion for the cluster center
        if (phase >= 4) {
            cluster.center.applyAxisAngle(new THREE.Vector3(0, 1, 0), cluster.orbitSpeed);
        }

        cluster.particles.forEach((pIdx) => {
            tempPos.set(array[pIdx * 3], array[pIdx * 3 + 1], array[pIdx * 3 + 2]);

            if (phase === 2) {
                // Brownian Drift
                array[pIdx * 3] += velocity[pIdx * 3] + Math.sin(time + pIdx) * 0.002;
                array[pIdx * 3 + 1] += velocity[pIdx * 3 + 1] + Math.cos(time + pIdx) * 0.002;
                array[pIdx * 3 + 2] += velocity[pIdx * 3 + 2];
            }
            else if (phase >= 3) {
                // Force-Directed Clustering (Closer to target cluster center)
                tempTarget.copy(cluster.center);
                
                // Add local rotation within cluster for Phase 4+
                if (phase >= 4) {
                    const offset = new THREE.Vector3(
                        Math.sin(time * 0.5 + pIdx) * 0.5,
                        Math.cos(time * 0.5 + pIdx) * 0.5,
                        Math.sin(time + pIdx * 0.1) * 0.2
                    );
                    tempTarget.add(offset);
                }

                const strength = phase === 3 ? 0.02 : 0.05;
                tempPos.lerp(tempTarget, strength);

                array[pIdx * 3] = tempPos.x;
                array[pIdx * 3 + 1] = tempPos.y;
                array[pIdx * 3 + 2] = tempPos.z;
            }
        });

        // Update Density Fog to follow clusters
        if (fogArray && phase >= 3) {
            fogArray[cIdx * 3] = cluster.center.x;
            fogArray[cIdx * 3 + 1] = cluster.center.y;
            fogArray[cIdx * 3 + 2] = cluster.center.z;
        }
    });

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    if (fogRef.current) fogRef.current.geometry.attributes.position.needsUpdate = true;

    // Overall slow field rotation for Phase 4+
    if (phase >= 4) {
        pointsRef.current.rotation.y += 0.001;
        if (fogRef.current) fogRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      {/* Density Fog (Procedural) */}
      <points ref={fogRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={clusterCount}
            array={new Float32Array(clusterCount * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={8}
          color="#99f7ff"
          transparent
          opacity={phase >= 3 ? 0.08 : 0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          map={null} // Pure procedural glow
        />
      </points>

      {/* Structured Particles */}
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
          size={0.06}
          color="#99f7ff"
          transparent
          opacity={phase >= 2 ? 0.6 : 0}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      
      {/* Background Stardust (Static) */}
      <points>
        <sphereGeometry args={[20, 32, 32]} />
        <pointsMaterial size={0.01} color="#ffffff" transparent opacity={0.1} />
      </points>
    </group>
  );
};

export default FinalNebula;
