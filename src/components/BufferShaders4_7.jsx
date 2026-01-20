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

                    // --- Mode B with spherical mask (replace Mode B block) ---
                    const lineThicknessMultiplier = 2.0;
                    const amplitudeY = 0.48;
                    const amplitudeZ = 0.28;
                    const pxWeight = 0.9;
                    const pzWeight = 0.25;
                    const lineSoftness = 1.5;
                    const freq_base = (Math.PI * 2 * freqMultiplier) / (2 * max_pos);
                    const t = px * pxWeight + pz * pzWeight;
                    const ampY = max_pos * amplitudeY;
                    const ampZ = max_pos * amplitudeZ;

                    // --- New: sphere settings ---
                    // Choose sphere size:
                    // - For half the cube radius: use 0.5
                    // - For "1 / 1.5" of cube (≈ 0.6667): use 1 / 1.5
                    const sphereRadiusMultiplier = 1 / 1.2; // <-- set to 0.5 or 1/1.5 as you like
                    const sphereEdgeMultiplier = 0.15;      // thickness of soft boundary as fraction of sphere radius
                    const sphereSoftness = 10.;             // >1 = softer spherical boundary

                    const sphereRadius = max_pos * sphereRadiusMultiplier;
                    const sphereEdge = sphereRadius * sphereEdgeMultiplier;

                    // distance from cube center (0,0,0)
                    const distCenter = Math.hypot(px, py, pz);

                    // sphere mask: 1 inside sphere, 0 outside; smooth fade in the edge band
                    let sphereMask = 0;
                    if (distCenter <= sphereRadius) {
                        sphereMask = 1;
                    } else if (distCenter <= sphereRadius + sphereEdge) {
                        // linear fade across the edge band
                        sphereMask = 1 - (distCenter - sphereRadius) / sphereEdge;
                    } else {
                        sphereMask = 0;
                    }
                    sphereMask = Math.pow(Math.max(0, sphereMask), sphereSoftness); // shape the falloff

                    // --- original path (depends on px & pz) ---
                    const centerY = Math.sin(t * freq_base) * ampY;
                    const centerZ = Math.cos(t * freq_base) * ampZ;

                    const maxNorm = Math.max(Math.abs(px), Math.abs(py), Math.abs(pz)) / max_pos;
                    const falloff = 1 - maxNorm;

                    const distToLine = Math.hypot(py - centerY, pz - centerZ);
                    const lineThickness = spacing * lineThicknessMultiplier;

                    let lineMask = Math.max(0, 1 - distToLine / (lineThickness * 4));
                    lineMask = Math.pow(lineMask, lineSoftness);

                    // base background alpha (keeps field faint & slightly modulated)
                    const baseAlpha = 0.06 + 0.22 * ((Math.sin(px * freq_base) + 1) / 2) * falloff;

                    // Combine: line contribution is gated by the sphere, background is suppressed inside sphere
                    const lineAlpha = 0.94 * lineMask * sphereMask; // strong only inside sphere
                    const suppressedBgFactor = 1 - 0.85 * sphereMask; // when sphereMask=1 => bg suppressed to 0.15
                    const a = Math.max(lineAlpha, baseAlpha * falloff * suppressedBgFactor * 0.9);

                    const r = 0.85, g = 0.5, b = 0.1;
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
const BufferShaders4_7 = () => {
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

export default BufferShaders4_7;