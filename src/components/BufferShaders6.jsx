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

    // ✨ NEW: Define how many layers of petals you want.
    const numLayers = 5;

    const { positions, yMin, yRange } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        let minY = Infinity;
        let maxY = -Infinity;

        const intervals = [
            [-1.25, -1.0],
            [-0.85, -0.65],
            [-0.45, -0.25],
            [-0.10, 0.10],
            [0.25, 0.45],
            [0.65, 0.85],
            [1.0, 1.25],
        ];

        const numPetals = 35;
            // This is now the scale of the OUTERMOST petal layer.
        const flowerScale = 10.0; // Max size
        const minScale = 1.5;    // Min size (size of the centermost layer)
        // -----------------------------

        for (let i = 0; i < count; i++) {
            const layer = i % numLayers;

            // --- ✨ NEW SCALING LOGIC ---
            // 1. Calculate a normalized progress 't' from 0.0 (outer layer) to 1.0 (inner layer)
            // We use (numLayers - 1) because there are 9 "steps" between 10 layers.
            const t = layer / (numLayers - 1);

            // 2. Linearly interpolate the scale between max and min
            const scale = flowerScale - t * (flowerScale - minScale);

            // 3. We use YOUR original formula for the shape, completely unchanged.
            const angle = Math.random() * Math.PI * 2;
            const shape = (Math.sin((angle * numPetals) / 5) );
            
            // 4. Apply the new layer-specific scale to the radius.
            const radius = scale * shape;

            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius;



            pos[i * 3 + 0] = x;
            pos[i * 3 + 2] = z;

            // -------
            // This part is unchanged
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
    }, [count]); // Dependency array is unchanged


    // The rest of your component is completely unchanged...
    // ... (colors, useFrame, JSX return, etc.) ...
    const colors = useMemo(() => {
        const col = new Float32Array(count * 3);
        const hslA = { h: 220 / 360, s: 1.0, l: 0.15 }; // navy
        const hslB = { h: 60 / 360, s: 1.0, l: 0.50 }; // yellow

        for (let i = 0; i < count; i++) {
            const t = (positions[i * 3 + 1] - yMin) / yRange;
            const h = hslA.h + t * (hslB.h - hslA.h);
            const s = hslA.s; // constant
            const l = hslA.l + t * (hslB.l - hslA.l);

            const c = new THREE.Color().setHSL(h, s, l);
            col[i * 3 + 0] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }

        return col;
    }, [count, positions, yMin, yRange]);

    const colorsRef = useRef(colors)

    useFrame(({ clock }) => {
        const col = colorsRef.current;
        const offset = (clock.getElapsedTime() * 0.2) % 1;

        for (let i = 0; i < count; i++) {
            const baseT = (positions[i * 3 + 1] - yMin) / yRange;
            const t = (baseT + offset) % 1;
            const h = 220 / 360 + t * ((60 / 360) - (220 / 360));
            const l = 0.15 + t * (0.50 - 0.15);
            const c = new THREE.Color().setHSL(h, 1, l);
            col[i * 3 + 0] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }

        mesh.current.geometry.attributes.color.needsUpdate = true;
        const d = clock.getDelta();
        mesh.current.rotation.y += Math.sin(d) * 0.1;
        mesh.current.rotation.z += Math.tan(d) * 0.1;
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

// ... your BufferShaders6 component would remain the same
const BufferShaders6 = () => {
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

export default BufferShaders6;