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

        const ixCenter = Math.floor(cols / 2)
        const iyCenter = Math.floor(height / 2)
        const izCenter = Math.floor(rows / 2)


        // 
        for (let ix = 0; ix < cols; ix++) {
            for (let iz = 0; iz < rows; iz++) {
                for (let iy = 0; iy < height; iy++) {

                    if(ix === ixCenter || iz === izCenter || iy === iyCenter) continue
                    if (ix === iz || (ix + iz === Math.min(cols, rows) - 1)) continue
                    if (iy === iz || (iy + iz === Math.min(height, rows) - 1)) continue
                    if (ix === iy || (ix + iy === Math.min(cols, height) - 1)) continue


                    const x = (ix - (cols - 1) / 2) * spacing
                    const y = (iy - (height - 1) / 2) * spacing
                    const z = (iz - (rows - 1) / 2) * spacing

                    // push position
                    posArr.push(x, y, z)

                    // color mixing (based on X/Z here)
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

const BufferShaders12 = () => {
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

export default BufferShaders12
