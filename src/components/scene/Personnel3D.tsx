import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Worker, JobType } from '@/types';
import * as THREE from 'three';

interface Personnel3DProps {
  workers: Worker[];
}

const jobColors: Record<JobType, string> = {
  '盾构司机': '#3b82f6',
  '注浆工': '#f97316',
  '管片拼装工': '#22c55e',
  '测量员': '#a855f7',
  '安全员': '#ef4444',
  '电工': '#eab308',
};

const jobBgColors: Record<JobType, string> = {
  '盾构司机': 'rgba(59,130,246,0.9)',
  '注浆工': 'rgba(249,115,22,0.9)',
  '管片拼装工': 'rgba(34,197,94,0.9)',
  '测量员': 'rgba(168,85,247,0.9)',
  '安全员': 'rgba(239,68,68,0.9)',
  '电工': 'rgba(234,179,8,0.9)',
};

const Personnel3D = ({ workers }: Personnel3DProps) => {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {workers.map((worker) => (
        <WorkerMesh key={worker.id} worker={worker} />
      ))}
    </group>
  );
};

interface WorkerMeshProps {
  worker: Worker;
}

const WorkerMesh = ({ worker }: WorkerMeshProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const overtimeRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const feetRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => jobColors[worker.jobType], [worker.jobType]);
  const bgColor = useMemo(() => jobBgColors[worker.jobType], [worker.jobType]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (worker.status === 'overtime') {
      const pulse = (Math.sin(t * 3) + 1) / 2;
      const emissiveIntensity = 0.3 + pulse * 0.7;
      if (headRef.current) {
        (headRef.current.material as THREE.MeshStandardMaterial).emissive.set('#ff0000');
        (headRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
      }
      if (bodyRef.current) {
        (bodyRef.current.material as THREE.MeshStandardMaterial).emissive.set('#ff0000');
        (bodyRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
      }
      if (feetRef.current) {
        (feetRef.current.material as THREE.MeshStandardMaterial).emissive.set('#ff0000');
        (feetRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = emissiveIntensity;
      }
      if (overtimeRef.current) {
        overtimeRef.current.position.y = Math.sin(t * 2) * 0.05;
      }
    }
  });

  return (
    <group position={[worker.position.x, worker.position.y, worker.position.z]}>
      <group ref={overtimeRef}>
        <group ref={groupRef}>
          <mesh ref={headRef} position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>

          <mesh ref={bodyRef} position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>

          <mesh ref={feetRef} position={[0, -0.18, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.25]} />
            <meshStandardMaterial color={'#1f2937'} />
          </mesh>
        </group>

        <Html
          position={[0, 0.95, 0]}
          center
          distanceFactor={15}
          zIndexRange={[10, 0]}
        >
          <div
            style={{
              background: bgColor,
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1.3,
            }}
          >
            <span style={{ fontSize: '11px' }}>{worker.name}</span>
            <span style={{ fontSize: '9px', opacity: 0.9 }}>{worker.jobType}</span>
          </div>
        </Html>
      </group>

      {worker.area === '密闭舱室' && (
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color={'#ef4444'}
            transparent
            opacity={0.15}
            emissive={'#ef4444'}
            emissiveIntensity={0.2}
          />
        </mesh>
      )}
    </group>
  );
};

export default Personnel3D;
