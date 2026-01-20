import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

const BufferScene = ({
    width = 3,
    depth = 3,
    spacing = 0.05,
    jitterY = 0.02,
    heightSize = 3,
    pointSize = 0.06,
    topColor = '#ffe08a',
    bottomColor = '#0345fc',
}) => {
    const mesh = useRef()

    // Build positions & per-vertex colors once (useMemo)
    const { positions, colors, count } = useMemo(() => {
        const cols = Math.max(1, Math.floor(width / spacing) + 1)
        const rows = Math.max(1, Math.floor(depth / spacing) + 1)
        // <-- use heightSize (you previously used jitterY here by mistake)
        const height = Math.max(1, Math.floor(heightSize / spacing) + 1)

        // push-only arrays (easier than prealloc + skipping)
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


        console.log(minZ, maxZ)
        console.log(minX, maxX)
        console.log(minY, maxY)
        // ---------- PARABOLA CARVE (drop-in replacement for your inner loops) ----------
        // tune these:
        const curvatureFactor = 0.95       // 0..1 how high the parabola reaches relative to maxZ
        const thickness = Math.max(spacing * 0.6, 0.1) // width of carved band (world units)
        // which side of Z to carve: 'positive' -> parabola opens to +Z and starts at origin
        const zSide = 'both' // 'positive' | 'negative' | 'both'

        // compute x limit (furthest x from center in world units)
        const xLimit = Math.max(Math.abs(minX), Math.abs(maxX)) || 1
        // curvature a so z_par(x) = a * x^2 reaches near maxZ at xLimit
        const a = (maxZ * curvatureFactor) / (xLimit * xLimit || 1)

        // loop: keep everything except points inside the parabola band (carve)
        for (let ix = 0; ix < cols; ix++) {
            for (let iz = 0; iz < rows; iz++) {
                for (let iy = 0; iy < height; iy++) {
                const x = (ix - (cols - 1) / 2) * spacing
                const y = (iy - (height - 1) / 2) * spacing
                const z = (iz - (rows - 1) / 2) * spacing

                // optional: restrict to half-cube (only positive Z side)
                if (zSide === 'positive' && z < 0) {
                    // Keep point (outside parabola) — do not carve here
                } else if (zSide === 'negative' && z > 0) {
                    // Keep point
                } 
                else {
                    // compute parabola z value at this x (vertex at origin)
                    const z_par = a * 0.5 * x * x

                    // If using both sides, consider ±z_par as targets:
                    let insideBand = false
                    if (zSide === 'both') {
                        // check distance to either +z_par or -z_par
                        if (Math.abs(z - z_par) <= thickness || Math.abs(z + z_par) <= thickness) {
                            insideBand = true
                        }
                    } else {
                        // only one side: compare z to z_par
                        // for 'positive' we expect z_par >= 0; for 'negative' we expect -z_par <= 0
                        if (Math.abs(z - z_par) <= thickness) {
                            // ensure we are on the correct half
                            if ((zSide === 'positive' && z >= 0) || (zSide === 'negative' && z <= 0)) {
                                insideBand = true
                            }
                        }
                    }

                    // If this point is inside the parabola band, SKIP it (carve it out)
                    if (insideBand) continue
                }

                // --- KEEP point (outside carved parabola) ---
                posArr.push(x, y, z)

                // **DO NOT TOUCH** your color logic — exactly as you had it:
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
            count: posArr.length / 3
        }
    }, [width, depth, spacing, jitterY, heightSize, topColor, bottomColor])

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

const BufferShaders18 = () => {
    return (
        <div className='buffer-shader'>
            <Canvas
                gl={{ antialias: true }}
                dpr={[1, 2]}
                camera={{ position: [0, 0, 2], fov: 50 }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.6} />
                <BufferScene spacing={0.05} width={3} depth={3} heightSize={3} pointSize={0.06} />
                <OrbitControls />
            </Canvas>
        </div>
    )
}

export default BufferShaders18
