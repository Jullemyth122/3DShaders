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

    // design knobs (tweak these)
    const numPetals = 20;       // how many petals in the flower shape (keeps original)
    const flowerScale = 2.5;    // overall scale (keeps original)
    const spiralTurns = 3;      // how many turns the spiral introduces across radius
    const layers = 4;           // layered density (visual depth)
    const jitter = 0.18;        // per-point random jitter amplitude
    const curlStrength = 0.35;  // small angular curl to create rift/vortex flows

    // for a consistent progressive layout we will use index-based layering
    for (let i = 0; i < count; i++) {
        // stratified radial factor [0..1] so points form rings/layers rather than purely uniform noise
        const u = (i + 0.5) / count;                  // evenly spread factor (better distribution)
        const layer = Math.floor(u * layers);         // integer layer
        const layerFactor = (layer + Math.random()) / layers; // small randomness per layer

        // base angle with a spiral offset so points sweep outward nicely
        const baseAngle = Math.random() * Math.PI * 2;
        const spiral = layerFactor * spiralTurns * Math.PI * 2;
        const angle = baseAngle + spiral;

        // safer version of your atanh(tan(...)) used originally (avoid NaNs)
        const raw = Math.tan(angle * numPetals);
        // if raw is within the atanh domain use atanh, else use atan fallback to keep shape
        const safeVal = (Math.abs(raw) < 0.999) ? Math.atanh(raw) : Math.atan(raw);
        const mainShape = Math.abs(safeVal * 0.9);

        // quantize/round like you did (keeps the original visual granularity)
        const shape = Math.round(mainShape * 10) / 20;
        let radius = flowerScale * shape;

        // introduce a smooth gradual radial bias (closer to center for smaller u)
        // use sqrt to bias densities toward center but keep outer points
        const radialBias = Math.sqrt(u) * 0.9 + 0.1;
        radius *= radialBias;

        // small density jitter so spheres/ petals don't look uniform
        radius += (Math.random() - 0.5) * jitter * layerFactor;

        // add a curl / vortex effect to angle for more professional flow feel
        const curl = curlStrength * Math.sin(angle * 2.0 + i * 0.0009);
        const finalAngle = angle + curl;

        // compute positions
        const x = Math.cos(finalAngle) * radius;
        const z = Math.sin(finalAngle) * radius;

        // create a Y that has vertical layering but preserve your final mapping step
        // use a combination of radius and layerFactor to create vertical shape variety
        let y = radius * (0.4 + 1.0 * layerFactor);

        // small per-point vertical noise to avoid flat bands
        y += (Math.random() - 0.5) * 0.12 * (1 - layerFactor);

        // final assignment into buffer (X,Z as computed)
        pos[i * 3 + 0] = x;
        pos[i * 3 + 2] = z;

        // ------- preserve your interval mapping for Y exactly as requested -------
        // NOTE: this keeps downstream color/animation behavior unchanged.
        y = y * (intervals[i % intervals.length][0] + intervals[i % intervals.length][1]);
        pos[i * 3 + 1] = y;

        // track min/max Y (unchanged)
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

const BufferShaders4_2 = () => {
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

export default BufferShaders4_2;