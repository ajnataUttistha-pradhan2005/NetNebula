import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import FinalNebula from './FinalNebula';

const GalaxyRenderer = ({ phase }) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 35 }}
        gl={{ antialias: false, stencil: false, depth: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#05060A']} />
        
        <Suspense fallback={null}>
          <FinalNebula phase={phase} />

          {/* Soft Cinematic Post-processing */}
          <EffectComposer disableNormalPass>
            <Bloom 
              luminanceThreshold={0.2} 
              mipmapBlur 
              intensity={1.2} 
              radius={0.4} 
            />
            <ChromaticAberration offset={[0.001, 0.001]} />
            <Noise opacity={0.03} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GalaxyRenderer;
