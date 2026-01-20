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

        const cx = 0.5, cy = 0.5, cz = 0.5, r = 2.5, circleThickness = spacing * 1.5
        const m = 0.5, b = 0.0, lineThickness = spacing * 1.2
        const invSqrt1pm2 = 1 / Math.sqrt(1 + m * m) // reuse

        for (let ix = 0; ix < cols; ix++) {


            for (let iz = 0; iz < rows; iz++) {
                
                for (let iy = 0; iy < height; iy++) {
                                        
                    const x = (ix - (cols - 1) / 2) * spacing
                    const y = (iy - (height - 1) / 2) * spacing
                    const z = (iz - (rows - 1) / 2) * spacing
                    
                    // if (ix === iz || (ix + iz === Math.min(cols, rows) - 1)) continue
                    // if (iy === iz || (iy + iz === Math.min(height, rows) - 1)) continue
                    // if (ix === iy || (ix + iy === Math.min(cols, height) - 1)) continue
                    // if(Math.abs(x) < spacing * 2.0) continue
                    // if(Math.abs(y) < spacing * 2.0) continue
                    // if(Math.abs(z) < spacing * 2.0) continue
                    
                    // if(Math.abs(z - x * x * 2) < spacing * 2.0) continue
                    // if(Math.abs((z + 0.0) + x * x  * x * 2) < spacing * 2.0) continue
                    // if(Math.abs((y + 0.0) + x * x  * x * 2) < spacing * 2.0) continue
                    
                    // const dxdz = Math.hypot(x - cx, z - cz)
                    // const dydz = Math.hypot(y - cy, z - cz)
                    // const dydx = Math.hypot(y - cy, x - cx)
                    // if ( 0.1 < Math.abs(dxdz - r / 1.01) < circleThickness) continue
                    // if ( 0.1 < Math.abs(dydz - r / 1.01) < circleThickness) continue
                    // if ( 0.1 < Math.abs(dydx - r / 1.01) < circleThickness) continue

                    const d3 = Math.hypot(x * x  - cx * cx , y * y - cy * cy , z * z - cz * cz) // distance to sphere center
                    // if (0.5 < Math.abs(d3 - r) < circleThickness) continue  
                    if (0.5 < Math.abs(d3 - r) < circleThickness) continue  
                    // if (circleThickness * (ix * iy * iz) < Math.abs(d3 - r) < circleThickness + (ix * iy * iz) ) continue  


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

const BufferShaders14 = () => {
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

export default BufferShaders14
