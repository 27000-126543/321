import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { MonitoringPoint } from '@/types';

interface MonitoringPoints3DProps {
  monitoringPoints: MonitoringPoint[];
  selectedMonitoringId?: string;
  onClick?: (id: string) => void;
}

const SPHERE_RADIUS = 0.25;
const GROUND_Y = 0.5;
const HALO_RADIUS = 0.55;

export default function MonitoringPoints3D({
  monitoringPoints,
  selectedMonitoringId,
  onClick,
}: MonitoringPoints3DProps) {
  return (
    <group>
      {monitoringPoints.map((mp) => (
        <MonitoringPointMesh
          key={mp.id}
          point={mp}
          selected={mp.id === selectedMonitoringId}
          onClick={onClick}
        />
      ))}
    </group>
  );
}

function MonitoringPointMesh({
  point,
  selected,
  onClick,
}: {
  point: MonitoringPoint;
  selected: boolean;
  onClick?: (id: string) => void;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const colorConfig = useMemo(() => {
    switch (point.status) {
      case 'normal':
        return { color: '#22c55e', emissive: '#16a34a' };
      case 'warning':
        return { color: '#f97316', emissive: '#ea580c' };
      case 'danger':
        return { color: '#ef4444', emissive: '#dc2626' };
      default:
        return { color: '#22c55e', emissive: '#16a34a' };
    }
  }, [point.status]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.8 + 0.4 * (Math.sin(t * 2.5) * 0.5 + 0.5);

    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(pulse);
    }

    if (haloRef.current && haloMaterialRef.current && selected) {
      const haloPulse = 1 + 0.15 * Math.sin(t * 3);
      haloRef.current.scale.setScalar(haloPulse);
      haloMaterialRef.current.opacity = 0.35 + 0.15 * (Math.sin(t * 2) * 0.5 + 0.5);
    }
  });

  const posY = point.position.y !== undefined ? Math.max(point.position.y, GROUND_Y) : GROUND_Y;

  const handleClick = (e: any) => {
    e.stopPropagation?.();
    if (onClick) {
      onClick(point.id);
    }
  };

  return (
    <group position={[point.position.x, posY, point.position.z]}>
      <mesh
        ref={sphereRef}
        onClick={handleClick}
        onPointerOver={(e: any) => {
          e.stopPropagation?.();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[SPHERE_RADIUS, 24, 24]} />
        <meshStandardMaterial
          color={colorConfig.color}
          emissive={colorConfig.emissive}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {selected && (
        <mesh ref={haloRef}>
          <sphereGeometry args={[HALO_RADIUS, 24, 24]} />
          <meshBasicMaterial
            ref={haloMaterialRef}
            color="#3b82f6"
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      )}

      <Html
        position={[0, SPHERE_RADIUS + 0.45, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: selected ? 'rgba(37, 99, 235, 0.9)' : 'rgba(15, 23, 42, 0.85)',
            color: '#e2e8f0',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
            border: selected ? '1px solid rgba(96, 165, 250, 0.6)' : '1px solid rgba(148, 163, 184, 0.3)',
            textAlign: 'center',
            boxShadow: selected ? '0 0 12px rgba(59, 130, 246, 0.5)' : 'none',
          }}
        >
          <div style={{ fontWeight: 700, color: selected ? '#bfdbfe' : '#cbd5e1' }}>
            {point.code}
          </div>
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: colorConfig.color,
                boxShadow: `0 0 6px ${colorConfig.emissive}`,
              }}
            />
            <span>
              <span style={{ fontWeight: 700, color: point.status === 'danger' ? '#fca5a5' : point.status === 'warning' ? '#fdba74' : '#86efac' }}>
                {point.currentValue.toFixed(1)}
              </span>
              <span style={{ color: '#94a3b8', marginLeft: '2px' }}>mm</span>
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}
