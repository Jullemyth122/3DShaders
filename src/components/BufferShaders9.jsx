import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

function randInRanges(ranges) {
    const idx = Math.floor(Math.random() * ranges.length);
    const [min, max] = ranges[idx];
    return min + Math.random() * (max - min);
}

const BufferScene = () => {
    const mesh = useRef();
    const count = 10000;

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

        // layout params — matches your previous spread ranges
        const xRange = 2;   // previous X range was (Math.random()-0.5)*1.0 => [-0.5, 0.5]
        const zRange = 2;   // previous Z range was (Math.random()-0.5)*2.5 => [-1.25, 1.25]

        // split count across layers as evenly as possible
        const layers = intervals.length;
        const basePerLayer = Math.floor(count / layers);
        const remainder = count % layers;

        let index = 0;
        for (let li = 0; li < layers; li++) {
            // how many points in this layer
            const layerCount = li < remainder ? basePerLayer + 1 : basePerLayer;

            // grid dimensions for this layer
            const cols = Math.ceil(Math.sqrt(layerCount));
            const rows = Math.ceil(layerCount / cols);

            const spacingX = xRange / cols;
            const spacingZ = zRange / rows;
            const startX = -xRange / 2 + spacingX / 2;
            const startZ = -zRange / 2 + spacingZ / 2;

            const [yMinLayer, yMaxLayer] = intervals[li];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (index >= count) break;

                    // grid X/Z position (deterministic)
                    const x = startX + c * spacingX;
                    const z = startZ + r * spacingZ;

                    // distribute Y inside the layer interval evenly
                    const idxInLayer = r * cols + c;
                    const t = layerCount > 1 ? Math.min(idxInLayer / (layerCount - 1), 1) : 0.5;
                    const y = yMinLayer + t * (yMaxLayer - yMinLayer);

                    pos[index * 3 + 0] = x;
                    pos[index * 3 + 1] = y;
                    pos[index * 3 + 2] = z;

                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;

                    index++;
                }
            }
        }

        // safety: if some remaining slots (shouldn't happen) fill centered
        while (index < count) {
            pos[index * 3 + 0] = 0;
            pos[index * 3 + 1] = 0;
            pos[index * 3 + 2] = 0;
            if (0 < minY) minY = 0;
            if (0 > maxY) maxY = 0;
            index++;
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

    const colorsRef = useRef(colors);

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

        if (mesh.current?.geometry?.attributes?.color) {
            mesh.current.geometry.attributes.color.needsUpdate = true;
        }

        // more stable, small rotation per frame
        const d = clock.getDelta();
        if (mesh.current) {
            mesh.current.rotation.y += d * 0.2;
            mesh.current.rotation.z += d * 0.05;
        }
    });

    return(
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
                depthWrite={false}
                transparent
            />
        </points>
    )
}

const BufferShaders9 = () => {
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

export default BufferShaders9
