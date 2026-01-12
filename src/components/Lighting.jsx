export function Lighting() {
  return (
    <>
      {/* Direct Light - Sun-like illumination */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Ambient Light - Global illumination */}
      <ambientLight intensity={0.9} />
    </>
  );
}
