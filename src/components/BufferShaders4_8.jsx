import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const CubeParticles = ({ scale, gapFactor, opacity = 0.05, freqMultiplier = 2 }) => {
    const pointsRef = useRef();
    const particleCount = 100000;

    // Build positions once
    const { positions, finalCount, spacing, max_pos, colors } = useMemo(() => {
        const resol = Math.max(2, Math.round(Math.cbrt(particleCount)));
        const spacingVal = (2 / resol) * scale;

        const posArr = [], colArr = [];
        const midpoint = (resol - 1) / 2;
        const maxPosition = midpoint * spacingVal;
        const gapThreshold = (resol * gapFactor) / 2;

        for (let z = 0; z < resol; z++) {
            for (let y = 0; y < resol; y++) {
                for (let x = 0; x < resol; x++) {
                    const isGapX = Math.abs(x - midpoint) < gapThreshold;
                    const isGapY = Math.abs(y - midpoint) < gapThreshold;
                    const isGapZ = Math.abs(z - midpoint) < gapThreshold;
                    if (isGapX && isGapY && isGapZ) continue;

                    const px = (x - midpoint) * spacingVal;
                    const py = (y - midpoint) * spacingVal;
                    const pz = (z - midpoint) * spacingVal;

                    posArr.push(px, py, pz);

                    const r = 1.0, g = 1.0, b = 0.5;
                    const a = opacity;
                    
                    colArr.push(r, g, b, a);
                }
            }
        }

        return {
            positions: new Float32Array(posArr),
            colors: new Float32Array(colArr),
            finalCount: posArr.length / 3,
            spacing: spacingVal,
            max_pos: maxPosition,
        };
    }, [gapFactor, scale, particleCount, opacity]);

    return (
        <points ref={pointsRef}>
            <bufferGeometry key={`${gapFactor}-${scale}-${opacity}`}>
                <bufferAttribute
                    attach="attributes-position"
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
                transparent={true}
            />
        </points>
    );
};

const SphereParticles = ({ scale, gapFactor, opacity = 0.1, freqMultiplier = 2 }) => {
    const pointsRef = useRef();
    const particleCount = 100000;

    // Build positions once
    const { positions, finalCount, spacing, max_pos, colors } = useMemo(() => {
        const resol = Math.max(2, Math.round(Math.cbrt(particleCount)));
        const spacingVal = (2 / resol) * scale;

        const posArr = [], colArr = [];
        const midpoint = (resol - 1) / 2;
        const maxPosition = midpoint * spacingVal;
        const gapThreshold = (resol * gapFactor) / 2;

        for (let z = 0; z < resol; z++) {
            for (let y = 0; y < resol; y++) {
                for (let x = 0; x < resol; x++) {
                    const isGapX = Math.abs(x - midpoint) < gapThreshold;
                    const isGapY = Math.abs(y - midpoint) < gapThreshold;
                    const isGapZ = Math.abs(z - midpoint) < gapThreshold;
                    if (isGapX && isGapY && isGapZ) continue;

                    const px = (x - midpoint) * spacingVal;
                    const py = (y - midpoint) * spacingVal;
                    const pz = (z - midpoint) * spacingVal;

                    if (Math.hypot(px, py, pz) > scale) continue;

                    posArr.push(px, py, pz);

                    const r = 1.0, g = 1.0, b = 0.5;
                    const a = opacity;
                    
                    colArr.push(r, g, b, a);
                }
            }
        }

        return {
            positions: new Float32Array(posArr),
            colors: new Float32Array(colArr),
            finalCount: posArr.length / 3,
            spacing: spacingVal,
            max_pos: maxPosition,
        };
    }, [gapFactor, scale, particleCount, opacity]);

    return (
        <points ref={pointsRef}>
            <bufferGeometry key={`${gapFactor}-${scale}-${opacity}`}>
                <bufferAttribute
                    attach="attributes-position"
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
                transparent={true}
            />
        </points>
    );
};

// Main component (UI unchanged)
const BufferShaders4_8 = () => {
    const [gapFactor, setGapFactor] = useState(0.0);

    const calculateOpacity = (scale, isSphere) => {
        const maxScale = 64;
        const minScale = 2;
        const minOp = isSphere ? 0.05 : 0.02;
        const delta = isSphere ? 0.15 : 0.10;
        return minOp + delta * (maxScale - scale) / (maxScale - minScale);
    };

    return (
        <div style={{ height: '100vh', width: '100vw', background: '#111', position: 'relative' }}>
            <Canvas gl={{ antialias: true }} dpr={[1, 2]} camera={{ position: [0, 0, 100], fov: 75 }}>
                <color attach="background" args={['#111']} />
                
                {/* Outer sphere */}
                <SphereParticles scale={64} gapFactor={gapFactor} opacity={calculateOpacity(64, true)} />
                
                {/* Cube inside outer sphere */}
                <CubeParticles scale={32} gapFactor={gapFactor} opacity={calculateOpacity(32, false)} />
                
                {/* Inner sphere inside cube */}
                <SphereParticles scale={16} gapFactor={gapFactor} opacity={calculateOpacity(16, true)} />
                
                {/* Cube inside inner sphere */}
                <CubeParticles scale={8} gapFactor={gapFactor} opacity={calculateOpacity(8, false)} />
                
                {/* Deeper sphere inside cube */}
                <SphereParticles scale={4} gapFactor={gapFactor} opacity={calculateOpacity(4, true)} />
                
                {/* Innermost cube inside sphere */}
                <CubeParticles scale={2} gapFactor={gapFactor} opacity={calculateOpacity(2, false)} />
                
                <OrbitControls />
            </Canvas>
        </div>
    );
};

export default BufferShaders4_8;