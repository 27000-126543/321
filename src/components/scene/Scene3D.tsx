import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Suspense, useEffect } from 'react';
import useStore from '@/store/useStore';
import ShieldMachine3D from '@/components/scene/ShieldMachine3D';
import StationPit3D from '@/components/scene/StationPit3D';
import SegmentYard3D from '@/components/scene/SegmentYard3D';
import MonitoringPoints3D from '@/components/scene/MonitoringPoints3D';
import Personnel3D from '@/components/scene/Personnel3D';
import EmergencyPaths3D from '@/components/scene/EmergencyPaths3D';
import ControlCenter3D from '@/components/scene/ControlCenter3D';

function SceneLights() {
  return (
    <>
      <hemisphereLight args={['#6ab7ff', '#1a1a2e', 0.4]} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={0.8}
        color="#fff8e7"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 5, -8]} intensity={1.5} color="#ffd89b" distance={25} />
      <pointLight position={[0, 5, 8]} intensity={1.2} color="#ffd89b" distance={25} />
      <pointLight position={[-18, 3, 0]} intensity={0.8} color="#87ceeb" distance={20} />
      <pointLight position={[18, 3, 0]} intensity={0.8} color="#87ceeb" distance={20} />
      <pointLight position={[0, 5, 18]} intensity={1.5} color="#4da6ff" distance={15} />
      <ambientLight intensity={0.15} />
    </>
  );
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0a1628" roughness={0.9} metalness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#1a2744" roughness={0.8} metalness={0.2} />
      </mesh>
      <gridHelper args={[80, 40, 'rgba(24,144,255,0.08)', 'rgba(24,144,255,0.04)']} position={[0, 0.001, 0]} />

      <mesh position={[0, -4, -8]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.3, 8, 48, Math.PI * 2]} />
        <meshStandardMaterial color="#5a6878" roughness={0.7} metalness={0.3} />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={`lt-${i}`} position={[0, -4, -8 - (i + 1) * 2.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3, 0.25, 6, 48]} />
          <meshStandardMaterial color={i % 2 ? '#4a5868' : '#5a6878'} roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, -4, 8]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3, 0.3, 8, 48]} />
        <meshStandardMaterial color="#5a6878" roughness={0.7} metalness={0.3} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={`rt-${i}`} position={[0, -4, 8 + (i + 1) * 2.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3, 0.25, 6, 48]} />
          <meshStandardMaterial color={i % 2 ? '#4a5868' : '#5a6878'} roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
    </>
  );
}

function FogController() {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog('#0a1628', 30, 90);
    return () => { scene.fog = null; };
  }, [scene]);
  return null;
}

export default function Scene3D() {
  const {
    shields, monitoringPoints, segments, workers, stationNodes, emergencyEvent,
    selectedShieldId, selectedMonitoringId,
    setSelectedShield, setSelectedMonitoring,
    updateShieldParams, updateMonitoring, updateWorkers,
    generatePurchasePlanIfNeeded, generateMaintenanceOrderIfNeeded,
    checkOvertimePersonnel, checkDelayedNodes,
  } = useStore();

  useEffect(() => {
    const t1 = setInterval(updateShieldParams, 2500);
    const t2 = setInterval(updateMonitoring, 10000);
    const t3 = setInterval(updateWorkers, 5000);
    const t4 = setInterval(generatePurchasePlanIfNeeded, 30000);
    const t5 = setInterval(generateMaintenanceOrderIfNeeded, 60000);
    const t6 = setInterval(checkOvertimePersonnel, 15000);
    const t7 = setInterval(checkDelayedNodes, 45000);
    return () => {
      clearInterval(t1); clearInterval(t2); clearInterval(t3);
      clearInterval(t4); clearInterval(t5); clearInterval(t6); clearInterval(t7);
    };
  }, []);

  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }} style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0f2744 50%, #0a1628 100%)' }}>
      <PerspectiveCamera makeDefault position={[35, 28, 35]} fov={50} near={0.1} far={500} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, -2, 0]}
      />
      <FogController />
      <Suspense fallback={null}>
        <Stars radius={120} depth={60} count={1500} factor={3} fade speed={0.5} />
        <SceneLights />
        <Ground />
        <ControlCenter3D />
        <StationPit3D stationNodes={stationNodes} />
        <SegmentYard3D segments={segments} />
        {shields.map((s) => (
          <ShieldMachine3D
            key={s.id}
            shield={s}
            selectedShieldId={selectedShieldId}
            onClick={(id) => setSelectedShield(selectedShieldId === id ? null : id)}
          />
        ))}
        <MonitoringPoints3D
          monitoringPoints={monitoringPoints}
          selectedMonitoringId={selectedMonitoringId}
          onClick={(id) => setSelectedMonitoring(selectedMonitoringId === id ? null : id)}
        />
        <Personnel3D workers={workers} />
        <EmergencyPaths3D emergencyEvent={emergencyEvent} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.6} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
