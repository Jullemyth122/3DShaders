import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

const BufferScene = ({
    width = 3,
    depth = 3,
    spacing = 0.04,
    jitterY = 0.01,
    heightSize = 3,
    pointSize = 0.06,
    topColor = '#ffe08a',
    bottomColor = '#0345fc',

    // double-triangle params
    pattern = 'double-triangle',   // 'double-triangle' enables the glyph
    triangleSizeFactor = 0.6,      // base triangle size relative to cube X
    triangleRotation = 0,          // rotate first triangle (radians)
    triangOffsetZ = 0.0,           // small offset along Z for visual tweak
    extrudeFrac = 1.0,             // how tall (along Y) the prism is (fraction of cube height)
    showPrismWire = true
}) => {
    const mesh = useRef()

    // point-in-triangle in XZ plane (barycentric)
    const pointInTriXZ = (px, pz, a, b, c) => {
        const v0x = b.x - a.x, v0z = b.z - a.z
        const v1x = c.x - a.x, v1z = c.z - a.z
        const v2x = px - a.x, v2z = pz - a.z

        const denom = v0x * v1z - v0z * v1x
        if (Math.abs(denom) < 1e-8) return false
        const u = (v2x * v1z - v2z * v1x) / denom
        const v = (v0x * v2z - v0z * v2x) / denom
        return u >= 0 && v >= 0 && (u + v) <= 1
    }

    const { positions, colors, count, boxSize, prismEdges } = useMemo(() => {
        const cols = Math.max(1, Math.floor(width / spacing) + 1)
        const rows = Math.max(1, Math.floor(depth / spacing) + 1)
        const height = Math.max(1, Math.floor(heightSize / spacing) + 1)

        const posArr = []
        const colArr = []

        const colorTop = new THREE.Color(topColor)
        const colorBottom = new THREE.Color(bottomColor)

        const minX = -((cols - 1) / 2) * spacing
        const maxX = -minX
        const minZ = -((rows - 1) / 2) * spacing
        const maxZ = -minZ
        const minY = -((height - 1) / 2) * spacing
        const maxY = -minY

        const fullX = maxX - minX
        const fullY = maxY - minY
        const fullZ = maxZ - minZ

        // triangle geometry (equilateral) in XZ plane, centered at X=0,Z=0
        const triangleSize = Math.max(0.001, fullX * triangleSizeFactor)
        const h = Math.sqrt(3) / 2 * triangleSize
        const triLocal = [
        new THREE.Vector3(-triangleSize / 2, 0, -h / 3),
        new THREE.Vector3(triangleSize / 2, 0, -h / 3),
        new THREE.Vector3(0, 0, (2 * h) / 3)
        ]

        // helper to rotate triangle around Y and optionally shift in Z
        const makeTri = (rotation, shiftZ = 0) => {
        const sinR = Math.sin(rotation), cosR = Math.cos(rotation)
        return triLocal.map(v => {
            const rx = v.x * cosR - v.z * sinR
            const rz = v.x * sinR + v.z * cosR + shiftZ
            return new THREE.Vector3(rx, 0, rz)
        })
        }

        // First triangle (rot = triangleRotation). Second triangle rotated by PI (opposite)
        const triA = makeTri(triangleRotation, triangOffsetZ)
        const triB = makeTri(triangleRotation + Math.PI, -triangOffsetZ) // opposite, maybe mirrored offset

        // extrusion in Y
        const extrudeHalf = (fullY * extrudeFrac) / 2
        const extrudeMinY = -extrudeHalf
        const extrudeMaxY = extrudeHalf

        // Build wireframe edges for both prisms (if requested)
        const buildEdgesForTri = (triVerts) => {
        const topVerts = triVerts.map(v => new THREE.Vector3(v.x, extrudeMinY, v.z))
        const botVerts = triVerts.map(v => new THREE.Vector3(v.x, extrudeMaxY, v.z))
        const all = [...topVerts, ...botVerts]
        const idxPairs = [
            [0,1],[1,2],[2,0],    // top cap
            [3,4],[4,5],[5,3],    // bottom cap
            [0,3],[1,4],[2,5]     // vertical edges
        ]
        const segs = []
        for (let [a,b] of idxPairs) {
            segs.push(all[a].x, all[a].y, all[a].z)
            segs.push(all[b].x, all[b].y, all[b].z)
        }
        return segs
        }

        const edgesSegments = showPrismWire ? new Float32Array([
        ...buildEdgesForTri(triA),
        ...buildEdgesForTri(triB)
        ]) : null

        // iterate grid and carve points inside either triangular prism
        for (let ix = 0; ix < cols; ix++) {
        for (let iz = 0; iz < rows; iz++) {
            for (let iy = 0; iy < height; iy++) {
            const x = (ix - (cols - 1) / 2) * spacing
            const y = (iy - (height - 1) / 2) * spacing + (Math.random() - 0.5) * jitterY * spacing
            const z = (iz - (rows - 1) / 2) * spacing

            let inside = false
            if (pattern === 'double-triangle') {
                // if within Y extrusion band and (x,z) in either triangle -> carve
                if (y >= extrudeMinY && y <= extrudeMaxY) {
                if (pointInTriXZ(x, z, triA[0], triA[1], triA[2]) || pointInTriXZ(x, z, triB[0], triB[1], triB[2])) {
                    inside = true
                }
                }
            }

            if (inside) continue

            // keep point
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
        boxSize: [fullX || 0.001, fullY || 0.001, fullZ || 0.001],
        prismEdges: edgesSegments
        }
    }, [
        width, depth, spacing, jitterY, heightSize, topColor, bottomColor,
        pattern, triangleSizeFactor, triangleRotation, triangOffsetZ, extrudeFrac, showPrismWire
    ])


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

const BufferShaders11 = () => {
    return (
        <div className='buffer-shader'>
            <Canvas
                gl={{ antialias: true }}
                dpr={[1, 2]}
                camera={{ position: [0, 1.2, 2.5], fov: 50 }}
            >
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={0.6} />
                <BufferScene spacing={0.06} width={3} depth={3} heightSize={3} pointSize={0.06} />
                <OrbitControls />
            </Canvas>
        </div>
    )
}

export default BufferShaders11
