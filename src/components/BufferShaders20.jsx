import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three';

// const vertexShader = `

//     attribute vec3 color;
//     uniform float u_time;
//     uniform float u_radius;      // max radial offset
//     uniform float u_pointSize;
//     uniform float u_pointScale;
//     uniform float u_pixelRatio;
//     uniform vec3 u_center;       // center of radial motion (object space)
//     varying vec3 vColor;

//     void main() {
//         vColor = color;

//         // distance from center
//         float dist = length(position - u_center);

//         // wave parameters
//         float freq = 1.0;
//         float speed = 5.;
//         float phase = u_time * speed - dist * freq;

//         // animated 0..1 value with wave
//         float delta = (sin(phase) + 1.0) / 2.0;

//         // direction from center to the vertex (object space)
//         vec3 dir = normalize(position - u_center);

//         // displacement vector (scaled by delta and u_radius)
//         vec3 disp = dir * (u_radius * delta);

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


// `;

const vertexShader = `

    precision mediump float;
    precision mediump int;


    attribute vec3 color;
    uniform float u_time;
    uniform float u_radius;      
    uniform float u_pointSize;
    uniform float u_pointScale;
    uniform float u_pixelRatio;
    uniform vec3 u_center;
    varying vec3 vColor;
    varying float vPulse; // <- new

    void main() {
        vColor = color;

        // distance from center
        float dist = length(position - u_center);

        // wave parameters (tweakable)
        float freq = 1.0;
        float speed = 5.0;
        float phase = u_time * speed - dist * freq;

        // animated 0..1 value with wave
        float delta = (sin(phase) + 1.0) * 0.5;

        // pass pulse to fragment shader so they can sync
        vPulse = delta;

        // displacement
        vec3 dir = normalize(position - u_center);
        vec3 disp = dir * (u_radius * delta);
        vec3 newPos = position + disp;

        vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // perspective size attenuation (safe)
        float zDepth = max(0.1, -mvPosition.z);
        float size = (u_pointSize * u_pointScale) / zDepth;
        size = clamp(size, 1.0, 120.0);
        gl_PointSize = size * u_pixelRatio;
    }
`;


// const fragmentShader = `
//     precision mediump float;
//     varying vec3 vColor;
//     uniform float u_time;

//     void main(){
//         // gl_PointCoord is provided in [0..1] across the point square
//         vec2 coord = gl_PointCoord - vec2(0.5);
//         float dist = length(coord);

//         // make points round by discarding outside the circle
//         if(dist > 0.5) discard;

//         // output per-vertex color (alpha 1.0)
//         gl_FragColor = vec4(vColor, 1.0);
//     }
// `;

const fragmentShader = `
    precision mediump float;
    precision mediump int;

    varying vec3 vColor;
    varying float vPulse;     // from vertex
    uniform float u_time;
    uniform float u_glow;      // overall glow multiplier (0..2)
    uniform float u_rippleSpeed;
    uniform float u_rippleFreq;
    uniform float u_alpha;     // global alpha

    void main() {
        // coordinate of the fragment within the point sprite [-0.5..0.5]
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);

        // discard outside circle for perfect round points
        if (dist > 0.5) discard;

        // normalized 0..1 where center=1, edge=0
        float mask = 1.0 - smoothstep(0.0, 0.5, dist);

        // small ripple that travels outward inside the point (optional)
        float ripple = 0.0;
        // ripple controlled by uniforms; keep low cost
        ripple = 0.5 + 0.5 * sin(u_time * u_rippleSpeed - dist * u_rippleFreq);

        // Combine vertex pulse (vPulse) with local ripple to modulate brightness
        float brightness = mix(0.6, 1.6, vPulse) * (0.6 + 0.4 * ripple);

        // stronger soft glow around center — shaped by mask^power
        float glow = pow(mask, 1.8) * u_glow * (0.4 + 0.6 * vPulse);

        // final color & alpha
        vec3 color = vColor * (brightness + glow);
        float alpha = clamp(mask * (0.5 + 0.6 * vPulse) , 0.0, 1.0) * u_alpha;

        // optionally boost saturation near pulse: subtle HSV-like effect via lerp toward white
        vec3 finalColor = mix(color * 0.85, vec3(1.0), 0.12 * vPulse);

        gl_FragColor = vec4(finalColor, alpha);
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
        u_center: { value: new THREE.Vector3(0, 0, 0) },
    
            // new fragment controls:
        u_glow:       { value: 2.0 },
        u_rippleSpeed:{ value: 5.0 },
        u_rippleFreq: { value: 100.0 },
        u_alpha:      { value: 10.0 }
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

const BufferShaders20 = () => {
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

export default BufferShaders20;


