import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Segment } from '@/types';

interface SegmentYard3DProps {
  segments: Segment[];
}

const SEG_RADIUS = 1.8;
const SEG_HEIGHT = 0.3;
const COL_SPACING = 4.2;
const ROW_SPACING = 4.2;
const LAYER_SPACING = 0.45;
const YARD_CENTER_X = 18;
const COLS = 6;
const ROWS = 3;
const LAYERS = 3;

export default function SegmentYard3D({ segments }: SegmentYard3DProps) {
  const groundWidth = COLS * COL_SPACING + 3;
  const groundDepth = ROWS * ROW_SPACING + 3;
  const yardStartX = YARD_CENTER_X - (COLS - 1) * COL_SPACING / 2;
  const yardStartZ = -(ROWS - 1) * ROW_SPACING / 2;
  const frameHeight = LAYERS * LAYER_SPACING + 1.5;
  const frameThickness = 0.12;

  const framePoles = useMemo(() => {
    const poles: { position: [number, number, number]; size: [number, number, number] }[] = [];
    const xs = [yardStartX - COL_SPACING / 2 - 0.3, yardStartX + (COLS - 1) * COL_SPACING + COL_SPACING / 2 + 0.3];
    const zs = [yardStartZ - ROW_SPACING / 2 - 0.3, yardStartZ + (ROWS - 1) * ROW_SPACING + ROW_SPACING / 2 + 0.3];
    xs.forEach((x) => {
      zs.forEach((z) => {
        poles.push({
          position: [x, frameHeight / 2, z],
          size: [frameThickness, frameHeight, frameThickness],
        });
      });
    });
    return poles;
  }, [yardStartX, yardStartZ, frameHeight]);

  const frameBeams = useMemo(() => {
    const beams: { position: [number, number, number]; size: [number, number, number] }[] = [];
    const xMin = yardStartX - COL_SPACING / 2 - 0.3;
    const xMax = yardStartX + (COLS - 1) * COL_SPACING + COL_SPACING / 2 + 0.3;
    const zMin = yardStartZ - ROW_SPACING / 2 - 0.3;
    const zMax = yardStartZ + (ROWS - 1) * ROW_SPACING + ROW_SPACING / 2 + 0.3;
    const yTop = frameHeight;
    const yBottom = 0;
    beams.push({ position: [(xMin + xMax) / 2, yBottom, zMin], size: [xMax - xMin, frameThickness, frameThickness] });
    beams.push({ position: [(xMin + xMax) / 2, yBottom, zMax], size: [xMax - xMin, frameThickness, frameThickness] });
    beams.push({ position: [xMin, yBottom, (zMin + zMax) / 2], size: [frameThickness, frameThickness, zMax - zMin] });
    beams.push({ position: [xMax, yBottom, (zMin + zMax) / 2], size: [frameThickness, frameThickness, zMax - zMin] });
    beams.push({ position: [(xMin + xMax) / 2, yTop, zMin], size: [xMax - xMin, frameThickness, frameThickness] });
    beams.push({ position: [(xMin + xMax) / 2, yTop, zMax], size: [xMax - xMin, frameThickness, frameThickness] });
    beams.push({ position: [xMin, yTop, (zMin + zMax) / 2], size: [frameThickness, frameThickness, zMax - zMin] });
    beams.push({ position: [xMax, yTop, (zMin + zMax) / 2], size: [frameThickness, frameThickness, zMax - zMin] });
    return beams;
  }, [yardStartX, yardStartZ, frameHeight]);

  return (
    <group>
      <mesh position={[YARD_CENTER_X, -0.1, 0]} receiveShadow>
        <boxGeometry args={[groundWidth, 0.2, groundDepth]} />
        <meshStandardMaterial color="#3a3f47" roughness={0.9} />
      </mesh>

      {framePoles.map((pole, i) => (
        <mesh key={`pole-${i}`} position={pole.position}>
          <boxGeometry args={pole.size} />
          <meshStandardMaterial color="#5a5f67" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {frameBeams.map((beam, i) => (
        <mesh key={`beam-${i}`} position={beam.position}>
          <boxGeometry args={beam.size} />
          <meshStandardMaterial color="#5a5f67" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {segments.map((seg) => (
        <SegmentMesh key={seg.id} segment={seg} startX={yardStartX} startZ={yardStartZ} />
      ))}
    </group>
  );
}

function SegmentMesh({
  segment,
  startX,
  startZ,
}: {
  segment: Segment;
  startX: number;
  startZ: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const { row, col, layer } = segment.position;
  const x = startX + col * COL_SPACING;
  const z = startZ + row * ROW_SPACING;
  const y = layer * LAYER_SPACING + SEG_HEIGHT / 2;

  const colorConfig = useMemo(() => {
    switch (segment.status) {
      case 'normal':
        return { color: '#6b7a85', emissive: '#000000', pulse: false, speed: 1 };
      case 'low':
        return { color: '#ff8c3a', emissive: '#ff6600', pulse: true, speed: 1 };
      case 'critical':
        return { color: '#ff5a2a', emissive: '#ff3300', pulse: true, speed: 2.5 };
      default:
        return { color: '#6b7a85', emissive: '#000000', pulse: false, speed: 1 };
    }
  }, [segment.status]);

  useFrame((state) => {
    if (materialRef.current && colorConfig.pulse) {
      const t = state.clock.elapsedTime * colorConfig.speed;
      materialRef.current.emissiveIntensity = 0.2 + 0.4 * (Math.sin(t * 3) * 0.5 + 0.5);
    }
  });

  return (
    <group position={[x, y, z]}>
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[SEG_RADIUS, SEG_RADIUS, SEG_HEIGHT, 32]} />
        <meshStandardMaterial
          ref={materialRef}
          color={colorConfig.color}
          emissive={colorConfig.emissive}
          emissiveIntensity={colorConfig.pulse ? 0.2 : 0}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      <Html
        position={[0, SEG_HEIGHT / 2 + 0.3, 0]}
        center
        distanceFactor={12}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#e2e8f0',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontWeight: 600, color: segment.status === 'normal' ? '#94a3b8' : segment.status === 'low' ? '#fb923c' : '#f87171' }}>
            {segment.spec}
          </div>
          <div style={{ marginTop: '2px' }}>
            库存: <span style={{ fontWeight: 700, color: segment.status === 'critical' ? '#ef4444' : '#fbbf24' }}>{segment.quantity}</span>
            <span style={{ color: '#64748b' }}> / 安全{segment.safeStock}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}
