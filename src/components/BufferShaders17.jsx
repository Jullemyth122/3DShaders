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

        const ixCenter = Math.floor(cols / 2)
        const iyCenter = Math.floor(height / 2)
        const izCenter = Math.floor(rows / 2)


        // ----- architectural beam params (tweak these) -----
        const beamCountPerAxis = 3   // 2 => edges only, 3 => edges + center, 4+ => more interior beams
        const beamThickness = 1      // thickness measured in index units (1 = one grid column)
        const includeDiagonals = false // set true to add diagonal braces (criss-cross)
        /* -------------------------------------------------- */

        // helper: produce N centers across 0..(max-1) inclusive (includes edges)
        const makeCenters = (count, max) => {
        if (count <= 1) return [ Math.floor((max - 1) / 2) ]
        const out = []
        for (let i = 0; i < count; i++) {
            out.push(Math.round(i * (max - 1) / (count - 1)))
        }
        return out
        }

        // build 1D center lists per axis (in index-space)
        const xCenters = makeCenters(beamCountPerAxis, cols)
        const yCenters = makeCenters(beamCountPerAxis, height)
        const zCenters = makeCenters(beamCountPerAxis, rows)

        // build beam descriptors:
        // X-beams: for each zCenter × yCenter -> beam runs along X (all ix) but limited around z,y
        const xBeams = []
        for (const zc of zCenters) for (const yc of yCenters) xBeams.push({z: zc, y: yc})

        // Z-beams: for each xCenter × yCenter -> beam runs along Z (all iz)
        const zBeams = []
        for (const xc of xCenters) for (const yc of yCenters) zBeams.push({x: xc, y: yc})

        // Y-beams: for each xCenter × zCenter -> beam runs vertically along Y (all iy)
        const yBeams = []
        for (const xc of xCenters) for (const zc of zCenters) yBeams.push({x: xc, z: zc})

        // optional diagonal braces: pairs of start/end indexes along XZ plane (simple cross)
        const diagPairs = []
        if (includeDiagonals) {
        // main diagonal and opposite
        diagPairs.push({ax: 0, az: 0, bx: cols-1, bz: rows-1})
        diagPairs.push({ax: 0, az: rows-1, bx: cols-1, bz: 0})
        }

        // iterate grid and keep only points that belong to at least one beam
        for (let ix = 0; ix < cols; ix++) {
        for (let iz = 0; iz < rows; iz++) {
            for (let iy = 0; iy < height; iy++) {

            // check X-beams (beam spans all ix; test iz,iy proximity)
            let inBeam = false

            for (const b of xBeams) {
                if (Math.abs(iz - b.z) <= beamThickness && Math.abs(iy - b.y) <= beamThickness) { inBeam = true; break }
            }
            if (inBeam) {
                // keep the point
            } else {
                // check Z-beams (span all iz; test ix,iy)
                for (const b of zBeams) {
                if (Math.abs(ix - b.x) <= beamThickness && Math.abs(iy - b.y) <= beamThickness) { inBeam = true; break }
                }
            }
            if (inBeam) {
                // keep
            } else {
                // check Y-beams (vertical posts)
                for (const b of yBeams) {
                if (Math.abs(ix - b.x) <= beamThickness && Math.abs(iz - b.z) <= beamThickness) { inBeam = true; break }
                }
            }

            // optional diagonal braces (approximate thickness by distance to segment)
            if (!inBeam && includeDiagonals) {
                for (const seg of diagPairs) {
                // compute distance from (ix,iz) to segment (ax,az)-(bx,bz)
                const px = ix, pz = iz
                const ax = seg.ax, az = seg.az, bx = seg.bx, bz = seg.bz
                const vx = bx - ax, vz = bz - az
                const wx = px - ax, wz = pz - az
                const denom = vx*vx + vz*vz
                let t = denom > 0 ? (wx*vx + wz*vz) / denom : 0
                t = Math.max(0, Math.min(1, t))
                const projx = ax + t * vx, projz = az + t * vz
                const dist = Math.hypot(projx - px, projz - pz)
                if (dist <= beamThickness + 0.5) { inBeam = true; break }
                }
            }

            if (!inBeam) continue // skip non-beam points

            // compute world coords and push
            const x = (ix - (cols - 1) / 2) * spacing
            const y = (iy - (height - 1) / 2) * spacing
            const z = (iz - (rows - 1) / 2) * spacing

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

const BufferShaders17 = () => {
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

export default BufferShaders17
