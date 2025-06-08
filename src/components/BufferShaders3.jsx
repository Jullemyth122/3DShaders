import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

function randInRanges(ranges) {
    // 1) Pick one of the ranges at random (equal weight)
    const idx = Math.floor(Math.random() * ranges.length);
    const [min, max] = ranges[idx];
    // 2) Uniformly sample inside [min, max]
    return min + Math.random() * (max - min);
}

const BufferScene = () => {
    const mesh = useRef();
    // const count = 100;
    const count = 15000;

    const { positions, yMin, yRange } = useMemo(() => {
        const pos = new Float32Array(count * 3);
        let minY = Infinity;
        let maxY = -Infinity;

        const intervals = [
            [ -1.25, -1.0 ],
            [ -0.85,  -0.65 ],
            [ -0.45,  -0.25 ],
            [ -0.10,   0.10 ],
            [  0.25,   0.45 ],
            [  0.65,   0.85 ],
            [  1.0,    1.25 ],
        ];

        for (let i = 0; i < count; i++) {
            // X and Z: full spread
            pos[i * 3 + 0] = (Math.random() - 0.5) * 2.5;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;

            // Y: one of the custom intervals
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
    }, [count]);


    const colors = useMemo(() => {
        const col = new Float32Array(count * 3);

        // HSL endpoints
        const hslA = { h: 220 / 360, s: 1.0, l: 0.15 }; // navy
        const hslB = { h:  60 / 360, s: 1.0, l: 0.50 }; // yellow

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
            const baseT = (positions[i*3+1] - yMin) / yRange;
            const t = (baseT + offset) % 1;
            const h = 220/360 + t * ((60/360) - (220/360));
            const l = 0.15   + t * (0.50   - 0.15);
            const c = new THREE.Color().setHSL(h, 1, l);
            col[i*3+0] = c.r;
            col[i*3+1] = c.g;
            col[i*3+2] = c.b;
        }

        mesh.current.geometry.attributes.color.needsUpdate = true;

        // keep your mesh rotating
        const d = clock.getDelta();
        mesh.current.rotation.y += Math.sin(d) * 0.1;
        mesh.current.rotation.z += Math.tan(d) * 0.1;
    });

    return(
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
                        // array={colors}
                        array={colorsRef.current}
                        itemSize={3}
                    />
                </bufferGeometry>
                <pointsMaterial
                    vertexColors
                    size={0.025}
                    sizeAttenuation
                    depthWrite={false}
                    transparent
                />
            </points>
        </>
    )
}

const BufferShaders3 = () => {
    return (
        <div className='buffer-shader'>
            <Canvas
                gl={{ antialias: true }}
                shadows
                dpr={[1,2]}
                camera={{ position: [0,2, 0] }}
            >
                <BufferScene amount={2}/>
                <OrbitControls/>
            </Canvas>
        </div>
    )
}

export default BufferShaders3