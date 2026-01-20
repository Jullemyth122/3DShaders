import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

function randInRanges(ranges) {
    // This function is unchanged
    const idx = Math.floor(Math.random() * ranges.length);
    const [min, max] = ranges[idx];
    return min + Math.random() * (max - min);
}

function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t); // Hermite cubic
}

const BufferScene = () => {
    const mesh = useRef();
    const count = 50000;

    const { positions, yMin, yRange } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        let minY = Infinity;
        let maxY = -Infinity;

        const intervals = [
            [-2., -1.0],
            [-0.85, -0.65],
            [-0.45, -0.25],
            [-0.10, 0.10],
            [0.25, 0.45],
            [0.65, 0.85],
            [1.0, 2.],
        ];


        const numPetals = 20; // How many petals each flower shape will have
        const flowerScale = 2.5; // The overall size of the flower shape

        for (let i = 0; i < count; i++) {
            // This is the new logic for X and Z positions
            const angle = Math.random() * Math.PI * 2; // Random angle

            // const flower = 2.0 * Math.abs(Math.sin(angle * numPetals));
            // const circle = 10.0; // A circle with radius 1.0
            // const shape = Math.min(flower, circle);
            // const radius = flowerScale * shape;

            const mainShape = Math.abs(Math.atanh(Math.tan(angle * numPetals)) * 0.9);
            const shape = Math.round(mainShape * 10) / 20; // Round to the nearest 0.2
            const radius = flowerScale * shape;


            let x = Math.cos(angle) * radius;
            let z = Math.sin(angle) * radius;            
            
            // let raw = Math.tan(angle) * radius;        // may be huge near ±PI/2
            // let y = Math.atanh(raw * 0.005);
            // let y = Math.atanh(  Math.hypot(Math.tan(x * x ) ,Math.tan(z * z) ) * 0.9);
            let y = radius 
            // y *= z
            // z += y
            // x += y


            pos[i * 3 + 0] = x;
            pos[i * 3 + 2] = z;
            
            // -------
            // y =  y * randInRanges(intervals);
            y = y * (intervals[i % intervals.length][0] +  intervals[i % intervals.length][1])
            pos[i * 3 + 1] = y;

            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        return {
            positions: pos,
            yMin: minY,
            yRange: (maxY - minY) || 1,
        };
    }, [count]);



    // The rest of your component is completely unchanged
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
        // mesh.current.rotation.y += Math.sin(d) * 0.1;
        // mesh.current.rotation.z += Math.tan(d) * 0.1;
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
                    // transparent
                />
            </points>
        </>
    )
}

const BufferShaders4_1 = () => {
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

export default BufferShaders4_1;