import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { MonitoringPoint } from '@/types';
import useStore from '@/store/useStore';

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
  const highlightMonitoringId = useStore((s) => s.highlightMonitoringId);
  return (
    <group>
      {monitoringPoints.map((mp) => (
        <MonitoringPointMesh
          key={mp.id}
          point={mp}
          selected={mp.id === selectedMonitoringId}
          highlighted={mp.id === highlightMonitoringId}
          onClick={onClick}
        />
      ))}
    </group>
  );
}

function MonitoringPointMesh({
  point,
  selected,
  highlighted,
  onClick,
}: {
  point: MonitoringPoint;
  selected: boolean;
  highlighted: boolean;
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
    const basePulse = highlighted ? 1.4 : 1;
    const pulse = highlighted
      ? basePulse + 0.6 * (Math.sin(t * 8) * 0.5 + 0.5)
      : 0.8 + 0.4 * (Math.sin(t * 2.5) * 0.5 + 0.5);

    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(pulse);
    }

    if (haloRef.current && haloMaterialRef.current && (selected || highlighted)) {
      const speed = highlighted ? 8 : 3;
      const baseHalo = highlighted ? 1.6 : 1;
      const haloPulse = baseHalo + (highlighted ? 0.4 : 0.15) * Math.sin(t * speed);
      haloRef.current.scale.setScalar(haloPulse);
      const baseOpacity = highlighted ? 0.7 : 0.35;
      const amplitude = highlighted ? 0.3 : 0.15;
      const freq = highlighted ? 6 : 2;
      haloMaterialRef.current.opacity = baseOpacity + amplitude * (Math.sin(t * freq) * 0.5 + 0.5);
      haloMaterialRef.current.color.set(highlighted ? '#fde047' : '#3b82f6');
    }
  });

  const posY = point.position.y !== undefined ? Math.max(point.position.y, GROUND_Y) : GROUND_Y;

  const handleClick = (e: any) => {
    e.stopPropagation?.();
    if (onClick) {
      onClick(point.id);
    }
  };

  const sphereRadius = highlighted ? SPHERE_RADIUS * 1.6 : SPHERE_RADIUS;
  const haloRadius = highlighted ? HALO_RADIUS * 1.8 : HALO_RADIUS;
  const emissiveIntensity = highlighted ? 1.6 : 0.5;

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
        <sphereGeometry args={[sphereRadius, 24, 24]} />
        <meshStandardMaterial
          color={highlighted ? '#facc15' : colorConfig.color}
          emissive={highlighted ? '#eab308' : colorConfig.emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {(selected || highlighted) && (
        <mesh ref={haloRef}>
          <sphereGeometry args={[haloRadius, 24, 24]} />
          <meshBasicMaterial
            ref={haloMaterialRef}
            color={highlighted ? '#fde047' : '#3b82f6'}
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
            background: highlighted
              ? 'rgba(234, 179, 8, 0.95)'
              : selected
                ? 'rgba(37, 99, 235, 0.9)'
                : 'rgba(15, 23, 42, 0.85)',
            color: highlighted ? '#1f2937' : '#e2e8f0',
            padding: highlighted ? '6px 12px' : '4px 10px',
            borderRadius: '6px',
            fontSize: highlighted ? '13px' : '11px',
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
            border: highlighted
              ? '2px solid rgba(253, 224, 71, 1)'
              : selected
                ? '1px solid rgba(96, 165, 250, 0.6)'
                : '1px solid rgba(148, 163, 184, 0.3)',
            textAlign: 'center',
            boxShadow: highlighted
              ? '0 0 24px rgba(250, 204, 21, 0.9), 0 4px 12px rgba(0,0,0,0.3)'
              : selected
                ? '0 0 12px rgba(59, 130, 246, 0.5)'
                : 'none',
            transform: highlighted ? 'scale(1.25)' : 'scale(1)',
            transformOrigin: 'center bottom',
            fontWeight: highlighted ? 800 : 400,
          }}
        >
          {highlighted && (
            <div style={{ fontSize: '10px', marginBottom: '2px', color: '#92400e' }}>
              🔍 定位中
            </div>
          )}
          <div style={{ fontWeight: 700, color: highlighted ? '#422006' : selected ? '#bfdbfe' : '#cbd5e1' }}>
            {point.code}
          </div>
          <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span
              style={{
                display: 'inline-block',
                width: highlighted ? '10px' : '8px',
                height: highlighted ? '10px' : '8px',
                borderRadius: '50%',
                backgroundColor: highlighted ? '#f97316' : colorConfig.color,
                boxShadow: `0 0 6px ${highlighted ? '#ea580c' : colorConfig.emissive}`,
              }}
            />
            <span>
              <span style={{ fontWeight: 700, color: highlighted ? '#b91c1c' : point.status === 'danger' ? '#fca5a5' : point.status === 'warning' ? '#fdba74' : '#86efac' }}>
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
