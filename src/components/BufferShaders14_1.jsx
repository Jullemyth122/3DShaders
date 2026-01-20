import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three';

const BufferScene = ({
    width = 50,
    depth = 50,
    spacing = 0.05,
    jitterY = 0.02,
    heightSize = 50,
    pointSize = 0.06,
    topColor = '#ebde71',
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

        const centerX = (cols - 1) / 2;
        const centerZ = (rows - 1) / 2;
        const centerY = (height - 1) / 2;
        const minZ = -(centerZ) * spacing
        const maxZ = -minZ
        const minX = -(centerX) * spacing
        const maxX = -minX
        const minY = -(centerY) * spacing
        const maxY = -minY

        const cx = 0., cy = 0., cz = 0, r = 6.5, circleThickness = spacing * 1.5
        const m = 0.5, b = 0.0, lineThickness = spacing * 1.2


        // gap settings in columns
        const gapPeriodX = 5;   // every 12 columns create a gap
        const gapWidthX  = 2;   // gap occupies 2 columns
        const gapPeriodZ = 5;
        const gapWidthZ  = 2;
        const gapPeriodY = 5;
        const gapWidthY  = 2;

        let baseIDX = 0;

        for (let ix = 0; ix < cols; ix++) {


            for (let iz = 0; iz < rows; iz++) {
                
                for (let iy = 0; iy < height; iy++) {
                                        
                    const x = (ix - centerX) * spacing
                    const y = (iy - centerY) * spacing
                    const z = (iz - centerZ) * spacing
                    
                    // if(Math.abs(x + Math.sinh(x) * Math.sqrt(y * y + z * z)) < spacing * 2.0) continue
                    // if(Math.abs(y + Math.sinh(y) * Math.sqrt(x * x + z * z)) < spacing * 2.0) continue
                    // if(Math.abs(z + Math.sinh(z) / Math.sqrt(y * y + x * x)) < spacing * 50.0) continue
                    
                    // if(Math.abs( x ) < spacing) continue

                    // if(Math.abs( Math.sqrt( y * y, z * z ) ) < spacing * 2.0) continue
                    // if(Math.abs( Math.sqrt( x * x, z * z ) ) < spacing * 2.0) continue
                    
                    // const dxdz = Math.hypot(x - cx, y - cy, z - cz)
                    // if (0.1 < Math.abs(dxdz - r / 4) < circleThickness) continue  // Your original "horizon" skip; adjust if needed

                    // positive modulo helper
                    const relIx = ix - Math.round(centerX);
                    const relIz = iz - Math.round(centerZ);
                    const relIy = iy - Math.round(centerY);
                    const modX = ((relIx % gapPeriodX) + gapPeriodX) % gapPeriodX;
                    const modZ = ((relIz % gapPeriodZ) + gapPeriodZ) % gapPeriodZ;
                    const modY = ((relIy % gapPeriodY) + gapPeriodY) % gapPeriodY;

                    // OPTION A: vertical bands (gaps along X only)
                    // if (modX < gapWidthX) continue;

                    // OPTION B: holes only at grid intersections (both X & Z)
                    // if (modX < gapWidthX || modZ < gapWidthZ) continue;

                    if (modX < gapWidthX || modZ < gapWidthZ || modY < gapWidthY ) continue;

                    // push position
                    posArr.push(x, y, z)

                    // color mixing (based on X/Z here)
                    const zcl = THREE.MathUtils.clamp((z - minZ) / (maxZ - minZ || 1), 0, 1)
                    const xcl = THREE.MathUtils.clamp((x - minX) / (maxX - minX || 1), 0, 1)
                    const mixT = (xcl * zcl)
                    const c = colorBottom.clone().lerp(colorTop, mixT)

                    colArr.push(c.r, c.g, c.b)

                    baseIDX++;
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

const BufferShaders14_1 = () => {
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

export default BufferShaders14_1
