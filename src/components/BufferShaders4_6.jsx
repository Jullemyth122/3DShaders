import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';


function hsvToRgb(h, s, v) {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r, g, b;
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return [r, g, b];
}

/**
 * This component generates and displays the particle system.
 * It now accepts `gapFactor` and a `spacingMultiplier` to control the layout.
 */

const BufferScene = ({ gapFactor, spacingMultiplier, freqMultiplier = 2 }) => {
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

        const max_pos = midpoint * spacing;
        const max_cubed = Math.pow(max_pos, 1);
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

                    posArr.push(px, py , pz);

                    // --- replace the color-generation block with this (only colors changed) ---

                    // adjustable visual params (tweak these)
                    // const lineThicknessMultiplier = 1.2;   // larger => thicker visible line
                    // const amplitudeMultiplier = 0.5;      // controls sine amplitude (how far center wave moves in Y)
                    // const lineSoftness = 1.5;              // >1 = softer falloff, <1 = sharper edge

                    // const freq_base = (Math.PI * 2 * freqMultiplier) / (2 * max_pos); // same freq calc
                    // const amplitude = max_pos * amplitudeMultiplier; // scale wave amplitude to grid size

                    // // compute a base alpha/falloff for the whole volume (keeps edges faint)
                    // const maxNorm = Math.max(Math.abs(px), Math.abs(py), Math.abs(pz)) / max_pos;
                    // const falloff = 1 - maxNorm; // higher near center

                    // // Center sine-line definition (a straight line that wiggles in Y as X changes)
                    // const centerY = Math.sin(px * freq_base) * amplitude;
                    // const centerZ = 0.; // straight line lying in X-Y plane (if you want twist, set non-zero)

                    // // distance from this point to the imaginary sine-line
                    // const distToLine = Math.hypot(py * py * py - centerY, pz * pz * pz - centerZ);

                    // // thickness scaling (based on spacing so it behaves with different spacingMultiplier)
                    // const lineThickness = spacing * lineThicknessMultiplier;

                    // // convert distance to a smooth mask 0..1 (1 = on the line)
                    // let lineMask = Math.max(0, 1 - distToLine / (lineThickness * 4)); // dividing by 4 gives a wider feather
                    // lineMask = Math.pow(lineMask, lineSoftness); // soften / sharpen the falloff

                    // // base alpha for non-line points (kept subtle)
                    // const baseAlpha = 0.06 + 0.25 * ((Math.sin(px * freq_base) + 1) / 2) * falloff; // small modulation

                    // // final alpha: prefer strong alpha where lineMask is high, otherwise use baseAlpha * falloff
                    // const a = Math.max(0.92 * lineMask, baseAlpha * falloff * 0.5);

                    // // Colors: make the line white. Outside points remain white-ish but very transparent.
                    // // If you want colored off-line points, change r,g,b below.
                    // const r = 1.0;
                    // const g = 1.0;
                    // const b = 1.0;

                    // colArr.push(r, g, b, a);

                    // --- Mode B: combine px and pz for the path ---
                    // Blend px and pz into a single parameter 't' so the path depends on both axes.
                    const lineThicknessMultiplier = 2.;
                    const amplitudeY = 0.48;
                    const amplitudeZ = 0.28;
                    const pxWeight = 0.9;    // change these weights to bias towards px or pz
                    const pzWeight = 0.6;
                    const lineSoftness = 1.5;

                    const freq_base = (Math.PI * 2 * freqMultiplier) / (2 * max_pos);
                    const t = px * pxWeight + pz * pzWeight; // combined parameter
                    const ampY = max_pos * amplitudeY;
                    const ampZ = max_pos * amplitudeZ;

                    // center path now wiggles in both Y and Z using the combined t
                    const centerY = Math.sin(t * freq_base) * ampY;
                    const centerZ = Math.cos(t * freq_base ) * ampZ;

                    const maxNorm = Math.max(Math.abs(px), Math.abs(py), Math.abs(pz)) / max_pos;
                    const falloff = 1 - maxNorm;

                    const distToLine = Math.hypot(py - centerY, pz - centerZ);
                    const lineThickness = spacing * lineThicknessMultiplier;

                    let lineMask = Math.max(0, 1 - distToLine / (lineThickness * 4));
                    lineMask = Math.pow(lineMask, lineSoftness);

                    const baseAlpha = 0.06 + 0.22 * ((Math.sin(px * freq_base) + 1) / 2) * falloff;
                    const a = Math.max(0.94 * lineMask, baseAlpha * falloff * 0.9);

                    const r = 1.0, g = 1.0, b = 1.0;
                    colArr.push(r, g, b, a);


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
                        itemSize={4}
                    />
                </bufferGeometry>
                <pointsMaterial
                    vertexColors
                    size={0.025}
                    sizeAttenuation
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    transparent={true} // Enables alpha
                />
            </points>
        </>
    );
};

// Main component to set up the scene, canvas, and UI controls
const BufferShaders4_6 = () => {
    // State for the central gap
    const [gapFactor, setGapFactor] = useState(0.);
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
                {/* <OrbitControls autoRotate autoRotateSpeed={0.5} /> */}
                <OrbitControls />
            </Canvas>
        </div>
    );
};

export default BufferShaders4_6;