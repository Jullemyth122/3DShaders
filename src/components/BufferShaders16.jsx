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


        // ----- boundary parameters you can tune -----
        const boundaryLayersX = [1, 3]   // keep columns within 1 layer OR 3 layers from X boundaries
        const boundaryLayersZ = [1,3]      // keep rows within 1 layer from Z boundaries
        const boundaryLayersY = [1,3]      // keep layers within 1 layer from Y boundaries

        // keep when point is on 'shell' (>=1 axis boundary), 'edges' (>=2), 'corners' (==3),
        // or numeric: require at least N axis boundaries (e.g., 2 == edges).
        // valid values: 'shell'|'edges'|'corners'| number
        const boundaryRule = 'edges'

        // optional: invert behaviour (if true -> keep interior instead of boundaries)
        const invertBoundary = false
        // --------------------------------------------

        // helper: compute whether an index ix is within ANY of the specified layer-thresholds
        // 'max' is number of indices (cols/rows/height), layers is array of integers (layers from boundary)
        const isIndexInBoundaryLayers = (idx, max, layers) => {
        if (!layers || layers.length === 0) return false
        // distance to nearest edge in index-space (0..max-1)
        const dist = Math.min(idx, (max - 1) - idx)
        // check each supplied layer threshold
        for (const L of layers) {
            const layer = Math.max(0, Math.floor(L)) // ensure integer
            if (dist < layer) return true
        }
        return false
        }

        // now iterate grid with better boundary detection
        for (let ix = 0; ix < cols; ix++) {
        // precompute x-boundary flag per-column (fast)
        const isBoundaryX = isIndexInBoundaryLayers(ix, cols, boundaryLayersX)

        for (let iz = 0; iz < rows; iz++) {
            // precompute z-boundary for row
            const isBoundaryZ = isIndexInBoundaryLayers(iz, rows, boundaryLayersZ)

            for (let iy = 0; iy < height; iy++) {
            const isBoundaryY = isIndexInBoundaryLayers(iy, height, boundaryLayersY)

            // how many axes touch boundary at this grid cell
            const boundaryCount = (isBoundaryX ? 1 : 0) + (isBoundaryZ ? 1 : 0) + (isBoundaryY ? 1 : 0)

            // decide keep vs skip based on rule
            let keep = false
            if (typeof boundaryRule === 'number') {
                keep = boundaryCount >= boundaryRule
            } else if (boundaryRule === 'shell') {
                keep = boundaryCount >= 1
            } else if (boundaryRule === 'edges') {
                keep = boundaryCount >= 2
            } else if (boundaryRule === 'corners') {
                keep = boundaryCount === 3
            } else {
                // default fallback: keep edges and shell
                keep = boundaryCount >= 2
            }

            // apply inversion option
            if (invertBoundary) keep = !keep

            if (!keep) continue

            // compute real world coords and push (same as your previous code)
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

const BufferShaders16 = () => {
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

export default BufferShaders16
