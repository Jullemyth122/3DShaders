import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three';

const vertexShader = `

    attribute vec3 color;
    uniform float u_time;
    uniform float u_radius;      // max radial offset
    uniform float u_pointSize;
    uniform float u_pointScale;
    uniform float u_pixelRatio;
    uniform vec3 u_center;       // center of radial motion (object space)
    varying vec3 vColor;

    void main() {
        vColor = color;

        // animated 0..1 value
        float delta = (sin(u_time) + 1.0) * 1.0;

        // direction from center to the vertex (object space)
        vec3 dir = normalize(position - u_center);

        // displacement vector (scaled by delta and u_radius)
        vec3 disp = dir * (u_radius * delta);

        // new position = original position + displacement
        vec3 newPos = position + disp;

        // standard transform into clip space
        vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // perspective size attenuation (safe)
        float zDepth = max(0.1, -mvPosition.z);
        float size = (u_pointSize * u_pointScale) / zDepth;
        size = clamp(size, 1.0, 120.0);
        gl_PointSize = size * u_pixelRatio;
    }
    // void main() {
    //     vColor = color;

    //     // twisting around y-axis
    //     float twist = sin(u_time) * 0.5; // max twist in radians (~28 degrees)
    //     float angle = position.y * twist; // angle proportional to y position

    //     float c = cos(angle);
    //     float s = sin(angle);

    //     vec3 newPos;
    //     newPos.x = position.x * c - position.z * s;
    //     newPos.y = position.y;
    //     newPos.z = position.x * s + position.z * c;

    //     // standard transform into clip space
    //     vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    //     gl_Position = projectionMatrix * mvPosition;

    //     // perspective size attenuation (safe)
    //     float zDepth = max(0.1, -mvPosition.z);
    //     float size = (u_pointSize * u_pointScale) / zDepth;
    //     size = clamp(size, 1.0, 120.0);
    //     gl_PointSize = size * u_pixelRatio;
    // }
    // void main() {
    //     vColor = color;

    //     // neural activation propagation along x-axis (like layers in a network)
    //     float freq = 10.0;  // frequency of the wave
    //     float speed = 2.0;  // speed of propagation
    //     float phase = u_time * speed - position.x * freq;

    //     // animated 0..1 value with wave
    //     float delta = (sin(phase) + 1.0) / 2.0;

    //     // direction from center to the vertex (object space)
    //     vec3 dir = normalize(position - u_center);

    //     // displacement vector (scaled by delta and u_radius)
    //     vec3 disp = dir * (u_radius * delta);

    //     // new position = original position + displacement
    //     vec3 newPos = position + disp;

    //     // standard transform into clip space
    //     vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    //     gl_Position = projectionMatrix * mvPosition;

    //     // perspective size attenuation (safe)
    //     float zDepth = max(0.1, -mvPosition.z);
    //     float size = (u_pointSize * u_pointScale) / zDepth;
    //     size = clamp(size, 1.0, 120.0);
    //     gl_PointSize = size * u_pixelRatio;
    // }
    
    // void main() {
    //     vColor = color;

    //     // Determine layer along y-axis (assuming y ranges approx -1.5 to 1.5)
    //     float layer;
    //     if (position.y < -0.5) {
    //         layer = 0.0;
    //     } else if (position.y < 0.5) {
    //         layer = 1.0;
    //     } else {
    //         layer = 2.0;
    //     }

    //     // Phase offset for each layer to desynchronize rotations
    //     float phase = layer * 2.0 * 3.14159 / 3.0;

    //     // Animated angle (max 90 degrees)
    //     float angle = sin(u_time + phase) * (3.14159 / 2.0);

    //     // Rotate around y-axis
    //     float c = cos(angle);
    //     float s = sin(angle);

    //     vec3 newPos;
    //     newPos.x = position.x * c - position.z * s;
    //     newPos.y = position.y;
    //     newPos.z = position.x * s + position.z * c;

    //     // standard transform into clip space
    //     vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    //     gl_Position = projectionMatrix * mvPosition;

    //     // perspective size attenuation (safe)
    //     float zDepth = max(0.1, -mvPosition.z);
    //     float size = (u_pointSize * u_pointScale) / zDepth;
    //     size = clamp(size, 1.0, 120.0);
    //     gl_PointSize = size * u_pixelRatio;
    // }
    // float rand(vec3 co){
    //     return fract(sin(dot(co, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
    // }

    // void main() {
    //     vColor = color;

    //     // animated 0..1 value with sharp peaks for explosion effect
    //     float delta = pow((sin(u_time * 2.0) + 1.0) * 0.5, 5.0);

    //     // direction from center to the vertex (object space)
    //     vec3 dir = normalize(position - u_center);

    //     // perturb direction with pseudo-random vector for chaotic explosion
    //     vec3 randVec = vec3(rand(position), rand(position.yzx), rand(position.zxy)) * 2.0 - 1.0;
    //     dir = normalize(dir + 0.5 * randVec);

    //     // displacement vector (scaled by delta and u_radius)
    //     vec3 disp = dir * (u_radius * delta);

    //     // new position = original position + displacement
    //     vec3 newPos = position + disp;

    //     // standard transform into clip space
    //     vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    //     gl_Position = projectionMatrix * mvPosition;

    //     // perspective size attenuation (safe)
    //     float zDepth = max(0.1, -mvPosition.z);
    //     float size = (u_pointSize * u_pointScale) / zDepth;
    //     size = clamp(size, 1.0, 120.0);
    //     gl_PointSize = size * u_pixelRatio;
    // }  

    // float rand(vec3 co){
    //         return fract(sin(dot(co, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
    //     }

    //     float noise(vec3 p){
    //         vec3 i = floor(p);
    //         vec3 f = fract(p);
    //         f = f * f * (3.0 - 2.0 * f);
    //         float res = mix(
    //             mix(
    //                 mix(rand(i + vec3(0,0,0)), rand(i + vec3(1,0,0)), f.x),
    //                 mix(rand(i + vec3(0,1,0)), rand(i + vec3(1,1,0)), f.x),
    //                 f.y),
    //             mix(
    //                 mix(rand(i + vec3(0,0,1)), rand(i + vec3(1,0,1)), f.x),
    //                 mix(rand(i + vec3(0,1,1)), rand(i + vec3(1,1,1)), f.x),
    //                 f.y),
    //             f.z
    //         );
    //         return res;
    //     }

    //     vec3 snoise(vec3 v){
    //         return vec3(
    //             noise(v),
    //             noise(v + vec3(123.456, 456.789, 789.012)),
    //             noise(v + vec3(234.567, 567.890, 890.123))
    //         );
    //     }

    //     vec3 curlNoise(vec3 p) {
    //         const float e = 0.025;
    //         vec3 dx = vec3(e, 0.0, 0.0);
    //         vec3 dy = vec3(0.0, e, 0.0);
    //         vec3 dz = vec3(0.0, 0.0, e);

    //         vec3 p_x0 = snoise(p - dx);
    //         vec3 p_x1 = snoise(p + dx);
    //         vec3 p_y0 = snoise(p - dy);
    //         vec3 p_y1 = snoise(p + dy);
    //         vec3 p_z0 = snoise(p - dz);
    //         vec3 p_z1 = snoise(p + dz);

    //         float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    //         float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    //         float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    //         const float divisor = 1.0 / (2.0 * e);
    //         return normalize(vec3(x, y, z) * divisor);
    //     }

    //     void main() {
    //         vColor = color;

    //         // curl noise displacement for cloudy effect
    //         vec3 p = position * 3.0 + vec3(u_time * 0.2, u_time * 0.3, u_time * 0.1);
    //         vec3 disp = curlNoise(p) * (u_radius * 0.15);

    //         // new position = original position + displacement
    //         vec3 newPos = position + disp;

    //         // standard transform into clip space
    //         vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    //         gl_Position = projectionMatrix * mvPosition;

    //         // perspective size attenuation (safe)
    //         float zDepth = max(0.1, -mvPosition.z);
    //         float size = (u_pointSize * u_pointScale) / zDepth;
    //         size = clamp(size, 1.0, 120.0);
    //         gl_PointSize = size * u_pixelRatio;
    //     }
    `;

const fragmentShader = `
    precision mediump float;
    varying vec3 vColor;
    uniform float u_time;

    void main(){
        // gl_PointCoord is provided in [0..1] across the point square
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);

        // make points round by discarding outside the circle
        if(dist > 0.5) discard;

        // output per-vertex color (alpha 1.0)
        gl_FragColor = vec4(vColor, 1.0);
    }
`;

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
    const mesh = useRef();
    const shaderRef = useRef();

    // Build positions & per-vertex colors once
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

        const ixCenter = Math.floor(cols / 2)
        const iyCenter = Math.floor(height / 2)
        const izCenter = Math.floor(rows / 2)

        for (let ix = 0; ix < cols; ix++) {
            for (let iz = 0; iz < rows; iz++) {
                for (let iy = 0; iy < height; iy++) {

                    if(ix === ixCenter || iz === izCenter || iy === iyCenter) continue
                    if (ix === iz || (ix + iz === Math.min(cols, rows) - 1)) continue
                    if (iy === iz || (iy + iz === Math.min(height, rows) - 1)) continue
                    if (ix === iy || (ix + iy === Math.min(cols, height) - 1)) continue

                    
                    if (ix !== 0 && ix !== cols - 1 &&
                        iz !== 0 && iz !== rows - 1 &&
                        iy !== 0 && iy !== height - 1) {
                        continue // we're inside the interior; skip it
                    }
                    

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

    // uniforms for shader
    const uniforms = useMemo(() => ({
        u_time: { value: 0.0 },
        u_radius: { value: 2. },         // how far points move at peak
        u_pointSize: { value: pointSize },   // desired base size (pixels)
        u_pointScale: { value: 6.0 },  // perspective scale factor; tune to taste
        u_pixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        u_center: { value: new THREE.Vector3(0, 0, 0) }
    }), [pointSize])

    useFrame(({ clock }) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.u_time.value = clock.getElapsedTime();
            // keep point size in case prop changes at runtime
            shaderRef.current.uniforms.u_pointSize.value = pointSize * 60.0;
        }
    });

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

            {/* shader material — uses the per-vertex `color` attribute directly */}
            <shaderMaterial
                ref={shaderRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                depthWrite={true}           // keep as in your original code
                transparent={false}
                blending={THREE.NormalBlending}
            />
        </points>
        </>
    )
}

const BufferShaders19 = () => {
    return (
        <div className='buffer-shader' style={{ width: '100%', height: '100vh' }}>
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

export default BufferShaders19;


