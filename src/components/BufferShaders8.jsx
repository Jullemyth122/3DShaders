import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

// This function is unchanged
function randInRanges(ranges) {
    const idx = Math.floor(Math.random() * ranges.length);
    const [min, max] = ranges[idx];
    return min + Math.random() * (max - min);
}

const BufferScene = () => {
    const mesh = useRef();
    const count = 50000;
    const numLayers = 5;

    const { positions, yMin, yRange } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        let minY = Infinity;
        let maxY = -Infinity;

        const intervals = [
            [-1.25, -1.0], [-0.85, -0.65], [-0.45, -0.25],
            [-0.10, 0.10], [0.25, 0.45], [0.65, 0.85], [1.0, 1.25],
        ];

        const flowerScale = 10.0;
        const minScale = 1.5;

        // ✨ 1. Define the number of petals for each quadrant group.
        // To get 1 petal in a 90-degree (PI/2) quadrant, the frequency needs to be 2.
        const petalsInQuadrant13 = 100; 
        // To get 4 petals in a 90-degree quadrant, the frequency needs to be 8.
        const petalsInQuadrant24 = 16; 

        for (let i = 0; i < count; i++) {
            const layer = i % numLayers;
            const t = layer / (numLayers - 1);
            const scale = flowerScale - t * (flowerScale - minScale);
            
            let angle;
            let shape;

            // ✨ 2. Split particles into two groups.
            // Even particles go to Quadrants I & III. Odd particles go to II & IV.
               if (i % 2 === 0) {
                // --- Group A: Quadrants I & III (1 petal each) ---
                const quadrantAngle = Math.random() * (Math.PI / 2); // Angle within the 90-degree quadrant
                
                // Randomly choose between Quadrant I (0) and III (PI)
                const quadrantOffset = Math.random() < 0.5 ? 0 : Math.PI;
                angle = quadrantAngle + quadrantOffset;
                
                // The shape formula for this group
                shape = Math.sin(quadrantAngle * petalsInQuadrant13);

            } else {
                // --- Group B: Quadrants II & IV (4 petals each) ---
                const quadrantAngle = Math.random() * (Math.PI / 2);

                // Randomly choose between Quadrant II (PI/2) and IV (3*PI/2)
                const quadrantOffset = Math.random() < 0.5 ? Math.PI / 2 : 3 * Math.PI / 2;
                angle = quadrantAngle + quadrantOffset;

                // The shape formula for this group
                shape = Math.sin(quadrantAngle * petalsInQuadrant24);
            }
            
            // ✨ 3. The rest of the logic is the same for all particles
            const radius = scale * shape;
            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius;

            pos[i * 3 + 0] = x;
            pos[i * 3 + 2] = z;

            const y = randInRanges(intervals);
            pos[i * 3 + 1] = y;

            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        return {
            positions: pos,
            yMin: minY,
            yRange: (maxY - minY) || 1,
        };
    }, [count, numLayers]);

    // This useMemo for colors remains unchanged
    const colors = useMemo(() => {
        const col = new Float32Array(count * 3);
        const hslA = { h: 220 / 360, s: 1.0, l: 0.15 };
        const hslB = { h: 60 / 360, s: 1.0, l: 0.50 };
        for (let i = 0; i < count; i++) {
            const t = (positions[i * 3 + 1] - yMin) / yRange;
            const h = hslA.h + t * (hslB.h - hslA.h);
            const l = hslA.l + t * (hslB.l - hslA.l);
            const c = new THREE.Color().setHSL(h, hslA.s, l);
            col[i * 3 + 0] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }
        return col;
    }, [count, positions, yMin, yRange]);

    const colorsRef = useRef(colors);

    // ✨ The useFrame is simplified back to just color and rotation
    useFrame(({ clock }) => {
        // Color shifting animation
        const col = colorsRef.current;
        const offset = (clock.getElapsedTime() * 0.2) % 1;
        for (let i = 0; i < count; i++) {
            const baseT = (positions[i * 3 + 1] - yMin) / yRange;
            const t = (baseT + offset) % 1;
            const h = 220/360 + t * ((60/360) - (220/360));
            const l = 0.15 + t * (0.50 - 0.15);
            const c = new THREE.Color().setHSL(h, 1, l);
            col[i * 3 + 0] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }
        mesh.current.geometry.attributes.color.needsUpdate = true;
        
        // Simple rotation animation
        const d = clock.getDelta();
        mesh.current.rotation.y += d * 0.1;
    });

    return (
        <>
            <points ref={mesh}>
                <bufferGeometry>
                    <bufferAttribute
                        attach={"attributes-position"}
                        count={count}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={count}
                        array={colorsRef.current}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    vertexColors
                    size={0.025}
                    sizeAttenuation
                    depthWrite={true}
                />
            </points>
        </>
    )
}

const BufferShaders8 = () => {
    return (
        <div className='buffer-shader'>
            <Canvas
                gl={{ antialias: true }}
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 2, 0] }}
            >
                <BufferScene amount={2} />
                <OrbitControls />
            </Canvas>
        </div>
    )
}

export default BufferShaders8;