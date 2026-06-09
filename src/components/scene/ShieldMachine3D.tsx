import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Edges } from '@react-three/drei';
import * as THREE from 'three';

import type { ShieldMachine } from '@/types';

interface ShieldMachine3DProps {
  shield: ShieldMachine;
  selectedShieldId: string | null;
  onClick: (id: string) => void;
}

export default function ShieldMachine3D({
  shield,
  selectedShieldId,
  onClick,
}: ShieldMachine3DProps) {
  const { id, code, name, position, rotation, status, thrustSpeed, cutterTorque, groutingPressure, totalRings } = shield;
  const cutterRef = useRef<THREE.Mesh>(null);
  const isSelected = id === selectedShieldId;

  useFrame((_, delta) => {
    if (cutterRef.current) {
      cutterRef.current.rotation.z += delta * 2;
    }
  });

  const colors = useMemo(() => {
    if (status === 'warning') {
      return {
        main: '#e67e22',
        shell: '#d35400',
        cabin: '#c0392b',
        accent: '#f39c12',
      };
    }
    if (status === 'maintenance') {
      return {
        main: '#7f8c8d',
        shell: '#95a5a6',
        cabin: '#636e72',
        accent: '#bdc3c7',
      };
    }
    return {
      main: '#2980b9',
      shell: '#34495e',
      cabin: '#16a085',
      accent: '#1abc9c',
    };
  }, [status]);

  const emissiveIntensity = isSelected ? 0.5 : 0.15;

  const cutterTeeth = useMemo(() => {
    const teeth = [];
    const toothCount = 16;
    for (let i = 0; i < toothCount; i++) {
      const angle = (i / toothCount) * Math.PI * 2;
      teeth.push(
        <mesh
          key={i}
          position={[
            Math.cos(angle) * 2.4,
            Math.sin(angle) * 2.4,
            0,
          ]}
          rotation={[0, 0, angle + Math.PI / 2]}
        >
          <boxGeometry args={[0.5, 0.3, 0.4]} />
          <meshStandardMaterial
            color="#e74c3c"
            metalness={0.6}
            roughness={0.3}
            emissive={isSelected ? '#3498db' : '#000000'}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      );
    }
    return teeth;
  }, [isSelected, emissiveIntensity]);

  const edgeColor = '#3498db';

  return (
    <group
      position={[position.x, position.y, position.z]}
      rotation={[rotation.x, rotation.y, rotation.z]}
    >
      <group position={[0, 0, 0]}>
        <mesh ref={cutterRef} position={[0, 0, 6]}>
          <cylinderGeometry args={[2.5, 2.5, 0.6, 32]} />
          <meshStandardMaterial
            color={colors.accent}
            metalness={0.7}
            roughness={0.25}
            emissive={isSelected ? '#3498db' : colors.accent}
            emissiveIntensity={isSelected ? 0.4 : 0.1}
          />
        </mesh>

        {cutterTeeth.map((tooth) => (
          <group position={[0, 0, 6]} key={tooth.key}>
            {tooth}
          </group>
        ))}

        <mesh position={[0, 0, 5.8]}>
          <cylinderGeometry args={[1.8, 1.8, 0.3, 32]} />
          <meshStandardMaterial
            color="#f1c40f"
            emissive="#f39c12"
            emissiveIntensity={0.8}
            metalness={0.5}
            roughness={0.3}
          />
        </mesh>

        <mesh position={[0, 0, 5.7]}>
          <cylinderGeometry args={[1.2, 1.2, 0.2, 24]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#fff5cc"
            emissiveIntensity={1.2}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>

        {isSelected && (
          <mesh position={[0, 0, 6]}>
            <cylinderGeometry args={[2.55, 2.55, 0.65, 32]} />
            <meshBasicMaterial
              color={edgeColor}
              transparent
              opacity={0.15}
              side={THREE.BackSide}
            />
            <Edges color={edgeColor} threshold={15} scale={1.02} />
          </mesh>
        )}
      </group>

      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 10, 32, 1, true]} />
        <meshStandardMaterial
          color={colors.shell}
          metalness={0.65}
          roughness={0.35}
          side={THREE.DoubleSide}
          emissive={isSelected ? '#3498db' : '#000000'}
          emissiveIntensity={emissiveIntensity}
        />
        {isSelected && <Edges color={edgeColor} threshold={15} scale={1.01} />}
      </mesh>

      <mesh position={[0, 0, 5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2.82, 2.82, 0.1, 32]} />
        <meshStandardMaterial
          color={colors.main}
          metalness={0.6}
          roughness={0.35}
          emissive={isSelected ? '#3498db' : '#000000'}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh position={[0, 0, -5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2.82, 2.82, 0.1, 32]} />
        <meshStandardMaterial
          color={colors.main}
          metalness={0.6}
          roughness={0.35}
          emissive={isSelected ? '#3498db' : '#000000'}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh
        position={[0.8, -1.5, 1]}
        rotation={[Math.PI / 5, 0, Math.PI / 8]}
      >
        <cylinderGeometry args={[0.5, 0.7, 5, 16]} />
        <meshStandardMaterial
          color={colors.main}
          metalness={0.55}
          roughness={0.4}
          emissive={isSelected ? '#3498db' : '#000000'}
          emissiveIntensity={emissiveIntensity * 0.6}
        />
        {isSelected && <Edges color={edgeColor} threshold={15} scale={1.02} />}
      </mesh>

      <mesh
        position={[0, 0.5, -3.5]}
        onClick={(e) => {
          e.stopPropagation();
          onClick(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <boxGeometry args={[3.5, 2, 3]} />
        <meshStandardMaterial
          color={colors.cabin}
          metalness={0.5}
          roughness={0.35}
          emissive={isSelected ? '#3498db' : colors.cabin}
          emissiveIntensity={isSelected ? 0.5 : 0.1}
        />
        {isSelected && <Edges color={edgeColor} threshold={15} scale={1.02} />}
      </mesh>

      <mesh position={[0, 1.6, -3.5]}>
        <boxGeometry args={[2.8, 0.8, 2.4]} />
        <meshStandardMaterial
          color="#3498db"
          transparent
          opacity={0.4}
          metalness={0.3}
          roughness={0.2}
          emissive="#3498db"
          emissiveIntensity={0.3}
        />
      </mesh>

      <Html
        position={[0, 5.2, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: isSelected
              ? 'linear-gradient(135deg, rgba(52, 152, 219, 0.95) 0%, rgba(41, 128, 185, 0.95) 100%)'
              : 'rgba(15, 23, 42, 0.92)',
            color: '#f1f5f9',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif',
            whiteSpace: 'nowrap',
            boxShadow: isSelected
              ? '0 0 18px rgba(52, 152, 219, 0.8), 0 6px 16px rgba(0,0,0,0.3)'
              : '0 4px 12px rgba(0,0,0,0.3)',
            border: isSelected
              ? '2px solid rgba(255,255,255,0.7)'
              : '1px solid rgba(24,144,255,0.4)',
            letterSpacing: '0.2px',
            transition: 'all 0.25s ease',
            minWidth: '210px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid ' + (isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(24,144,255,0.3)') }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: isSelected ? '#ffffff' : '#60a5fa' }}>
              【{code}】{name}
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '10px',
              background: status === 'normal' ? 'rgba(34,197,94,0.25)' : status === 'warning' ? 'rgba(249,115,22,0.25)' : 'rgba(100,116,139,0.35)',
              color: status === 'normal' ? '#86efac' : status === 'warning' ? '#fdba74' : '#cbd5e1',
              border: `1px solid ${status === 'normal' ? 'rgba(34,197,94,0.5)' : status === 'warning' ? 'rgba(249,115,22,0.5)' : 'rgba(100,116,139,0.5)'}`,
            }}>
              {status === 'normal' ? '正常' : status === 'warning' ? '预警' : '维护'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>推进速度</span>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>{thrustSpeed.toFixed(1)}<span style={{ color: '#64748b', fontSize: '10px', marginLeft: '2px' }}>mm/min</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>刀盘扭矩</span>
              <span style={{ color: '#fb923c', fontWeight: 700 }}>{cutterTorque}<span style={{ color: '#64748b', fontSize: '10px', marginLeft: '2px' }}>kN·m</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>注浆压力</span>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>{groutingPressure.toFixed(2)}<span style={{ color: '#64748b', fontSize: '10px', marginLeft: '2px' }}>bar</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8' }}>累计环数</span>
              <span style={{ color: '#c084fc', fontWeight: 700 }}>{totalRings}<span style={{ color: '#64748b', fontSize: '10px', marginLeft: '2px' }}>环</span></span>
            </div>
          </div>
        </div>
      </Html>

      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[3.1, 3.1, 11, 32, 1, true]} />
          <meshBasicMaterial
            color={edgeColor}
            transparent
            opacity={0.06}
            side={THREE.BackSide}
          />
          <Edges color={edgeColor} threshold={15} scale={1.001} />
        </mesh>
      )}
    </group>
  );
}
