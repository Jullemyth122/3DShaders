// TubeFlow.jsx
import React, { useRef, useMemo } from 'react'
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, shaderMaterial } from '@react-three/drei'

// 1) ShaderMaterial
const FlowMaterial = shaderMaterial(
  {
    u_time:   0,
    u_speed:  0.2,    // how fast the blob moves
    u_width:  0.05,   // blob half-width along the pipe
    u_radius: 0.3,    // max radial bulge
  },
  // Vertex Shader
  /* glsl */`
    uniform float u_time, u_speed, u_width, u_radius;
    varying vec2 v_uv;
    void main() {
      v_uv = uv;
      // position along pipe goes uv.y (0→1)
      float t = fract(u_time * u_speed);
      float d = mod(uv.y - t + 1.0, 1.0) - 0.5;
      float blob = exp(-(d*d) / (2.0 * u_width * u_width));
      // move vertex out along its normal
      vec3 displaced = position + normal * u_radius * blob;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
    }
  `,
  // Fragment Shader
  /* glsl */`
    precision highp float;
    uniform float u_time;
    varying vec2 v_uv;
    void main() {
      // dark-to-light gradient along length
      vec3 base = mix(vec3(0.1,0.3,0.7), vec3(0.2,0.6,1.0), v_uv.y);
      gl_FragColor = vec4(base, 1.0);
    }
  `
)
extend({ FlowMaterial })

function TubeFlow() {
  const meshRef = useRef()
  const matRef  = useRef()
  const { camera, size } = useThree()

  // 1) build a smooth curve + tube geometry
  const tubeGeo = useMemo(() => {
        const raw = [
            new THREE.Vector3(-5,0,-5), new THREE.Vector3(-5,0,0),
            new THREE.Vector3(-5,5,0), new THREE.Vector3(-5,5,-5),
            new THREE.Vector3(5,5,-5), new THREE.Vector3(5,5,0),
            new THREE.Vector3(5,0,0), new THREE.Vector3(5,0,-5),
            new THREE.Vector3(-10,0,-10), new THREE.Vector3(-10,0,0),
            new THREE.Vector3(-10,10,0), new THREE.Vector3(-10,10,-10),
            new THREE.Vector3(10,10,-10), new THREE.Vector3(10,10,0),
            new THREE.Vector3(10,0,0), new THREE.Vector3(10,0,-10),
            new THREE.Vector3(-15,0,-15), new THREE.Vector3(-15,0,0),
            new THREE.Vector3(-15,15,0), new THREE.Vector3(-15,15,-15),
            new THREE.Vector3(15,15,-15), new THREE.Vector3(15,15,0),
            new THREE.Vector3(15,0,0), new THREE.Vector3(15,0,-15),
            new THREE.Vector3(-20,0,-20), new THREE.Vector3(-20,0,0),
            new THREE.Vector3(-20,20,0), new THREE.Vector3(-20,20,-20),
            new THREE.Vector3(20,20,-20), new THREE.Vector3(20,20,0),
            new THREE.Vector3(20,0,0), new THREE.Vector3(20,0,-20),
            new THREE.Vector3(-25,0,-25), new THREE.Vector3(-25,0,0),
            new THREE.Vector3(-25,25,0), new THREE.Vector3(-25,25,-25),
            new THREE.Vector3(25,25,-25), new THREE.Vector3(25,25,0),
            new THREE.Vector3(25,0,0), new THREE.Vector3(25,0,-25),
            new THREE.Vector3(-30,0,-30), new THREE.Vector3(-30,0,0),
            new THREE.Vector3(-30,30,0), new THREE.Vector3(-30,30,-30),
            new THREE.Vector3(30,30,-30), new THREE.Vector3(30,30,0),
            new THREE.Vector3(30,0,0), new THREE.Vector3(30,0,-30),
        ]
    const curve = new THREE.CatmullRomCurve3(pts)
    return new THREE.TubeGeometry(curve, 200, 0.2, 16, false)
  }, [])

  // 2) animate time & simple camera
  useFrame((state) => {
    matRef.current.u_time = state.clock.getElapsedTime()
    // optional: orbiting camera
    camera.position.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 40
    camera.position.z = Math.cos(state.clock.getElapsedTime() * 0.1) * 40
    camera.lookAt(0,0,0)
  })

  return (
    <mesh ref={meshRef} geometry={tubeGeo}>
      <flowMaterial ref={matRef} />
    </mesh>
  )
}

export default function TubeFlowScene() {
  return (
    <div style={{ width:'100vw', height:'100vh' }}>
        <Canvas gl={{ antialias: true }} camera={{ position: [0, 10, 50], fov: 33 }}>
            <color attach="background" args={['#101010']} />
            <ambientLight />
            <TubeFlow />
            <OrbitControls />
        </Canvas>
    </div>
  )
}
