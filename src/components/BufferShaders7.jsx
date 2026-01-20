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

    // ✨ 1. We now get more data back from useMemo.
    const { positions, colors, angles, scales, yMin, yRange } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        
        // ✨ Store the unique angle and scale for each particle
        const ang = new Float32Array(count);
        const scl = new Float32Array(count);

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

        const flowerScale = 10.0;
        const minScale = 1.5;

        // Color setup
        const hslA = { h: 220 / 360, s: 1.0, l: 0.15 };
        const hslB = { h: 60 / 360, s: 1.0, l: 0.50 };

        // ✨ The initial number of petals. This will be animated later.
        const initialNumPetals = 35; // This gives us 7 effective petals initially

        for (let i = 0; i < count; i++) {
            const layer = i % numLayers;
            const t = layer / (numLayers - 1);
            const scale = flowerScale - t * (flowerScale - minScale);
            
            const angle = Math.random() * Math.PI * 2;
            
            // ✨ Store the angle and scale so we can use them in the animation frame
            ang[i] = angle;
            scl[i] = scale;

            const shape = Math.sin((angle * initialNumPetals) / 5);
            const radius = scale * shape;

            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius;
            pos[i * 3 + 0] = x;
            pos[i * 3 + 2] = z;

            const y = randInRanges(intervals);
            pos[i * 3 + 1] = y;

            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            // Also calculate initial colors here
            const colorT = (y - (minY === Infinity ? 0 : minY)) / ((maxY - (minY === Infinity ? 0 : minY)) || 1);
            const h = hslA.h + colorT * (hslB.h - hslA.h);
            const l = hslA.l + colorT * (hslB.l - hslA.l);
            const c = new THREE.Color().setHSL(h, hslA.s, l);
            col[i * 3 + 0] = c.r;
            col[i * 3 + 1] = c.g;
            col[i * 3 + 2] = c.b;
        }

        return {
            positions: pos,
            colors: col,
            angles: ang,
            scales: scl,
            yMin: minY,
            yRange: (maxY - minY) || 1,
        };
    }, [count, numLayers]);

    // ✨ 2. Use refs to hold the buffers so they can be modified in useFrame
    const positionsRef = useRef(positions);
    const colorsRef = useRef(colors);

    const petalPositionRef = useRef(35); // The spring's current position
    const petalVelocityRef = useRef(0);  // The spring's current velocity

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();

        // --- 1. Define the TARGET position for the spring ---
        const cycleDuration = 7; // A slightly longer cycle feels good with springs
        const minEffectivePetals = 1;
        const maxEffectivePetals = 7;
        const wave = (Math.sin(elapsedTime * (Math.PI * 2) / cycleDuration) + 1) / 2;
        const targetPetals = (minEffectivePetals + wave * (maxEffectivePetals - minEffectivePetals)) * 5;

        // --- ✨ 2. Simulate the Spring Physics ---
        // These are your tuning knobs
        const stiffness = 0.02; // How "strong" or "tight" the spring is
        const friction = 0.85;  // How quickly it loses energy. 1.0 = no friction, < 1.0 = friction.

        let position = petalPositionRef.current;
        let velocity = petalVelocityRef.current;

        // Calculate the force pulling the spring towards the target
        const force = (targetPetals - position) * stiffness;

        // Apply the force to the velocity
        velocity += force;

        // Apply friction to slow the velocity over time
        velocity *= friction;

        // Apply the velocity to the position
        position += velocity;

        // Store the new values for the next frame
        petalPositionRef.current = position;
        petalVelocityRef.current = velocity;

        // --- 3. Use the spring's position for the animation ---
        const animatedNumPetals = position;

        // The rest of the useFrame hook remains the same...
        const currentPositions = positionsRef.current;
        for (let i = 0; i < count; i++) {
            const angle = angles[i];
            const scale = scales[i];
            const newShape = Math.sin((angle * animatedNumPetals) / 5);
            const newRadius = scale * newShape;
            currentPositions[i * 3 + 0] = Math.cos(angle) * newRadius;
            currentPositions[i * 3 + 2] = Math.sin(angle) * newRadius;
        }
        mesh.current.geometry.attributes.position.needsUpdate = true;

        // --- Your existing color animation logic ---
        const currentCol = colorsRef.current;
        const offset = (elapsedTime * 0.2) % 1;

        for (let i = 0; i < count; i++) {
            const y = currentPositions[i * 3 + 1]; // Use current Y for color calc
            const baseT = (y - yMin) / yRange;
            const t = (baseT + offset) % 1;
            const h = 220 / 360 + t * ((60 / 360) - (220 / 360));
            const l = 0.15 + t * (0.50 - 0.15);
            const c = new THREE.Color().setHSL(h, 1, l);
            currentCol[i * 3 + 0] = c.r;
            currentCol[i * 3 + 1] = c.g;
            currentCol[i * 3 + 2] = c.b;
        }
        mesh.current.geometry.attributes.color.needsUpdate = true;
        
        // --- Your existing rotation logic ---
        const d = clock.getDelta();
        mesh.current.rotation.y += Math.sin(d) * 0.1;
        mesh.current.rotation.z += Math.tan(d) * 0.1;
    });

    return (
        <>
            <points ref={mesh}>
                <bufferGeometry>
                    {/* ✨ 5. Use the refs for the buffer arrays */}
                    <bufferAttribute
                        attach={"attributes-position"}
                        count={count}
                        array={positionsRef.current}
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

const BufferShaders7 = () => {
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

export default BufferShaders7;