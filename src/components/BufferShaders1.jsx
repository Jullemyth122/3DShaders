// BufferShaders1.jsx
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function randInRange([min, max]) {
  return min + Math.random() * (max - min);
}

function randPointInDisk(radius) {
    const r = Math.sqrt(Math.random()) * radius;
    const theta = Math.random() * 2 * Math.PI;
    return {
        x: r * Math.cos(theta),
        z: r * Math.sin(theta)
    };
}

const BufferScene = () => {
  const mesh = useRef();
  // Increased totalCount for a much denser and larger structure
  const totalCount = 150000;

  const holeConfig = useMemo(() => ({
    // Increased hole count to match the larger volume
    count: 150,
    minRadius: 0.3,
    maxRadius: 0.8,
  }), []);

  // Increased the number of intervals for a much taller structure
  const intervals = useMemo(() => ([
    [-5.0, -4.0],
    [-3.5, -2.5],
    [-2.0, -1.0],
    [-0.5,  0.5],
    [ 1.0,  2.0],
    [ 2.5,  3.5],
    [ 4.0,  5.0],
  ]), []);


  const { positions, yMin, yRange } = useMemo(() => {
    const pos = new Float32Array(totalCount * 3);
    let minY = Infinity, maxY = -Infinity;

    // --- Generate specifications for each CYLINDRICAL hole ---
    const holes = [];
    const maxRadiusForHoles = 1 + (intervals.length - 1) * 0.5;

    for (let i = 0; i < holeConfig.count; i++) {
        const centerDiskPos = randPointInDisk(maxRadiusForHoles);
        const radius = randInRange([holeConfig.minRadius, holeConfig.maxRadius]);
        const assignedInterval = intervals[Math.floor(Math.random() * intervals.length)];
        
        holes.push({
            cx: centerDiskPos.x,
            cz: centerDiskPos.z,
            radius: radius,
            y_start: assignedInterval[0],
            y_end: assignedInterval[1],
        });
    }
    // ----------------------------------------------------

    const layers = intervals.length;

    for (let i = 0; i < totalCount; i++) {
        let candidatePoint;
        let isInsideHole = true;
        
        while (isInsideHole) {
            // Generate a random point anywhere in the overall volume
            const conceptualLayer = Math.floor(Math.random() * layers);
            const radius = 1 + conceptualLayer * 0.5;
            const r = Math.sqrt(Math.random()) * radius;
            const θ = Math.random() * Math.PI * 2;
            
            candidatePoint = {
                x: Math.cos(θ) * r,
                z: Math.sin(θ) * r,
                y: randInRange(intervals[conceptualLayer]),
            };

            // --- Cylindrical Check ---
            isInsideHole = false;
            for (const hole of holes) {
                if (candidatePoint.y >= hole.y_start && candidatePoint.y <= hole.y_end) {
                    const dx = candidatePoint.x - hole.cx;
                    const dz = candidatePoint.z - hole.cz;
                    const distanceSqXZ = dx * dx + dz * dz;

                    if (distanceSqXZ < hole.radius * hole.radius) {
                        isInsideHole = true;
                        break;
                    }
                }
            }
        } 

        pos[i*3+0] = candidatePoint.x;
        pos[i*3+1] = candidatePoint.y;
        pos[i*3+2] = candidatePoint.z;

        minY = Math.min(minY, candidatePoint.y);
        maxY = Math.max(maxY, candidatePoint.y);
    }

    return {
      positions: pos,
      yMin:      minY,
      yRange:    maxY - minY || 1
    };
  }, [totalCount, intervals, holeConfig]);

  // The rest of the component is the same
  const colors = useMemo(() => {
    const col = new Float32Array(totalCount * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < totalCount; i++) {
        const y = positions[i*3+1];
        const t = (y - yMin) / yRange;
        tmp.setHSL(
            220/360 + t * ((60/360) - (220/360)),
            1,
            0.15 + t * (0.50 - 0.15)
        );
        col[i*3+0] = tmp.r;
        col[i*3+1] = tmp.g;
        col[i*3+2] = tmp.b;
    }
    return col;
  }, [positions, yMin, yRange, totalCount]);

  const colorsRef = useRef(colors);

  useFrame(({ clock }) => {
    const offset = (clock.getElapsedTime() * 0.2) % 1;
    const posArr = mesh.current.geometry.attributes.position.array;
    const colArr = mesh.current.geometry.attributes.color.array;
    const tmp    = new THREE.Color();

    for (let i = 0; i < totalCount; i++) {
        const y     = posArr[i*3+1];
        const baseT = (y - yMin) / yRange;
        const t     = (baseT + offset) % 1;
        tmp.setHSL(
            220/360 + t * ((60/360) - (220/360)),
            1,
            0.15 + t * (0.50 - 0.15)
        );
        colArr[i*3+0] = tmp.r;
        colArr[i*3+1] = tmp.g;
        colArr[i*3+2] = tmp.b;
    }
    mesh.current.geometry.attributes.color.needsUpdate = true;
    const dt = clock.getDelta();
    mesh.current.rotation.y += dt * 0.1;
    mesh.current.rotation.z += dt * 0.05;
  });

  return (
    <points ref={mesh}>
        <bufferGeometry>
            <bufferAttribute
                attach="attributes-position"
                count={totalCount}
                array={positions}
                itemSize={3}
            />
            <bufferAttribute
                attach="attributes-color"
                count={totalCount}
                array={colorsRef.current}
                itemSize={3}
            />
        </bufferGeometry>
        <pointsMaterial
            vertexColors
            size={0.075} // Slightly increased size for visibility in the larger scene
            sizeAttenuation
            depthWrite={true}
        />
    </points>
  );
};

export default function BufferShaders1() {
  return (
    <div className='buffer-shader'>
        <Canvas
            gl={{ antialias: true }}
            // Adjusted camera for a better view of the taller object
            camera={{ position: [0, 6, 20], fov: 50 }}
        >
            <color attach="background" args={['#101010']} />
            <BufferScene />
            <OrbitControls />
        </Canvas>
    </div>
  );
}