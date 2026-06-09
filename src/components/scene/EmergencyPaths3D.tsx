import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CatmullRomLine } from '@react-three/drei';
import type { EmergencyEvent } from '@/types';
import * as THREE from 'three';

interface EmergencyPaths3DProps {
  emergencyEvent: EmergencyEvent | null;
}

const EmergencyPaths3D = ({ emergencyEvent }: EmergencyPaths3DProps) => {
  if (!emergencyEvent) return null;

  return (
    <group>
      {emergencyEvent.evacuatePath && emergencyEvent.evacuatePath.length >= 2 && (
        <EvacuatePath points={emergencyEvent.evacuatePath} />
      )}
      {emergencyEvent.rescuePath && emergencyEvent.rescuePath.length >= 2 && (
        <RescuePath points={emergencyEvent.rescuePath} />
      )}
    </group>
  );
};

interface PathProps {
  points: { x: number; y: number; z: number }[];
}

const EvacuatePath = ({ points }: PathProps) => {
  const lineRef = useRef<any>(null);

  const raisedPoints = useMemo(
    () => points.map((p) => new THREE.Vector3(p.x, p.y + 0.3, p.z)),
    [points]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (lineRef.current && lineRef.current.material) {
      lineRef.current.material.dashOffset = -t * 0.5;
    }
  });

  const startPoint = raisedPoints[0];
  const endPoint = raisedPoints[raisedPoints.length - 1];

  return (
    <group>
      <CatmullRomLine
        ref={lineRef}
        points={raisedPoints as any}
        curveType="catmullrom"
        tension={0.5}
        lineWidth={2}
        color="#22c55e"
        dashed
        dashSize={0.3}
        gapSize={0.2}
        transparent
        opacity={0.9}
      />

      <mesh position={[startPoint.x, startPoint.y + 0.15, startPoint.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
      </mesh>

      <mesh position={[endPoint.x, endPoint.y + 0.15, endPoint.z]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};

const RescuePath = ({ points }: PathProps) => {
  const lineRef = useRef<any>(null);
  const startConeRef = useRef<THREE.Mesh>(null);
  const endConeRef = useRef<THREE.Mesh>(null);

  const raisedPoints = useMemo(
    () => points.map((p) => new THREE.Vector3(p.x, p.y + 0.3, p.z)),
    [points]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 0.5 + (Math.sin(t * 2) + 1) / 2 * 0.5;
    if (lineRef.current && lineRef.current.material) {
      lineRef.current.material.opacity = pulse;
    }
    if (startConeRef.current) {
      (startConeRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
    }
    if (endConeRef.current) {
      (endConeRef.current.material as THREE.MeshStandardMaterial).opacity = pulse;
    }
  });

  const startPoint = raisedPoints[0];
  const endPoint = raisedPoints[raisedPoints.length - 1];

  return (
    <group>
      <CatmullRomLine
        ref={lineRef}
        points={raisedPoints as any}
        curveType="catmullrom"
        tension={0.5}
        lineWidth={2}
        color="#3b82f6"
        transparent
        opacity={0.75}
      />

      <mesh
        ref={startConeRef}
        position={[startPoint.x, startPoint.y + 0.15, startPoint.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.5}
          transparent
        />
      </mesh>

      <mesh
        ref={endConeRef}
        position={[endPoint.x, endPoint.y + 0.15, endPoint.z]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial
          color="#1d4ed8"
          emissive="#1d4ed8"
          emissiveIntensity={0.5}
          transparent
        />
      </mesh>
    </group>
  );
};

export default EmergencyPaths3D;
