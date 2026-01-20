import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * This component generates and displays the particle system.
 * It now accepts `gapFactor` and a `spacingMultiplier` to control the layout.
 */
const BufferScene = ({ gapFactor, spacingMultiplier }) => {
    const mesh = useRef();
    // The initial desired count of particles
    const particleCount = 100000;

    // useMemo will recalculate the particles whenever gapFactor or spacingMultiplier changes.
    const { positions, colors, finalCount } = useMemo(() => {
        const resol = Math.max(2, Math.round(Math.cbrt(particleCount)));
        
        // --- Updated Spacing Calculation ---
        // The base spacing is multiplied by our new slider value.
        // This controls how spread out the individual points are.
        const spacing = (2 / resol) * spacingMultiplier;

        const posArr = [];
        const colArr = [];

        const midpoint = (resol - 1) / 2;
        const gapThreshold = (resol * gapFactor) / 2;

        for (let z = 0; z < resol; z++) {
            for (let y = 0; y < resol; y++) {
                for (let x = 0; x < resol; x++) {
                    const isGapX = Math.abs(x - midpoint) < gapThreshold;
                    const isGapY = Math.abs(y - midpoint) < gapThreshold;
                    const isGapZ = Math.abs(z - midpoint) < gapThreshold;

                    if (isGapX && isGapY && isGapZ) {
                        continue;
                    }

                    const px = (x - midpoint) * spacing;
                    const py = (y - midpoint) * spacing;
                    const pz = (z - midpoint) * spacing;

                    posArr.push(px * px * px, py * py * py, pz * pz * pz);

                    const t = (py / 1.2 + 1) * 0.1;
                    const r = 0.2 + 0.8 * t;
                    const g = 0.6 * (1 - t);
                    const b = 0.9 * (0.5 + 0.5 * (1 - t));

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
    }, [gapFactor, spacingMultiplier]); // Re-run when either slider changes

    // A unique key ensures the geometry is fully recreated when its properties change
    const uniqueKey = `${gapFactor}-${spacingMultiplier}`;

    return (
        <>
            <points ref={mesh}>
                <bufferGeometry key={uniqueKey}>
                    <bufferAttribute
                        attach={"attributes-position"}
                        count={finalCount}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={finalCount}
                        array={colors}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    vertexColors
                    size={0.025}
                    sizeAttenuation
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </>
    );
};

// Main component to set up the scene, canvas, and UI controls
const BufferShaders4_3 = () => {
    // State for the central gap
    const [gapFactor, setGapFactor] = useState(0.25);
    // State for the inter-point spacing
    const [spacingMultiplier, setSpacingMultiplier] = useState(1.0);

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#111', position: 'relative' }}>
            {/* UI for controlling the particle system */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                color: 'white',
                background: 'rgba(0,0,0,0.5)',
                padding: '12px 20px',
                borderRadius: '8px',
                fontFamily: `'Inter', sans-serif`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
            }}>
                {/* --- Gap Control --- */}
                <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '100%'}}>
                    <label htmlFor="gapSlider" style={{flexShrink: 0}}>Adjust Gap</label>
                    <input
                        id="gapSlider"
                        type="range"
                        min="0"
                        max="0.9"
                        step="0.01"
                        value={gapFactor}
                        onChange={(e) => setGapFactor(parseFloat(e.target.value))}
                        style={{cursor: 'pointer', width: '150px'}}
                    />
                    <span style={{width: '35px', textAlign: 'right'}}>{gapFactor.toFixed(2)}</span>
                </div>
                {/* --- Spacing Control --- */}
                 <div style={{display: 'flex', alignItems: 'center', gap: '15px', width: '100%'}}>
                    <label htmlFor="spacingSlider" style={{flexShrink: 0}}>Adjust Spacing</label>
                    <input
                        id="spacingSlider"
                        type="range"
                        min="0.1" // Min of 0.1 to prevent collapsing to a single point
                        max="2.0"
                        step="0.01"
                        value={spacingMultiplier}
                        onChange={(e) => setSpacingMultiplier(parseFloat(e.target.value))}
                        style={{cursor: 'pointer', width: '150px'}}
                    />
                    <span style={{width: '35px', textAlign: 'right'}}>{spacingMultiplier.toFixed(2)}</span>
                </div>
            </div>

            <Canvas
                gl={{ antialias: true }}
                dpr={[1, 2]}
                camera={{ position: [0, 0, 4], fov: 75 }}
            >
                <color attach="background" args={['#111']} />
                {/* Pass both state values down to the scene */}
                <BufferScene gapFactor={gapFactor} spacingMultiplier={spacingMultiplier} />
                <OrbitControls autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
};

export default BufferShaders4_3;