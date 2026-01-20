import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

const hash01 = (n) => Math.abs(Math.sin(n * 127.1) * 43758.5453123) % 1;

const BufferScene = ({
    width = 3,
    depth = 3,
    spacing = 0.05,
    jitterY = 0.02,
    heightSize = 3,
    pointSize = 0.06,
    topColor = '#ffe08a',
    bottomColor = '#0345fc',

    // pattern selection + small params
    pattern = '2d-ripple', // 'sine'|'tri'|'bands'|'mirror'|'bitmask'|'2d-ripple'
    freq = 3,         // for sine / tri
    threshold = 0.45, // carve threshold for sine/ripple
    period = 6,       // for tri/saw
    bandSeed = 7,     // seed for bands
    bitmask = 0b1010, // for bitmask
    mirrorCombine = true, // mirror the chosen 1D pattern

}) => {
    const mesh = useRef()



    // Build positions & per-vertex colors once (useMemo)
    const { positions, colors, count, boxSize } = useMemo(() => {
        const cols = Math.max(1, Math.floor(width / spacing) + 1)
        const rows = Math.max(1, Math.floor(depth / spacing) + 1)
        const height = Math.max(1, Math.floor(heightSize / spacing) + 1)

        const posArr = []
        const colArr = []

        const colorTop = new THREE.Color(topColor)
        const colorBottom = new THREE.Color(bottomColor)

        const minZ = -((rows - 1) / 2) * spacing
        const maxZ = -minZ
        const minX = -((cols - 1) / 2) * spacing
        const maxX = -minX
        const minY = -((height - 1) / 2) * spacing
        const maxY = -minY

        // helper: decide on a boolean carve for column ix
        const isCarvedByPattern = (ix) => {
        const nx = cols > 1 ? ix / (cols - 1) : 0.5

        if (pattern === 'sine') {
            const v = Math.abs(Math.sin(nx * Math.PI * 2 * freq))
            return v > threshold
        }

        if (pattern === 'tri') {
            const phase = (ix % period) / period // 0..1
            const tri = 1 - Math.abs(phase * 2 - 1) // triangular 0..1..0
            return tri > threshold
        }

        if (pattern === 'bands') {
            const r = hash01(ix + bandSeed)
            return r > (threshold * 0.8 + 0.05)
        }

        if (pattern === 'bitmask') {
            const wrapped = ix % 32
            return ((wrapped & bitmask) !== 0)
        }

        if (pattern === 'mirror') {
            const v = Math.abs(Math.sin(nx * Math.PI * 2 * freq))
            const b = ((ix % period) & 1) === 1
            return (v > threshold) || b
        }

        // default: do not carve by column (use per-point 2d pattern potentially)
        return false
        }

        // iterate columns
        for (let ix = 0; ix < cols; ix++) {
        // column-level carve decision
        let carveCol = isCarvedByPattern(ix)

        // optionally combine with mirrored column for symmetry
        if (mirrorCombine) {
            const mirrorIndex = Math.round((cols - 1) - ix)
            if (mirrorIndex >= 0 && mirrorIndex < cols) {
            carveCol = carveCol || isCarvedByPattern(mirrorIndex)
            }
        }

        for (let iz = 0; iz < rows; iz++) {
            for (let iy = 0; iy < height; iy++) {
            const x = (ix - (cols - 1) / 2) * spacing
            const y = (iy - (height - 1) / 2) * spacing + (Math.random() - 0.5) * jitterY * spacing
            const z = (iz - (rows - 1) / 2) * spacing

            // decide per-point skip for the 2d ripple pattern
            let skip = false
            if (pattern === '2d-ripple') {
                const dx = x
                const dz = z
                const dist = Math.hypot(dx, dz)
                const ripple = Math.abs(Math.sin(dist * freq)) // freq controls rings tightness
                skip = ripple > threshold
            } else {
                // 1D decision: skip whole carved columns
                skip = carveCol
            }

            if (skip) continue

            posArr.push(x, y, z)

            const zcl = THREE.MathUtils.clamp((z - minZ) / (maxZ - minZ || 1), 0, 1)
            const xcl = THREE.MathUtils.clamp((x - minX) / (maxX - minX || 1), 0, 1)
            const mixT = (xcl * zcl)
            const c = colorBottom.clone().lerp(colorTop, mixT)
            colArr.push(c.r, c.g, c.b)
            }
        }
        }

        return {
        positions: new Float32Array(posArr),
        colors: new Float32Array(colArr),
        count: posArr.length / 3,
        boxSize: [ (maxX-minX) || 0.001, (maxY-minY) || 0.001, (maxZ-minZ) || 0.001 ]
        }

    },
    [width, depth, spacing, jitterY, heightSize, topColor, bottomColor,
      pattern, freq, threshold, period, bandSeed, bitmask, mirrorCombine])
    
    return (
        <>
            <points ref={mesh} frustumCulled={false}>
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
                        array={colors}
                        itemSize={3}
                    />
                </bufferGeometry>

                <pointsMaterial
                    vertexColors={true}
                    size={pointSize}
                    sizeAttenuation={true}
                    depthWrite={true}         // ok to write depth for correct occlusion
                    transparent={false}
                    blending={THREE.NormalBlending}
                />
            </points>
        </>
    )
}

const BufferShaders15 = () => {
    return (
        <div className='buffer-shader'>
            <Canvas
                gl={{ antialias: true }}
                dpr={[1, 2]}
                camera={{ position: [0, 0, 2], fov: 50 }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.6} />
                <BufferScene spacing={0.06} width={3} depth={3} heightSize={3} pointSize={0.06} />
                <OrbitControls />
            </Canvas>
        </div>
    )
}

export default BufferShaders15
