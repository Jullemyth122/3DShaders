// BufferShaders2.jsx
import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

// Initialize the 3D noise function that will be used for turbulence
const noise3D = createNoise3D(Math.random);

// --- QUASAR PARTICLE SYSTEM ---
const AdvancedQuasar = () => {
    const mesh = useRef();

    // --- QUASAR CONFIGURATION ---
    const PARTICLE_COUNT = {
        diskSpirals: 30000,
        photonSphere: 5000,
        jets: 20000,
    };
    const totalCount = PARTICLE_COUNT.diskSpirals + PARTICLE_COUNT.photonSphere + PARTICLE_COUNT.jets;
    
    // Physical & Aesthetic Constants
    const BLACK_HOLE_RADIUS = 1.8;
    const PHOTON_SPHERE_RADIUS = BLACK_HOLE_RADIUS + 0.05;
    const DISK_RADIUS = { min: PHOTON_SPHERE_RADIUS + 0.1, max: 8.0 };
    const JET_LENGTH = 30;
    const MAX_BETA = 0.6; 
    const DOPPLER_EXPONENT = 3.5;

    // --- NEW AESTHETIC ENHANCEMENTS ---
    const SPIRAL_ARM_COUNT = 3;
    const SPIRAL_TIGHTNESS = 0.4; // Slightly tighter spirals
    // Increased puffiness for a taller, more voluminous disk
    const DISK_PUFFINESS = 0.6;   
    // Increased turbulence for more violent churning
    const TURBULENCE_INTENSITY = 0.8; 
    // How high the spiral arm "waves" are
    const SPIRAL_WAVE_HEIGHT = 0.2; 

    const { particleData } = useMemo(() => {
        // ... (Memoization for particle data generation remains structurally similar)
        const data = Array.from({ length: totalCount }, () => ({
            type: 0,
            initialPosition: new THREE.Vector3(),
            random: new THREE.Vector4(Math.random(), Math.random(), Math.random(), Math.random()), 
        }));
        let offset = 0;

        // --- 1. GENERATE SPIRAL ARM PARTICLES ---
        for (let i = 0; i < PARTICLE_COUNT.diskSpirals; i++, offset++) {
            const arm = i % SPIRAL_ARM_COUNT;
            const dist = Math.pow(Math.random(), 2) * (DISK_RADIUS.max - DISK_RADIUS.min) + DISK_RADIUS.min;
            const theta = (dist * SPIRAL_TIGHTNESS) + (arm * 2 * Math.PI / SPIRAL_ARM_COUNT);
            // Reduced random offset to make arms more defined
            const randomOffset = (Math.random() - 0.5) * (dist / DISK_RADIUS.max) * 1.5; 
            data[offset].type = 0;
            data[offset].initialPosition.set(Math.cos(theta + randomOffset) * dist, 0, Math.sin(theta + randomOffset) * dist);
            data[offset].random.x = dist;
            data[offset].random.y = theta + randomOffset;
        }
        
        // --- 2. GENERATE PHOTON SPHERE PARTICLES ---
        for (let i = 0; i < PARTICLE_COUNT.photonSphere; i++, offset++) {
            const radius = PHOTON_SPHERE_RADIUS + (Math.random() - 0.5) * 0.1;
            const theta = Math.random() * 2 * Math.PI;
            data[offset].type = 1;
            data[offset].initialPosition.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
            data[offset].random.x = radius;
            data[offset].random.y = theta;
        }

        // --- 3. GENERATE POLAR JET PARTICLES ---
        for (let i = 0; i < PARTICLE_COUNT.jets; i++, offset++) {
            const direction = i % 2 === 0 ? 1 : -1;
            const y = Math.random() * JET_LENGTH * direction;
            const radius = 0.5 * (1 - Math.abs(y) / JET_LENGTH)**0.5;
            const theta = Math.random() * Math.PI * 2;
            data[offset].type = 2;
            data[offset].initialPosition.set(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
            data[offset].random.x = direction;
            data[offset].random.y = Math.random() * JET_LENGTH;
        }

        return { particleData: data };
    }, []);

    const { positions, colors } = useMemo(() => {
        const pos = new Float32Array(totalCount * 3);
        const col = new Float32Array(totalCount * 3);
        particleData.forEach((p, i) => pos.set([p.initialPosition.x, p.initialPosition.y, p.initialPosition.z], i * 3));
        return { positions: pos, colors: col };
    }, [particleData]);


    useFrame(({ clock, camera }) => {
        if (!mesh.current) return;

        const livePositions = mesh.current.geometry.attributes.position.array;
        const liveColors = mesh.current.geometry.attributes.color.array;
        const time = clock.getElapsedTime();

        const cameraDirection = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0,0,0)).normalize();
        const viewPlane = new THREE.Plane(camera.position.clone().normalize(), 0);

        for (let i = 0; i < totalCount; i++) {
            const p = particleData[i];
            const tempColor = new THREE.Color();
            let finalPosition = new THREE.Vector3();
            
            if (p.type === 0 || p.type === 1) { // --- ACCRETION DISK & PHOTON SPHERE LOGIC ---
                const radius = p.random.x;
                let theta = p.random.y;

                const beta = MAX_BETA * Math.sqrt(PHOTON_SPHERE_RADIUS / radius);
                const angular_velocity = (beta * 0.5) / radius;
                theta += angular_velocity;
                p.random.y = theta;

                const x = Math.cos(theta) * radius;
                const z = Math.sin(theta) * radius;

                // --- ENHANCED TURBULENCE & DISK HEIGHT ---
                const noiseFrequency = 1.2;
                const noiseTime = time * 0.2;
                const turbulence = noise3D(x * noiseFrequency, z * noiseFrequency, noiseTime) * TURBULENCE_INTENSITY;
                const verticalPuffiness = DISK_PUFFINESS * Math.pow(radius / DISK_RADIUS.max, 2);
                
                // --- NEW 3D SPIRAL WAVE ---
                // Add a sine wave based on the particle's angle to create vertical ridges along the arms.
                const spiralWave = Math.sin(theta * SPIRAL_ARM_COUNT) * SPIRAL_WAVE_HEIGHT * (radius / DISK_RADIUS.max);

                const y = (turbulence * verticalPuffiness) + spiralWave;
                
                finalPosition.set(x, y, z);
                
                // Stable Gravitational Lensing (Unchanged)
                const vectorToParticle = new THREE.Vector3().subVectors(finalPosition, camera.position);
                const isBehind = vectorToParticle.dot(viewPlane.normal) > 0;
                if (isBehind) {
                    const projectedPos = new THREE.Vector3();
                    viewPlane.projectPoint(finalPosition, projectedPos);
                    const impactParameter = projectedPos.length();
                    if (impactParameter < DISK_RADIUS.max) {
                        const deflectionStrength = 1 / Math.max(1e-5, impactParameter);
                        const lenseFactor = Math.pow(deflectionStrength, 1.5) * BLACK_HOLE_RADIUS * 1.5;
                        const deflectionVector = projectedPos.normalize().multiplyScalar(lenseFactor);
                        finalPosition.add(deflectionVector);
                    }
                }

                // Relativistic Beaming & Coloring
                const velocityVector = new THREE.Vector3(-z, 0, x).normalize();
                const cosTheta = velocityVector.dot(cameraDirection);
                const gamma = 1 / Math.sqrt(1 - beta * beta);
                const delta = 1 / (gamma * (1 - beta * cosTheta));
                const brightness = Math.pow(delta, DOPPLER_EXPONENT);

                let heat, finalBrightness, saturation;
                if(p.type === 1) { // Photon Sphere
                    finalBrightness = brightness * (0.8 + Math.abs(turbulence));
                    tempColor.setHSL(0.15, 0.2, 0.7 * finalBrightness);

                } else { // Disk Spirals
                    heat = (radius - DISK_RADIUS.min) / (DISK_RADIUS.max - DISK_RADIUS.min);
                    // Make turbulence contribute more to brightness for a more fiery look
                    finalBrightness = brightness * (0.4 + Math.abs(turbulence) * 1.2); 
                    const baseHue = 0.6 - (1-heat) * 0.6;
                    const shiftedHue = baseHue - (delta - 1) * 0.1;
                    tempColor.setHSL(shiftedHue, 1.0, 0.5 * finalBrightness);
                }
            
            } else { // --- POLAR JET LOGIC (Unchanged) ---
                const direction = p.random.x;
                let lifetime = p.random.y;
                lifetime -= 0.01;
                p.random.y = lifetime;
                
                const currentPos = new THREE.Vector3(livePositions[i*3], livePositions[i*3+1], livePositions[i*3+2]);
                let y_pos = currentPos.y;

                if (lifetime < 0) {
                    y_pos = direction * Math.random() * 0.1;
                    p.random.y = Math.random() * JET_LENGTH;
                }
                finalPosition.copy(currentPos);
                finalPosition.y = y_pos + direction * 0.25;

                const energy = Math.abs(y_pos) / JET_LENGTH;
                const shockwave = Math.sin(energy * Math.PI * 5)**8;
                tempColor.setHSL(0.55 + shockwave * 0.1, 1.0, 0.5 + energy * 0.5 + shockwave * 0.8);
            }

            livePositions[i * 3 + 0] = finalPosition.x;
            livePositions[i * 3 + 1] = finalPosition.y;
            livePositions[i * 3 + 2] = finalPosition.z;

            liveColors[i * 3 + 0] = tempColor.r;
            liveColors[i * 3 + 1] = tempColor.g;
            liveColors[i * 3 + 2] = tempColor.b;
        }

        mesh.current.geometry.attributes.position.needsUpdate = true;
        mesh.current.geometry.attributes.color.needsUpdate = true;
    });

    return (
        <points ref={mesh}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={totalCount} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={totalCount} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                vertexColors
                size={0.05}
                sizeAttenuation={true}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                opacity={0.9}
                transparent={true}
            />
        </points>
    );
};

export default function BufferShaders2() {
    return (
        <div className='buffer-shader'>
            <Canvas
                gl={{ antialias: false, powerPreference: "high-performance" }}
                camera={{ position: [10, 8, 18], fov: 75 }}
            >
                <color attach="background" args={['#000001']} />
                <AdvancedQuasar />
                <OrbitControls autoRotate autoRotateSpeed={-0.15} enableZoom={true} zoomSpeed={0.5} />
            </Canvas>
        </div>
    );
}