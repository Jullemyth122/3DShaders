const BufferScene = ({ gapFactor, spacingMultiplier, freqMultiplier = 2 }) => {
    const pointsRef = useRef();
    const particleCount = 100000;

    // Build positions once
    const { positions, finalCount, spacing, max_,pos, colors } = useMemo(() => {
        const resol = Math.max(2, Math.round(Math.cbrt(particleCount)));
        const spacingVal = (2 / resol) * spacingMultiplier;

        const posArr = [], colArr = [];
        const midpoint = (resol - 1) / 2;
        const maxPosition = midpoint * spacingVal;
        const gapThreshold = (resol * gapFactor) / 2;

        for (let z = 0; z < resol; z++) {
            for (let y = 0; y < resol; y++) {
                for (let x = 0; x < resol; x++) {
                    const isGapX = Math.abs(x - midpoint) < gapThreshold;
                    const isGapY = Math.abs(y - midpoint) < gapThreshold;
                    const isGapZ = Math.abs(z - midpoint) < gapThreshold;
                    if (isGapX && isGapY && isGapZ) continue;

                    const px = (x - midpoint) * spacingVal;
                    const py = (y - midpoint) * spacingVal;
                    const pz = (z - midpoint) * spacingVal;

                    posArr.push(px, py, pz);

                    const r = 1.0, g = 1.0, b = 1.0;

                    const a = Math.max(0, Math.abs(1.0 - Math.hypot(px, py ,pz))); 
                    
                    colArr.push(r,g,b, a)

                    

                }
            }
        }

        return {
            positions: new Float32Array(posArr),
            colors: new Float32Array(colArr),
            finalCount: posArr.length / 3,
            spacing: spacingVal,
            max_pos: maxPosition,
        };
    }, [gapFactor, spacingMultiplier, particleCount]);

    // // Colors buffer (RGBA per particle) - faint background
    // const colors = useMemo(() => {
    //     const arr = new Float32Array(finalCount * 4);
    //     for (let i = 0; i < finalCount; i++) {

    //         if ()
    //         arr[i * 4 + 0] = 1.0;
    //         arr[i * 4 + 1] = 1.0;
    //         arr[i * 4 + 2] = 1.0;
    //         arr[i * 4 + 3] = 0.015;
    //     }
    //     return arr;
    // }, [finalCount]);

    return (
        <points ref={pointsRef}>
            <bufferGeometry key={`${gapFactor}-${spacingMultiplier}`}>
                <bufferAttribute
                attach="attributes-position"
                count={finalCount}
                array={positions}
                itemSize={3}
                />
                <bufferAttribute
                attach="attributes-color"
                count={finalCount}
                array={colors}
                itemSize={4}
                />
            </bufferGeometry>

            <pointsMaterial
                vertexColors
                size={0.025}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                transparent={true}
            />
        </points>
    );
};

// Main component (UI unchanged)
const BufferShaders4_9 = () => {
  const [gapFactor, setGapFactor] = useState(0.0);
  const [spacingMultiplier, setSpacingMultiplier] = useState(1.0);

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#111', position: 'relative' }}>

        <Canvas gl={{ antialias: true }} dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 75 }}>
            <color attach="background" args={['#111']} />
            <BufferScene gapFactor={gapFactor} spacingMultiplier={spacingMultiplier} />
            <OrbitControls />
        </Canvas>
    </div>
  );
};

export default BufferShaders4_9;
