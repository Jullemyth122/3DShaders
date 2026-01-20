import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * This component generates and displays the particle system.
 * It now accepts props to control the layout and the selective bloom effect.
 */
const BufferScene = ({ gapFactor, spacingMultiplier, bloomZone }) => {
    const mesh = useRef();
    // Kept your increased particle count for a denser cloud
    const particleCount = 100000;

    // useMemo will recalculate when any of the control sliders change.
    const { positions, colors, finalCount } = useMemo(() => {
        const resol = Math.max(2, Math.round(Math.cbrt(particleCount)));
        const spacing = (2 / resol) * spacingMultiplier;

        const posArr = [];
        const colArr = [];

        const midpoint = (resol - 1) / 2;
        const gapThreshold = (resol * gapFactor) / 2;
        
        // This defines a slightly larger zone around the gap.
        // Particles within this zone will be made brighter to trigger the bloom effect.
        const bloomThreshold = gapThreshold * bloomZone;

        for (let z = 0; z < resol; z++) {
            for (let y = 0; y < resol; y++) {
                for (let x = 0; x < resol; x++) {
                    const distFromMidX = Math.abs(x - midpoint);
                    const distFromMidY = Math.abs(y - midpoint);
                    const distFromMidZ = Math.abs(z - midpoint);

                    // Check if the particle is inside the central gap
                    const isInsideGap = distFromMidX < gapThreshold && distFromMidY < gapThreshold && distFromMidZ < gapThreshold;
                    
                    if (isInsideGap) {
                        continue; // Skip rendering points inside the gap
                    }

                    // I'm preserving your cool cubed position effect!
                    const px = (x - midpoint) * spacing;
                    const py = (y - midpoint) * spacing;
                    const pz = (z - midpoint) * spacing;
                    posArr.push(px * px * px, py * py * py, pz * pz * pz);

                    // Calculate base color
                    const t = (py / 1.2 + 1) * 0.1;
                    let r = 0.2 + 0.8 * t;
                    let g = 0.6 * (1 - t);
                    let b = 0.9 * (0.5 + 0.5 * (1 - t));

                    // --- Selective Bloom Logic ---
                    // Check if the particle is in our "bloom zone" (but not the gap)
                    const isInBloomZone = distFromMidX < bloomThreshold && distFromMidY < bloomThreshold && distFromMidZ < bloomThreshold;

                    if (isInBloomZone) {
                        // To make something bloom, we push its color values beyond the normal 0-1 range.
                        // The Bloom post-processing effect will detect these "super-bright" colors.
                        const bloomIntensityFactor = 10;
                        r *= bloomIntensityFactor;
                        g *= bloomIntensityFactor;
                        b *= bloomIntensityFactor;
                    }

                    colArr.push(r, g, b);
                }
            }
        }
        
        const actualCount = posArr.length / 3;
        return {
            positions: new Float32Array(posArr),
            colors: new Float32Array(colArr),
            finalCount: actualCount,
        };
    }, [gapFactor, spacingMultiplier, bloomZone]);

    // A unique key ensures the geometry is fully recreated when its properties change
    const uniqueKey = `${gapFactor}-${spacingMultiplier}-${bloomZone}`;

    return (
        <points ref={mesh}>
            <bufferGeometry key={uniqueKey}>
                <bufferAttribute attach={"attributes-position"} count={finalCount} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={finalCount} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                vertexColors
                size={0.015} // Slightly smaller size for the higher particle count
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

// Main component to set up the scene, canvas, and UI controls
const BufferShaders4_5 = () => {
    const [gapFactor, setGapFactor] = useState(0.5);
    const [spacingMultiplier, setSpacingMultiplier] = useState(2.0);
    
    // --- New State for Bloom Controls ---
    const [bloomIntensity, setBloomIntensity] = useState(5.0);
    const [bloomThreshold, setBloomThreshold] = useState(1.0);
    const [bloomZone, setBloomZone] = useState(1.);

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#000', position: 'relative' }}>
            <div style={{
                // displays this controls
                display: 'none',
                position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
                zIndex: 100, color: 'white', background: 'rgba(20,20,20,0.7)', padding: '12px 20px',
                borderRadius: '8px', fontFamily: `'Inter', sans-serif`, 
                flexDirection: 'column', alignItems: 'center', gap: '10px', backdropFilter: 'blur(5px)',
            }}>
                {/* --- Layout Controls --- */}
                <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '320px'}}>
                    <label htmlFor="gapSlider" style={{flex: 1}}>Gap Size</label>
                    <input id="gapSlider" type="range" min="0" max="0.9" step="0.01" value={gapFactor} onChange={(e) => setGapFactor(parseFloat(e.target.value))} style={{cursor: 'pointer', flex: 2}}/>
                    <span style={{width: '35px', textAlign: 'right'}}>{gapFactor.toFixed(2)}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '320px'}}>
                    <label htmlFor="spacingSlider" style={{flex: 1}}>Spacing</label>
                    <input id="spacingSlider" type="range" min="0.1" max="2.0" step="0.01" value={spacingMultiplier} onChange={(e) => setSpacingMultiplier(parseFloat(e.target.value))} style={{cursor: 'pointer', flex: 2}}/>
                    <span style={{width: '35px', textAlign: 'right'}}>{spacingMultiplier.toFixed(2)}</span>
                </div>
                
                 {/* --- Bloom Controls --- */}
                 <div style={{width: '100%', borderTop: '1px solid rgba(255,255,255,0.2)', margin: '5px 0'}}></div>

                 <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '320px'}}>
                    <label htmlFor="bloomZoneSlider" style={{flex: 1}}>Bloom Zone</label>
                    <input id="bloomZoneSlider" type="range" min="1.0" max="3.0" step="0.01" value={bloomZone} onChange={(e) => setBloomZone(parseFloat(e.target.value))} style={{cursor: 'pointer', flex: 2}}/>
                    <span style={{width: '35px', textAlign: 'right'}}>{bloomZone.toFixed(2)}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '320px'}}>
                    <label htmlFor="bloomIntensitySlider" style={{flex: 1}}>Bloom Intensity</label>
                    <input id="bloomIntensitySlider" type="range" min="0" max="5.0" step="0.01" value={bloomIntensity} onChange={(e) => setBloomIntensity(parseFloat(e.target.value))} style={{cursor: 'pointer', flex: 2}}/>
                    <span style={{width: '35px', textAlign: 'right'}}>{bloomIntensity.toFixed(2)}</span>
                </div>
                 <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '320px'}}>
                    <label htmlFor="bloomThresholdSlider" style={{flex: 1}}>Bloom Threshold</label>
                    <input id="bloomThresholdSlider" type="range" min="0" max="1.0" step="0.01" value={bloomThreshold} onChange={(e) => setBloomThreshold(parseFloat(e.target.value))} style={{cursor: 'pointer', flex: 2}}/>
                    <span style={{width: '35px', textAlign: 'right'}}>{bloomThreshold.toFixed(2)}</span>
                </div>

            </div>

            <Canvas gl={{ antialias: true, toneMapping: THREE.NoToneMapping }} dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 1000 }}>
                <color attach="background" args={['#000']} />
                <BufferScene gapFactor={gapFactor} spacingMultiplier={spacingMultiplier} bloomZone={bloomZone} />
                <OrbitControls autoRotate autoRotateSpeed={0.2} />
                
                {/* --- Post-processing Effects --- */}
                <EffectComposer>
                    <Bloom
                        intensity={bloomIntensity} 
                        luminanceThreshold={bloomThreshold} 
                        luminanceSmoothing={0.9}
                        mipmapBlur // Makes the bloom smoother and more realistic
                    />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default BufferShaders4_5;