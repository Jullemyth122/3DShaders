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

        // console.log(resol, midpoint, spacingMultiplier, gapThreshold)

        for (let z = 0; z < resol; z++) {
            for (let y = 0; y < resol; y++) {
                for (let x = 0; x < resol; x++) {

                    const isGapX = Math.abs(x - midpoint) < gapThreshold;
                    const isGapY = Math.abs(y - midpoint) < gapThreshold;
                    const isGapZ = Math.abs(z - midpoint) < gapThreshold;

                    if (isGapX && isGapZ && isGapY) {
                        continue;
                    }
                    
                    
                    const px = (x - midpoint) * spacing;
                    const py = (y - midpoint) * spacing;
                    const pz = (z - midpoint) * spacing;
                    
                    // posArr.push(1 / (px) - pz - py, 1 / (py) - px - pz, 1 / (pz) - px - py);
                    // posArr.push(px * px * px, py * py * py, pz * pz * pz);
                    
                    // const exponent = 3; // try 1 (linear), 1.5, 2, 3
                    // const fx = Math.sin(px) * Math.pow(Math.abs(px), exponent);
                    // const fy = Math.sin(py) * Math.pow(Math.abs(py), exponent);
                    // const fz = Math.sin(pz) * Math.pow(Math.abs(pz), exponent);

                    // posArr.push(fx, fy, fz);

                    // function signPow(v, e) {
                    //     return Math.sign(v) * Math.pow(Math.abs(v), e);
                    // }
                    // const exponent = 3. // try 0.6 (expand) -> 3 (compress)
                    // posArr.push(signPow(px, exponent), signPow(py, exponent), signPow(pz, exponent));


                    // const maxCoord = midpoint * spacing || 1e-6;
                    // const nx = px / maxCoord;
                    // const ny = py / maxCoord;
                    // const nz = pz / maxCoord;

                    // const e = 2;
                    // const fx = Math.sign(nx) * Math.pow(Math.abs(nx), e) * maxCoord;
                    // const fy = Math.sign(ny) * Math.pow(Math.abs(ny), e) * maxCoord;
                    // const fz = Math.sign(nz) * Math.pow(Math.abs(nz), e) * maxCoord;
                    // posArr.push(fx, fy, fz);

                    // function mix(a,b,t){ return a*(1-t)+b*t }
                    // function smoothBlend(v, e, t0){ // t0 in [0,1] how quickly nonlinear kicks in
                    //     const maxC = midpoint * spacing || 1e-6;
                    //     const n = v / maxC; // normalized
                    //     const nonlinear = Math.sign(n) * Math.pow(Math.abs(n), e);
                    //     // weight based on |n|
                    //     const w = Math.min(1, Math.max(0, (Math.abs(n) - t0) / (1 - t0)));
                    //     return mix(v, nonlinear * maxC, w);
                    // }
                    // const fx = smoothBlend(px, 3, 5.25); // linear near center, quad outside
                    // posArr.push(fx, smoothBlend(py,3,5.25), smoothBlend(pz,3,5.25));

                    // const radius = Math.hypot(px, py, pz);
                    // if (radius === 0) {
                    //     posArr.push(0,0,0);
                    // } else {
                    // // choose R(radius): e.g. R = radius^alpha or R = sin(radius*freq)*amp + offset
                    //     const alpha = 0.05; // <1 expands near center
                    //     const R = Math.pow(radius, alpha);
                    //     const k = R / radius;
                    //     posArr.push(px * k, py * k, pz * k);
                    // }

                    // const radius = Math.hypot(px, py);
                    // const angle = radius * 2.0 * Math.PI; // 3 full turns per unit radius
                    // const cosA = Math.cos(angle), sinA = Math.sin(angle);
                    // const rx = px*cosA - py*sinA;
                    // const ry = px*sinA + py*cosA;
                    // posArr.push(rx, ry, pz);

                    // const exponent = 5.;
                    // const fx = Math.sin(px * 10.0) * Math.pow(Math.abs(px), exponent); // 3.0 frequency
                    // posArr.push(fx, Math.sin(py*10)*Math.pow(Math.abs(py),exponent), Math.sin(pz*10)*Math.pow(Math.abs(pz),exponent));

                    // const ax = px; // linear
                    // const ay = py; // linear
                    // const az = pz; // linear
                    // const blendx = Math.sign(px)*Math.pow(Math.abs(px),0.9); // expand near 0
                    // const blendy = Math.sign(py)*Math.pow(Math.abs(py),0.5); // expand near 0
                    // const blendz = Math.sign(pz)*Math.pow(Math.abs(pz),0.0); // expand near 0
                    // const fact = 1.; // blend factor
                    // const fx = ax*(1.-fact) + blendx*fact;
                    // const fy = ay*(1.0-fact) + blendy*fact;
                    // const fz = az*(5-fact) + blendz*fact;
                    // posArr.push(fx, fy, fz);

                    // params
                    const swirlStrength = 2.; // how much angle increases with r
                    const radialExponent = 2; // <1 expands near center, >1 compresses

                    const radius = Math.hypot(px * px, py * py, pz * pz);
                    const theta = Math.atan2(py, px);
                    const theta1 = Math.atan2(pz, px);
                    const theta2 = Math.atan2(py, pz);

                    const thetaPrime = (theta + theta1 + theta2) + radius * swirlStrength;      // angle + k * radius
                    const rPrime = Math.pow(radius, radialExponent);

                    const fx = rPrime * Math.cos(thetaPrime);
                    const fy = rPrime * Math.sin(thetaPrime);
                    const fz = pz + rPrime * Math.cos(thetaPrime) / (Math.PI / 2); // keep z linear (or modify)
                    posArr.push(fx, fy, fz);

                    // params
                    // const k = 2.;   // logged growth factor
                    // const turns = 5.;

                    // const radius = Math.hypot(px, py);
                    // const theta = Math.atan2(py, px);

                    // // Make radius' behave like exp(b*theta) : simulate by making radius depend exponentially on theta
                    // const rPrime = Math.exp(k * theta) * 0.1; // scale down so values remain small
                    // const thetaPrime = theta + radius * turns;

                    // const fx = rPrime * Math.cos(thetaPrime);
                    // const fy = rPrime * Math.sin(thetaPrime);
                    // const fz = pz;
                    // posArr.push(fx, fy, fz);

                    // // params
                    // const turnsPerUnitZ = Math.PI * 2 * 100; // radians of rotation per unit z
                    // const radialMod = 2.; // scale radial distance

                    // const radius = Math.hypot(px, py);
                    // const theta = Math.atan2(py, px);

                    // // rotate angle by amount proportional to z (creates helix)
                    // const thetaPrime = theta + pz * turnsPerUnitZ + radius * 4.0;
                    // const rPrime = Math.pow(radius, 0.35) * radialMod;

                    // const fx = rPrime * Math.cos(thetaPrime);
                    // const fy = rPrime * Math.sin(thetaPrime);

                    // // optionally make z coil: z' = pz + 0.2 * Math.sin(theta * 8);
                    // const fz = pz + 10. * Math.sin(theta * 100);

                    // posArr.push(fx, fy, fz);

                    // const i = z * resol * resol + y * resol + x;
                    // const c = 0.15; // scaling
                    // const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996

                    // const radius = c * Math.sqrt(i);
                    // const theta = i * goldenAngle;

                    // const fx = radius * Math.cos(theta);
                    // const fy = radius * Math.sin(theta);
                    // const fz = pz * 0.5; // keep some z layering

                    // posArr.push(fx, fy, fz);

                    // params
                    // const baseTurns = -10;    // base twist per unit radius
                    // const radialExp = 0.95;   // <1 expands near center
                    // const wiggleFreq = 10.;
                    // const wiggleAmp = 0.;
                    // const zTwist = 10.;

                    // const radius = Math.hypot(px, py);
                    // const theta = Math.atan2(py, px);

                    // // radial modulation: make radius wobble creating rings/bands
                    // const rMod = Math.pow(radius, radialExp) * (1 + wiggleAmp * Math.sin(radius * wiggleFreq));

                    // // angle depends on radius and z
                    // const thetaPrime = theta + baseTurns * Math.pow(radius, 0.6) + zTwist * pz;

                    // // rotate XY by thetaPrime
                    // const rx = rMod * Math.cos(thetaPrime);
                    // const ry = rMod * Math.sin(thetaPrime);

                    // // optional tilt: rotate around X by function of theta (gives spiral cone)
                    // const tiltAmount = 0.6 * Math.sin(theta * 0.5 + pz * 1.0);
                    // const fz = pz * 0.6 + tiltAmount * rMod;

                    // posArr.push(rx, ry, fz);



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
const BufferShaders4_10 = () => {
    // State for the central gap
    const [gapFactor, setGapFactor] = useState(0.);
    // State for the inter-point spacing
    const [spacingMultiplier, setSpacingMultiplier] = useState(2.0);

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
                display: 'none',
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
                <OrbitControls />
            </Canvas>
        </div>
    );
};

export default BufferShaders4_10;