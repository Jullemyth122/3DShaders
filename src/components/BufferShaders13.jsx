import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

const BufferScene = ({
    width = 3,
    depth = 3,
    spacing = 0.06,
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

        // --- helpers & thickness configuration (place above the loops) ---
        const gridWidth = (cols - 1) * spacing
        const gridDepth = (rows - 1) * spacing
        const gridHeight = (height - 1) * spacing

        // endpoints for XZ diagonals (world coords)
        const XZ_A = { x: -gridWidth / 2, z: -gridDepth / 2 } // corner (-,-)
        const XZ_B = { x:  gridWidth / 2, z:  gridDepth / 2 } // corner (+,+)
        const XZ_A2 = { x: -gridWidth / 2, z:  gridDepth / 2 } // corner (-,+)
        const XZ_B2 = { x:  gridWidth / 2, z: -gridDepth / 2 } // corner (+,-)

        // endpoints for YZ diagonals (y,z) and XY diagonals (x,y)
        const YZ_A = { y: -gridHeight / 2, z: -gridDepth / 2 }
        const YZ_B = { y:  gridHeight / 2, z:  gridDepth / 2 }
        const YZ_A2 = { y: -gridHeight / 2, z:  gridDepth / 2 }
        const YZ_B2 = { y:  gridHeight / 2, z: -gridDepth / 2 }

        const XY_A = { x: -gridWidth / 2, y: -gridHeight / 2 }
        const XY_B = { x:  gridWidth / 2, y:  gridHeight / 2 }
        const XY_A2 = { x: -gridWidth / 2, y:  gridHeight / 2 }
        const XY_B2 = { x:  gridWidth / 2, y: -gridHeight / 2 }

        // 3D space diagonal endpoints (corner to opposite corner)
        const A3 = { x: -gridWidth/2, y: -gridHeight/2, z: -gridDepth/2 }
        const B3 = { x:  gridWidth/2, y:  gridHeight/2, z:  gridDepth/2 }

        // thickness (tune these)
        const centerThickness = spacing * 2.0     // thickness of center plane removal
        const diagThickness = spacing * 2.0         // thickness for 2D diagonal tubes
        const spaceDiagThickness = spacing * 2.0    // thickness for 3D space diagonal tube (increase to see clearly)

        // distance helpers
        function distPointToSegment2D(px, pz, ax, az, bx, bz) {
            const vx = bx - ax, vz = bz - az
            const wx = px - ax, wz = pz - az
            const c1 = vx * wx + vz * wz
            if (c1 <= 0) return Math.hypot(px - ax, pz - az)
            const c2 = vx * vx + vz * vz
            if (c2 <= c1) return Math.hypot(px - bx, pz - bz)
            const t = c1 / c2
            const projx = ax + t * vx
            const projz = az + t * vz
            return Math.hypot(px - projx, pz - projz)
        }

        function distPointToSegment3D(px, py, pz, ax, ay, az, bx, by, bz) {
            const vx = bx - ax, vy = by - ay, vz = bz - az
            const wx = px - ax, wy = py - ay, wz = pz - az
            const c1 = vx * wx + vy * wy + vz * wz
            if (c1 <= 0) return Math.hypot(px - ax, py - ay, pz - az)
            const c2 = vx*vx + vy*vy + vz*vz
            if (c2 <= c1) return Math.hypot(px - bx, py - by, pz - bz)
            const t = c1 / c2
            const projx = ax + t * vx
            const projy = ay + t * vy
            const projz = az + t * vz
            return Math.hypot(px - projx, py - projy, pz - projz)
        }

        // --- replace your inner triple loop body with this (uses x,y,z world coords) ---
        for (let ix = 0; ix < cols; ix++) {
            for (let iz = 0; iz < rows; iz++) {
                for (let iy = 0; iy < height; iy++) {

                    const x = (ix - (cols - 1) / 2) * spacing
                    const y = (iy - (height - 1) / 2) * spacing
                    const z = (iz - (rows - 1) / 2) * spacing

                    // 1) center planes as thick slices (replace ix===ixCenter checks)
                    if (Math.abs(x) < centerThickness) continue
                    if (Math.abs(y) < centerThickness) continue
                    if (Math.abs(z) < centerThickness) continue

                    // 2) XZ diagonals (both main and anti) — remove a tube around those lines (for all Y)
                    const dXZ_main = distPointToSegment2D(x, z, XZ_A.x, XZ_A.z, XZ_B.x, XZ_B.z)
                    if (dXZ_main < diagThickness) continue
                    const dXZ_anti = distPointToSegment2D(x, z, XZ_A2.x, XZ_A2.z, XZ_B2.x, XZ_B2.z)
                    if (dXZ_anti < diagThickness) continue

                    // 3) YZ diagonals (both) — remove tubes in YZ plane (for all X)
                    const dYZ_main = distPointToSegment2D(y, z, YZ_A.y, YZ_A.z, YZ_B.y, YZ_B.z)
                    if (dYZ_main < diagThickness) continue
                    const dYZ_anti = distPointToSegment2D(y, z, YZ_A2.y, YZ_A2.z, YZ_B2.y, YZ_B2.z)
                    if (dYZ_anti < diagThickness) continue

                    // 4) XY diagonals (both) — remove tubes in XY plane (for all Z)
                    const dXY_main = distPointToSegment2D(x, y, XY_A.x, XY_A.y, XY_B.x, XY_B.y)
                    if (dXY_main < diagThickness) continue
                    const dXY_anti = distPointToSegment2D(x, y, XY_A2.x, XY_A2.y, XY_B2.x, XY_B2.y)
                    if (dXY_anti < diagThickness) continue

                    // 5) Optional: 3D space diagonal tube (corner -> opposite corner)
                    const d3space = distPointToSegment3D(x, y, z, A3.x, A3.y, A3.z, B3.x, B3.y, B3.z)
                    if (d3space < spaceDiagThickness) continue

                    // --- KEEP point (not removed by any diagonal) ---
                    posArr.push(x, y, z)

                    // color mixing (same as your code)
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

const BufferShaders13 = () => {
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

export default BufferShaders13
