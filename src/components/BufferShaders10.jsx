import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';


const BufferScene = ({
    width = 5,
    depth = 5,
    spacing = 0.05,
    jitterY = 5.0,
    heightSize = 5,
    pointSize = 0.04,
    topColor = '#000000',
    bottomColor = '#0345fc',
    pattern = 'cubeGrid', // 'spheres' | 'helix' | 'cubeGrid'
    showBoxHelpers = true
}) => {
    const mesh = useRef()

    // Build positions & per-vertex colors once (useMemo)
    // const { positions, colors, count } = useMemo(() => {
    //     const cols = Math.max(1, Math.floor(width / spacing) + 1)
    //     const rows = Math.max(1, Math.floor(depth / spacing) + 1)
    //     const height = Math.max(1, Math.floor(jitterY / spacing) + 1)

    //     console.log(cols, rows)
    //     const num = cols * rows * height


    //     const positions = new Float32Array(num * 3)
    //     const colors = new Float32Array(num * 3)


    //     const colorTop = new THREE.Color(topColor)
    //     const colorBottom = new THREE.Color(bottomColor)

    //     // compute z range for gradient normalization
    //     const minZ = -((rows - 1) / 2) * spacing
    //     const maxZ = -minZ
    //     // compute x range for gradient normalization
    //     const minX = -((cols - 1) / 2) * spacing
    //     const maxX = -minX

    //     let idx = 0

    //     let globalIdx = 0

    //     for (let ix = 0; ix < cols; ix++) {
    //         for (let iz = 0; iz < rows; iz++) {
    //             for (let iy = 0; iy < height; iy++) {

    //                 const keep = (globalIdx % 2) === 1
    //                 globalIdx++
    //                 if (!keep) continue

    //                 // center the grid
    //                 const x = (ix - (cols - 1) / 2) * spacing
    //                 const y = (iy - (height - 1) / 2) * spacing
    //                 const z = (iz - (rows - 1) / 2) * spacing
                    
    //                 // tiny random Y jitter so points don't lie perfectly flat
    //                 // const y = (Math.random() - 0.5) * jitterY
    //                 // const y = 0
    
    
    //                 positions[idx * 3 + 0] = x
    //                 positions[idx * 3 + 1] = y
    //                 positions[idx * 3 + 2] = z
    
    
    //                 // Choose gradient t based on Y (low -> bottomColor, high -> topColor). You can switch to z or distance.
    //                 // const t = (y + jitterY / 2) / jitterY // normalized 0..1
    //                 // const c = colorBottom.clone().lerp(colorTop, THREE.MathUtils.clamp(t, 0, 1))
    
    //                 // Gradient based on z (depth). t = 0 at minZ, 1 at maxZ
    //                 const zcl = THREE.MathUtils.clamp((z - minZ ) / (maxZ - minZ), 0, 1)
    //                 const xcl = THREE.MathUtils.clamp((x - minX ) / (maxX - minX), 0, 1)
    //                 const mixT = (xcl * zcl)  // average of X and Z normalized values
    //                 const c = colorBottom.clone().lerp(colorTop, mixT)

    //                 colors[idx * 3 + 0] = c.r 
    //                 colors[idx * 3 + 1] = c.g 
    //                 colors[idx * 3 + 2] = c.b 
    
    
    //                 // idx++
    //             }
    //         }
    //     }


    //     return { positions, colors, count: num }
    // }, [width, depth, spacing, jitterY, topColor, bottomColor])
    
    // const { positions, colors, count } = useMemo(() => {

    //     const cols = Math.max(1, Math.floor(width / spacing) + 1)
    //     const rows = Math.max(1, Math.floor(depth / spacing) + 1)
    //     const height = Math.max(1, Math.floor(jitterY / spacing) + 1)

    //     const posArr = []
    //     const colArr = []

    //     const colorTop = new THREE.Color(topColor)
    //     const colorBottom = new THREE.Color(bottomColor)

    //     const minZ = -((rows - 1) / 50) * spacing
    //     const maxZ = -minZ
    //     const minX = -((cols - 1) / 2) * spacing
    //     const maxX = -minX

    //     // CONFIG: choose behavior here
    //     const mode = 'hole' // 'hole' | 'ring' | 'onlyInside' | 'none'
    //     const holeRadius = 0.9
    //     const thickness = 0.1 // used for 'ring' (distance tolerance)

    //     // build grid: NOTE we removed the old parity/globalIdx skipping
    //     for (let ix = 0; ix < cols; ix++) {
    //     for (let iz = 0; iz < rows; iz++) {
    //         for (let iy = 0; iy < height; iy++) {
    //         const x = (ix - (cols - 1) / 2) * spacing
    //         const y = (iy - (height - 1) / 2) * spacing
    //         const z = (iz - (rows - 1) / 2) * spacing

    //         // 2D distance from center on XZ plane
    //         const dXZ = Math.hypot(x, z)

    //         // decide whether to KEEP this point depending on mode
    //         let keep = true
    //         if (mode === 'hole') {
    //             // keep outside the radius, remove inside -> empty circle
    //             if (dXZ < holeRadius) keep = false
    //         } else if (mode === 'onlyInside') {
    //             // keep only inside circle, remove outside
    //             if (dXZ > holeRadius) keep = false
    //         } else if (mode === 'ring') {
    //             // keep only points near the circle boundary (a thin ring)
    //             // Use absolute difference to the radius with a thickness tolerance
    //             if (Math.abs(dXZ - holeRadius) > thickness) keep = false
    //         } // 'none' leaves keep = true

    //         if (!keep) continue

    //         // push position
    //         posArr.push(x, y, z)

    //         // color: example uses X/Z gradient; change to whatever you like
    //         const zcl = THREE.MathUtils.clamp((z - minZ) / (maxZ - minZ), 0, 1)
    //         const xcl = THREE.MathUtils.clamp((x - minX) / (maxX - minX), 0, 1)
    //         const mixT = (xcl + zcl) * 0.5
    //         const c = colorBottom.clone().lerp(colorTop, mixT)

    //         colArr.push(c.r, c.g, c.b)
    //         }
    //     }
    //     }

    //     const positions = new Float32Array(posArr)
    //     const colors = new Float32Array(colArr)
    //     const count = positions.length / 3
    //     return { positions, colors, count }

    // }, [width, depth, spacing, jitterY, topColor, bottomColor])

    // const { positions, colors, count } = useMemo(() => {

    //     const cols = Math.max(1, Math.floor(width / spacing) + 1)
    //     const rows = Math.max(1, Math.floor(depth / spacing) + 1)
    //     const height = Math.max(1, Math.floor(jitterY / spacing) + 1)

    //     const posArr = []
    //     const colArr = []

    //     const colorTop = new THREE.Color(topColor)
    //     const colorBottom = new THREE.Color(bottomColor)

    //     const minZ = -((rows - 1) / 50) * spacing
    //     const maxZ = -minZ
    //     const minX = -((cols - 1) / 2) * spacing
    //     const maxX = -minX

        

    //     // CONFIG
    //     const mode = 'sphereShell' // 'sphereHole' | 'sphereShell' | 'onlyInsideSphere' | 'none'
    //     const sphereRadius = 2.5
    //     const shellThickness = 0.15    // used for 'sphereShell' (in world units)
    //     const sphereCenter = { x: 0, y: 0, z: 0 } // move sphere around if you want
    //     const bgColor = new THREE.Color('#000000') // used for soft fade if enabled
    //     const softEdge = false // set true to fade colors near boundary

    //     // build grid
    //     for (let ix = 0; ix < cols; ix++) {
    //         for (let iz = 0; iz < rows; iz++) {
    //             for (let iy = 0; iy < height; iy++) {
    //                 const x = (ix - (cols - 1) / 2) * spacing
    //                 const y = (iy - (height - 1) / 2) * spacing
    //                 const z = (iz - (rows - 1) / 2) * spacing

    //                 // 3D distance to sphere center
    //                 const dx = x - sphereCenter.x
    //                 const dy = y - sphereCenter.y
    //                 const dz = z - sphereCenter.z
    //                 const d3 = Math.hypot(dx, dy, dz)

    //                 // decide KEEP vs SKIP based on mode
    //                 let keep = true
    //                 if (mode === 'sphereHole') {
    //                     if (d3 < sphereRadius) keep = false
    //                 } else if (mode === 'onlyInsideSphere') {
    //                     if (d3 > sphereRadius) keep = false
    //                 } else if (mode === 'sphereShell') {
    //                     // keep only points near the spherical surface
    //                     if (Math.abs(d3 - sphereRadius) > shellThickness) keep = false
    //                 } // 'none' keeps all

    //                 if (!keep) continue

    //                 // push position
    //                 posArr.push(x, y, z)

    //                 // color: example uses X/Z gradient; you can also use distance-to-center for shading
    //                 const zcl = THREE.MathUtils.clamp((z - minZ) / (maxZ - minZ), 0, 1)
    //                 const xcl = THREE.MathUtils.clamp((x - minX) / (maxX - minX), 0, 1)
    //                 const mixT = (xcl + zcl) * 0.5
    //                 const c = colorBottom.clone().lerp(colorTop, mixT)

    //                 // optional soft fade near sphere boundary (interpolate toward bgColor)
    //                 if (softEdge) {
    //                     let fadeT = 0
    //                     if (mode === 'sphereHole') {
    //                     // fade points near inner boundary (within shellThickness)
    //                     const distToBoundary = Math.max(0, sphereRadius - d3)
    //                     fadeT = THREE.MathUtils.clamp(distToBoundary / shellThickness, 0, 1) // 0=far, 1=deep inside
    //                     } else if (mode === 'sphereShell') {
    //                     // fade toward edges of the shell
    //                     const distToBoundary = Math.abs(d3 - sphereRadius)
    //                     fadeT = THREE.MathUtils.clamp(1 - (distToBoundary / shellThickness), 0, 1)
    //                     } else if (mode === 'onlyInsideSphere') {
    //                     // optional: fade from center outward
    //                     fadeT = THREE.MathUtils.clamp(1 - (d3 / sphereRadius), 0, 1)
    //                     }
    //                     c.lerp(bgColor, 1 - fadeT) // more fade -> closer to bgColor
    //                 }

    //                 colArr.push(c.r, c.g, c.b)
    //             }
    //         }
    //     }


    //     const positions = new Float32Array(posArr)
    //     const colors = new Float32Array(colArr)
    //     const count = positions.length / 3
    //     return { positions, colors, count }

    // }, [width, depth, spacing, jitterY, topColor, bottomColor])

    // const { positions, colors, count, boxes } = useMemo(() => {
    //     const cols = Math.max(1, Math.floor(width / spacing) + 1)
    //     const rows = Math.max(1, Math.floor(depth / spacing) + 1)
    //     const height = Math.max(1, Math.floor(jitterY / spacing) + 1)

    //     const posArr = []
    //     const colArr = []

    //     const colorTop = new THREE.Color(topColor)
    //     const colorBottom = new THREE.Color(bottomColor)

    //     const minZ = -((rows - 1) / 2) * spacing
    //     const maxZ = -minZ
    //     const minX = -((cols - 1) / 2) * spacing
    //     const maxX = -minX
    //     const minY = -((height - 1) / 2) * spacing
    //     const maxY = -minY

    //     // ---------- CONFIG: multiple boxes (make them plainly inside the grid) ----------
    //     // Tune positions & sizes so they are clearly inside the main cube
    //     const boxes = [
    //         { center: { x: 1.25, y: 1.25, z: 1.25 }, size: { x: 2.5, y: 2.5, z: 2.5 } },
    //         { center: { x: 1.2, y: 0.0, z: -1.6 }, size: { x: 2., y: 2., z: 2. } },
    //         { center: { x: 1.6, y: -1.5, z: 0.4 }, size: { x: 1.8, y: 1.8, z: 1.8 } }
    //     ]

    //     // 'carve' removes interior points => empty cuboids
    //     // 'shell' keeps only near-face points (outline of boxes)
    //     const boxMode = 'carve' // switch to 'shell' if you prefer outlines
    //     const shellThickness = spacing * 5. // ~1 grid step thickness for shell

    //     // ---------- build grid ----------
    //     for (let ix = 0; ix < cols; ix++) {
    //         for (let iz = 0; iz < rows; iz++) {
    //             for (let iy = 0; iy < height; iy++) {
    //                 const x = (ix - (cols - 1) / 2) * spacing
    //                 const y = (iy - (height - 1) / 2) * spacing
    //                 const z = (iz - (rows - 1) / 2) * spacing

    //                 // test against each box
    //                 let insideAnyBox = false
    //                 let insideShellAnyBox = false

    //                 for (let b = 0; b < boxes.length; b++) {
    //                     const box = boxes[b]
    //                     const hx = box.size.x / 2
    //                     const hy = box.size.y / 2
    //                     const hz = box.size.z / 2

    //                     const dx = Math.abs(x - box.center.x)
    //                     const dy = Math.abs(y - box.center.y)
    //                     const dz = Math.abs(z - box.center.z)

    //                     const insideBox = dx <= hx && dy <= hy && dz <= hz
    //                     if (insideBox) {
    //                         insideAnyBox = true
    //                         // distance to nearest face (how deep inside)
    //                         const distToFace = Math.min(hx - dx, hy - dy, hz - dz)
    //                         if (distToFace <= shellThickness) {
    //                             insideShellAnyBox = true
    //                         }
    //                     }
    //                 }

    //                 // decide keep/skip
    //                 let keep = true
    //                 if (boxMode === 'carve') {
    //                     if (insideAnyBox) keep = false
    //                 } else if (boxMode === 'shell') {
    //                     if (!insideShellAnyBox) keep = false
    //                 }

    //                 if (!keep) continue

    //                 posArr.push(x, y, z)

    //                 // color (smooth X/Z gradient)
    //                 const zcl = THREE.MathUtils.clamp((z - minZ) / (maxZ - minZ), 0, 1)
    //                 const xcl = THREE.MathUtils.clamp((x - minX) / (maxX - minX), 0, 1)
    //                 const mixT = (xcl + zcl) * 0.5
    //                 const c = colorBottom.clone().lerp(colorTop, mixT)

    //                 colArr.push(c.r, c.g, c.b)
    //             }
    //         }
    //     }

    //     const positions = new Float32Array(posArr)
    //     const colors = new Float32Array(colArr)
    //     const count = positions.length / 3
    //     return { positions, colors, count, boxes }
    // }, [width, depth, spacing, jitterY, topColor, bottomColor])
    const { positions, colors, count } = useMemo(() => {
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

        // ---------- PATTERN CONFIG ----------
        // Spheres lattice
        const sphereGap = 1.0     // world units between sphere centers
        const sphereRadius = 0.6  // cavity radius in world units

        // Helix tunnel
        const helixRadius = 1.1   // radius of helix curve from center
        const helixTurns = 3      // number of turns from bottom to top
        const helixTunnelRadius = 0.35 // tunnel thickness (points inside tunnel are removed)

        // Cube grid (many small cuboid cavities)
        const cubeGrid = [
        { center: { x: -1.4, y: 0.0, z: -0.6 }, size: { x: 1.0, y: 1.0, z: 1.0 } },
        { center: { x:  1.2, y: 0.0, z:  0.6 }, size: { x: 1.0, y: 1.3, z: 0.9 } },
        { center: { x:  0.0, y: 1.2, z: -1.6 }, size: { x: 0.9, y: 0.8, z: 0.9 } },
        // optionally add more boxes...
        ]

        // Helper: test inside any cube
        const pointInsideAnyBox = (x, y, z) => {
        for (let b = 0; b < cubeGrid.length; b++) {
            const box = cubeGrid[b]
            const hx = box.size.x / 2
            const hy = box.size.y / 2
            const hz = box.size.z / 2
            if (Math.abs(x - box.center.x) <= hx &&
                Math.abs(y - box.center.y) <= hy &&
                Math.abs(z - box.center.z) <= hz) {
            return true
            }
        }
        return false
        }

        // Build grid and apply carving rules depending on 'pattern'
        for (let ix = 0; ix < cols; ix++) {
        for (let iz = 0; iz < rows; iz++) {
            for (let iy = 0; iy < height; iy++) {
            const x = (ix - (cols - 1) / 2) * spacing
            const y = (iy - (height - 1) / 2) * spacing
            const z = (iz - (rows - 1) / 2) * spacing

            // Decide KEEP vs CARVE (skip) based on pattern
            let keep = true

            if (pattern === 'spheres') {
                // create lattice of sphere centers inside cube extents:
                // iterate sphere centers in a coarse grid and if point falls within any sphere -> carve
                const sxCount = Math.ceil(width / sphereGap)
                const szCount = Math.ceil(depth / sphereGap)
                const syCount = Math.ceil(heightSize / sphereGap)
                // center offsets for lattice (arrange around world origin)
                const offsetX = -((sxCount - 1) / 2) * sphereGap
                const offsetZ = -((szCount - 1) / 2) * sphereGap
                const offsetY = -((syCount - 1) / 2) * sphereGap

                for (let sx = 0; sx < sxCount; sx++) {
                for (let sy = 0; sy < syCount; sy++) {
                    for (let sz = 0; sz < szCount; sz++) {
                    const cx = offsetX + sx * sphereGap
                    const cy = offsetY + sy * sphereGap
                    const cz = offsetZ + sz * sphereGap
                    const d3 = Math.hypot(x - cx, y - cy, z - cz)
                    if (d3 < sphereRadius) {
                        keep = false
                        sx = sxCount; sy = syCount; sz = szCount // break all loops fast
                    }
                    }
                }
                }
            } else if (pattern === 'helix') {
                // Helix along Y: compute param t proportional to y, then center of helix at that t
                // map y from [minY, maxY] -> [0, 1]
                const u = (y - minY) / (maxY - minY) // 0..1
                const t = u * helixTurns * Math.PI * 2
                const cx = helixRadius * Math.cos(t)
                const cz = helixRadius * Math.sin(t)
                const dx = x - cx
                const dz = z - cz
                const d = Math.hypot(dx, dz)
                if (d < helixTunnelRadius) {
                keep = false // point is inside tunnel -> carve
                }
            } else if (pattern === 'cubeGrid') {
                if (pointInsideAnyBox(x, y, z)) {
                // for clearer gaps, carve points inside boxes
                keep = false
                }
            }

            if (!keep) continue

            // push position
            posArr.push(x, y, z)

            // color mixing (you can change to radial shading, height shading, etc.)
            const zcl = THREE.MathUtils.clamp((z - minZ) / (maxZ - minZ), 0, 1)
            const xcl = THREE.MathUtils.clamp((x - minX) / (maxX - minX), 0, 1)
            // add a little height shading too
            const ycl = THREE.MathUtils.clamp((y - minY) / (maxY - minY), 0, 1)
            const mixT = (xcl * 0.4 + zcl * 0.4 + ycl * 0.2)
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
    }, [width, depth, heightSize, spacing, topColor, bottomColor, pattern])

    return(
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
                    depthWrite={true}
                    transparent={false}
                    blending={THREE.NormalBlending}
                />
            </points>

        </>
    )
}

const BufferShaders10 = () => {
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

export default BufferShaders10