// BufferShadersLines.jsx
import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls, shaderMaterial } from '@react-three/drei'


const LinePulseMaterial = shaderMaterial(
    {
        u_time:      0,
        u_maxPoints: 0.0,
        u_amp:       0.1    // vibration amplitude
    },
    // ——— Vertex Shader ———
    /*glsl*/`
        attribute float aIndex;
        uniform float u_maxPoints;
        uniform float u_time;
        uniform float u_amp;

        varying float v_progress;
        varying vec3  v_color;

        void main() {
        v_color    = color;
        v_progress = aIndex / u_maxPoints;

        // compute a small vibration offset:
        float vib = sin(u_time * 20.0 + v_progress * 50.0) * u_amp;

        // push each vertex radially outward from the origin by 'vib'
        vec3 displaced = position + normalize(position) * vib;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
        }
    `,
    // ——— Fragment Shader (unchanged) ———
    /*glsl*/`
        precision highp float;
        uniform float u_time;
        varying float v_progress;
        varying vec3  v_color;

        void main() {
        float pulse = sin(v_progress * 20.0 - u_time * 3.0);
        pulse = smoothstep(0.4, 0.5, pulse);

        float glow = sin(v_progress * 10.0 - u_time * 1.5);
        glow = smoothstep(0.7, 0.9, glow) * 0.3;

        vec3 col = v_color * (1.0 + pulse + glow);
        gl_FragColor = vec4(col, 1.0);
        }
    `
);
extend({ LinePulseMaterial });


function LinesShadered() {
  const refLine     = useRef()
  const matRef      = useRef()
  const { camera, size } = useThree()
  const [drawCount, setDrawCount] = useState(0)

  // Build positions, colors and our index buffer once
  const { positions, colors, indices, maxPoints } = useMemo(() => {
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
    const count = raw.length
    const pos   = new Float32Array(count * 3)
    const col   = new Float32Array(count * 3)
    const idx   = new Float32Array(count)
    const tmp   = new THREE.Color()
    raw.forEach((p,i) => {
      pos.set([p.x,p.y,p.z], i*3)
      // HSL gradient
      const t = i / (count - 1)
      tmp.setHSL(0.6, 1, 0.5 + 0.5*t)
      col.set([tmp.r,tmp.g,tmp.b], i*3)
      idx[i] = i
    })
    return { positions: pos, colors: col, indices: idx, maxPoints: count }
  }, [])

  // init drawRange
  useEffect(() => {
    refLine.current.geometry.setDrawRange(0, 0)
  }, [])

  // animate drawRange & shader time
  useFrame((state, delta) => {
    // grow the line
    if (drawCount < maxPoints) {
      setDrawCount(c => Math.min(c + 30*delta, maxPoints))
      refLine.current.geometry.setDrawRange(0, Math.floor(drawCount))
    }
    // pass time uniform
    matRef.current.u_time = state.clock.getElapsedTime()

    // smooth camera follow
    const ease = 0.05
    camera.position.x += (pointer.x * 0.05 - camera.position.x) * ease
    camera.position.y += (-pointer.y * 0.05 - camera.position.y) * ease
    camera.lookAt(0,0,0)
  })

  // pointer tracking for camera
  const pointer = useRef({ x: 0, y: 0 }).current
  useEffect(() => {
    const onMove = e => {
      pointer.x = e.clientX - size.width/2
      pointer.y = e.clientY - size.height/2
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [size])

  return (
    <line ref={refLine} scale={[0.45,0.45,0.45]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          itemSize={3}
          count={maxPoints}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          itemSize={3}
          count={maxPoints}
        />
        <bufferAttribute
          attach="attributes-aIndex"
          array={indices}
          itemSize={1}
          count={maxPoints}
        />
      </bufferGeometry>
      <linePulseMaterial
        ref={matRef}
        u_maxPoints={maxPoints}
        vertexColors
        linewidth={2}       // note: wide lines require special support (may not work everywhere)
      />
    </line>
  )
}

export default function LineShaders1() {
  return (
    <div style={{ width:'100vw', height:'100vh' }}>
      <Canvas camera={{ position:[0,10,50], fov:33, near:1, far:10000 }} gl={{ antialias:true }}>
        <color attach="background" args={['#101010']} />
        <ambientLight />
        <LinesShadered />
        <OrbitControls />
      </Canvas>
    </div>
  )
}
