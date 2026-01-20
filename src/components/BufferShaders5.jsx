// BufferShaders5.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, shaderMaterial } from '@react-three/drei';

// -------------- 1) Define our dynamic flower shader --------------
const FlowerMat = shaderMaterial(
  {
    u_time:      0,
    u_numPetals: 10.0,   // how many petals per layer
    u_petalSpeed: 1.0,   // how fast petals rotate
    u_warpFreq:   5.0,   // secondary warp frequency
    u_warpSpeed:  0.5,   // how fast warp oscillates
    u_baseRadius: 2.5,   // overall size of flower
  },
  // Vertex Shader
  /* glsl */`
    attribute float aAngle;
    attribute float aLayer;
    attribute float aY;
    uniform float u_time, u_numPetals, u_petalSpeed, u_warpFreq, u_warpSpeed, u_baseRadius;
    varying float vY;

    void main() {
      vY = aY;

      // primary petal shape
      float petal = sin(aAngle * u_numPetals + u_time * u_petalSpeed);
      petal = abs(petal);

      // secondary gear warp
      float warp = cos(aAngle * u_warpFreq - u_time * u_warpSpeed) * 0.3 + 1.0;

      // combine for final radius
      float r = u_baseRadius * (petal * warp);

      // convert back to cartesian
      vec3 pos = vec3(
        cos(aAngle) * r,
        aY,
        sin(aAngle) * r
      );

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 2.0;
    }
  `,
  // Fragment Shader
  /* glsl */`
    precision highp float;
    varying float vY;
    void main() {
      // simple vertical gradient coloring
      float t = (vY + 1.25) / 2.5;  // maps y∈[-1.25,1.25]→[0,1]
      gl_FragColor = vec4(mix(vec3(0.1,0.2,0.5), vec3(0.9,0.7,0.3), t), 1.0);
    }
`
);
extend({ FlowerMat });

// -------------- 2) Build the point cloud --------------
function FlowerScene() {
  const meshRef = useRef();
  const matRef  = useRef();

  const count = 50000;
  // Predefine your Y‐interval “layers”
  const intervals = useMemo(() => ([
    [-1.25, -1.0],
    [-0.85, -0.65],
    [-0.45, -0.25],
    [-0.10,  0.10],
    [ 0.25,  0.45],
    [ 0.65,  0.85],
    [ 1.00,  1.25],
  ]), []);

  // Generate aAngle, aLayer, and aY as buffer attributes
  const { angles, layers, ys } = useMemo(() => {
    const ang = new Float32Array(count);
    const lay = new Float32Array(count);
    const yv  = new Float32Array(count);

    const layersCount = intervals.length;
    for (let i = 0; i < count; i++) {
      const layerIdx = i % layersCount;
      const [y0, y1] = intervals[layerIdx];
      ang[i] = Math.random() * Math.PI * 2;
      lay[i] = layerIdx;
      yv[i]  = y0 + Math.random() * (y1 - y0);
    }
    return { angles: ang, layers: lay, ys: yv };
  }, [count, intervals]);

  // Animate time uniform
  useFrame(({ clock }) => {
    matRef.current.u_time = clock.getElapsedTime();
    // optional: slowly orbit camera
    meshRef.current.rotation.y += 0.002;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-aAngle"
          array={angles}
          itemSize={1}
          count={count}
        />
        <bufferAttribute
          attach="attributes-aLayer"
          array={layers}
          itemSize={1}
          count={count}
        />
        <bufferAttribute
          attach="attributes-aY"
          array={ys}
          itemSize={1}
          count={count}
        />
      </bufferGeometry>
      <flowerMat
        ref={matRef}
        u_numPetals={12}
        u_petalSpeed={2.0}
        u_warpFreq={7.0}
        u_warpSpeed={1.5}
        u_baseRadius={2.0}
      />
    </points>
  );
}

// -------------- 3) Render the Canvas --------------
export default function BufferShaders5() {
  return (
    <div className='buffer-shader' style={{ width: '100vw', height: '100vh' }}>
      <Canvas gl={{ antialias: true }} camera={{ position: [0, 3, 8], fov: 45 }}>
        <color attach="background" args={['#101010']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1.0} />
        <FlowerScene />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
