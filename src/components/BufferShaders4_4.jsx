import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * This component generates and displays the particle system.
 * It now accepts a `gapFactor` to control the size of the empty space in the center.
 */
const BufferScene = ({ gapFactor }) => {
    const mesh = useRef();
    // The initial desired count of particles
    const particleCount = 20000;

    // useMemo will recalculate the particle positions whenever gapFactor changes.
    const { positions, colors, finalCount } = useMemo(() => {
        // Calculate the grid resolution based on the desired particle count
        const resol = Math.max(2, Math.round(Math.cbrt(particleCount)));
        const spacing = 2 / resol;

        const posArr = [];
        const colArr = [];

        // --- New Gap Calculation Logic ---
        // Find the midpoint of the grid axis
        const midpoint = (resol - 1) / 2;
        // Determine the size of the gap based on the factor from the slider
        const gapThreshold = (resol * gapFactor) / 2;

        for (let z = 0; z < resol; z++) {
            for (let y = 0; y < resol; y++) {
                for (let x = 0; x < resol; x++) {
                    // Check if the current particle's coordinates fall within the gap threshold
                    const isGapX = Math.abs(x - midpoint) < gapThreshold;
                    const isGapY = Math.abs(y - midpoint) < gapThreshold;
                    const isGapZ = Math.abs(z - midpoint) < gapThreshold;

                    // If the particle is inside the central cubic gap, skip it
                    if (isGapX && isGapY && isGapZ) {
                        continue;
                    }

                    // Calculate the position of the particle relative to the center
                    const px = (x - midpoint) * spacing;
                    const py = (y - midpoint) * spacing;
                    const pz = (z - midpoint) * spacing;

                    posArr.push(px, py, pz);

                    // Calculate color based on the y-position to create a gradient
                    const t = (py / 1.2 + 1) * 0.5; // normalized to 0..1
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
    }, [gapFactor]); // Dependency array: ensures this code runs when gapFactor changes

    return (
        <>
            <points ref={mesh}>
                {/* We add a `key` here. When it changes, React Three Fiber knows to recreate the geometry */}
                <bufferGeometry key={gapFactor}>
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
const BufferShaders4_4 = () => {
    // State to hold the current gap factor from the slider
    const [gapFactor, setGapFactor] = useState(0.25);

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#111', position: 'relative' }}>
            {/* UI for controlling the gap */}
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
                alignItems: 'center',
                gap: '15px'
            }}>
                <label htmlFor="gapSlider">Adjust Gap</label>
                <input
                    id="gapSlider"
                    type="range"
                    min="0"
                    max="0.9" // Max of 0.9 to prevent all points from disappearing
                    step="0.01"
                    value={gapFactor}
                    onChange={(e) => setGapFactor(parseFloat(e.target.value))}
                    style={{cursor: 'pointer'}}
                />
                <span style={{width: '35px'}}>{gapFactor.toFixed(2)}</span>
            </div>

            <Canvas
                gl={{ antialias: true }}
                dpr={[1, 2]}
                camera={{ position: [0, 0, 3], fov: 75 }}
            >
                <color attach="background" args={['#111']} />
                {/* Pass the gapFactor state down to the scene */}
                <BufferScene gapFactor={gapFactor} />
                <OrbitControls autoRotate autoRotateSpeed={0.5} />
            </Canvas>
        </div>
    );
};

export default BufferShaders4_4;

