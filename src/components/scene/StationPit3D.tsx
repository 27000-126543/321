import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { StationNode } from '../../types';

interface StationPit3DProps {
  stationNodes: StationNode[];
}

const PIT_LENGTH = 20;
const PIT_WIDTH = 14;
const PIT_DEPTH = 6;
const WALL_THICKNESS = 0.4;
const SUPPORT_LAYERS = 4;
const GROUP_OFFSET_X = -18;

function DelayedMarker({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      meshRef.current.scale.set(scale, scale, scale);
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#ff2d2d" emissive="#ff2d2d" emissiveIntensity={0.5} />
    </mesh>
  );
}

function StationPit3D({ stationNodes }: StationPit3DProps) {
  const avgProgress = useMemo(() => {
    if (stationNodes.length === 0) return 0;
    return stationNodes.reduce((sum, n) => sum + n.progress, 0) / stationNodes.length;
  }, [stationNodes]);

  const delayedNodes = useMemo(
    () => stationNodes.filter((n) => n.status === 'delayed'),
    [stationNodes]
  );

  const keyNodes = useMemo(
    () => stationNodes.filter((n) => n.isKeyNode && n.progress > 0),
    [stationNodes]
  );

  const supportLayerDepths = useMemo(() => {
    const depths: number[] = [];
    for (let i = 1; i <= SUPPORT_LAYERS; i++) {
      depths.push(-(PIT_DEPTH * i) / (SUPPORT_LAYERS + 1));
    }
    return depths;
  }, []);

  const excavatedDepth = (avgProgress / 100) * PIT_DEPTH;
  const structureProgress = useMemo(() => {
    const completed = stationNodes.filter((n) => n.status === 'completed');
    return completed.length / Math.max(stationNodes.length, 1);
  }, [stationNodes]);

  return (
    <group position={[GROUP_OFFSET_X, -3, 0]}>
      <mesh position={[0, -PIT_DEPTH / 2 - 0.1, 0]} receiveShadow>
        <boxGeometry args={[PIT_LENGTH + 2, 0.2, PIT_WIDTH + 2]} />
        <meshStandardMaterial color="#5a4a3a" />
      </mesh>

      <group>
        <mesh position={[0, 0, (PIT_WIDTH + WALL_THICKNESS) / 2]}>
          <boxGeometry args={[PIT_LENGTH + WALL_THICKNESS * 2, PIT_DEPTH, WALL_THICKNESS]} />
          <meshStandardMaterial
            color="#4a3222"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0, -(PIT_WIDTH + WALL_THICKNESS) / 2]}>
          <boxGeometry args={[PIT_LENGTH + WALL_THICKNESS * 2, PIT_DEPTH, WALL_THICKNESS]} />
          <meshStandardMaterial
            color="#4a3222"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[(PIT_LENGTH + WALL_THICKNESS) / 2, 0, 0]}>
          <boxGeometry args={[WALL_THICKNESS, PIT_DEPTH, PIT_WIDTH]} />
          <meshStandardMaterial
            color="#4a3222"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[-(PIT_LENGTH + WALL_THICKNESS) / 2, 0, 0]}>
          <boxGeometry args={[WALL_THICKNESS, PIT_DEPTH, PIT_WIDTH]} />
          <meshStandardMaterial
            color="#4a3222"
            transparent
            opacity={0.75}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <group>
        {excavatedDepth > 0.01 && (
          <mesh position={[0, excavatedDepth / 2, 0]}>
            <boxGeometry args={[PIT_LENGTH - 0.1, excavatedDepth, PIT_WIDTH - 0.1]} />
            <meshStandardMaterial color="#6b5344" />
          </mesh>
        )}
        {excavatedDepth < PIT_DEPTH - 0.01 && (
          <mesh
            position={[
              0,
              excavatedDepth + (PIT_DEPTH - excavatedDepth) / 2,
              0,
            ]}
          >
            <boxGeometry
              args={[
                PIT_LENGTH - 0.1,
                PIT_DEPTH - excavatedDepth,
                PIT_WIDTH - 0.1,
              ]}
            />
            <meshStandardMaterial
              color="#c4a77d"
              transparent
              opacity={0.6}
            />
          </mesh>
        )}
      </group>

      <group>
        {supportLayerDepths.map((y, idx) => {
          const shouldShow = excavatedDepth >= -y - 0.1;
          if (!shouldShow) return null;
          return (
            <group key={idx} position={[0, y, 0]}>
              {[-4, 0, 4].map((x, i) => (
                <mesh key={i} position={[x, 0, 0]} castShadow>
                  <boxGeometry args={[0.4, 0.4, PIT_WIDTH - 0.8]} />
                  <meshStandardMaterial
                    color="#2e86de"
                    metalness={0.8}
                    roughness={0.3}
                  />
                </mesh>
              ))}
              <mesh position={[0, 0, (PIT_WIDTH - 0.8) / 2]} castShadow>
                <boxGeometry args={[PIT_LENGTH - 0.8, 0.4, 0.4]} />
                <meshStandardMaterial
                  color="#2e86de"
                  metalness={0.8}
                  roughness={0.3}
                />
              </mesh>
              <mesh position={[0, 0, -(PIT_WIDTH - 0.8) / 2]} castShadow>
                <boxGeometry args={[PIT_LENGTH - 0.8, 0.4, 0.4]} />
                <meshStandardMaterial
                  color="#2e86de"
                  metalness={0.8}
                  roughness={0.3}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      <group>
        {structureProgress > 0 && excavatedDepth >= PIT_DEPTH * 0.3 && (
          <mesh
            position={[0, -PIT_DEPTH + 0.15, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[PIT_LENGTH - 0.2, 0.3, PIT_WIDTH - 0.2]} />
            <meshStandardMaterial
              color="#a0a0a0"
              metalness={0.1}
              roughness={0.8}
            />
          </mesh>
        )}
        {structureProgress >= 0.25 && excavatedDepth >= PIT_DEPTH * 0.5 && (
          <group>
            <mesh
              position={[0, -PIT_DEPTH + 1, (PIT_WIDTH - 0.5) / 2]}
              castShadow
            >
              <boxGeometry args={[PIT_LENGTH - 0.2, 1.7, 0.2]} />
              <meshStandardMaterial
                color="#909090"
                metalness={0.1}
                roughness={0.8}
              />
            </mesh>
            <mesh
              position={[0, -PIT_DEPTH + 1, -(PIT_WIDTH - 0.5) / 2]}
              castShadow
            >
              <boxGeometry args={[PIT_LENGTH - 0.2, 1.7, 0.2]} />
              <meshStandardMaterial
                color="#909090"
                metalness={0.1}
                roughness={0.8}
              />
            </mesh>
          </group>
        )}
        {structureProgress >= 0.5 && excavatedDepth >= PIT_DEPTH * 0.7 && (
          <group>
            <mesh
              position={[(PIT_LENGTH - 0.5) / 2, -PIT_DEPTH + 1.5, 0]}
              castShadow
            >
              <boxGeometry args={[0.2, 2.7, PIT_WIDTH - 0.2]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.1}
                roughness={0.8}
              />
            </mesh>
            <mesh
              position={[-(PIT_LENGTH - 0.5) / 2, -PIT_DEPTH + 1.5, 0]}
              castShadow
            >
              <boxGeometry args={[0.2, 2.7, PIT_WIDTH - 0.2]} />
              <meshStandardMaterial
                color="#888888"
                metalness={0.1}
                roughness={0.8}
              />
            </mesh>
          </group>
        )}
        {structureProgress >= 0.75 && excavatedDepth >= PIT_DEPTH * 0.9 && (
          <mesh position={[0, -PIT_DEPTH + 2.8, 0]} castShadow>
            <boxGeometry args={[PIT_LENGTH - 0.2, 0.25, PIT_WIDTH - 0.2]} />
            <meshStandardMaterial
              color="#808080"
              metalness={0.1}
              roughness={0.8}
            />
          </mesh>
        )}
      </group>

      <group>
        {Array.from({ length: 8 }).map((_, i) => {
          const t = i / 7;
          const x = -PIT_LENGTH / 2 + 1 + t * (PIT_LENGTH - 2);
          return (
            <mesh key={`fence-top-${i}`} position={[x, 0.6, PIT_WIDTH / 2 + 0.2]}>
              <boxGeometry args={[0.3, 1, 0.15]} />
              <meshStandardMaterial color="#f1c40f" />
            </mesh>
          );
        })}
        {Array.from({ length: 8 }).map((_, i) => {
          const t = i / 7;
          const x = -PIT_LENGTH / 2 + 1 + t * (PIT_LENGTH - 2);
          return (
            <mesh key={`fence-bot-${i}`} position={[x, 0.6, -PIT_WIDTH / 2 - 0.2]}>
              <boxGeometry args={[0.3, 1, 0.15]} />
              <meshStandardMaterial color="#f1c40f" />
            </mesh>
          );
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const t = i / 5;
          const z = -PIT_WIDTH / 2 + 1 + t * (PIT_WIDTH - 2);
          return (
            <mesh key={`fence-left-${i}`} position={[-PIT_LENGTH / 2 - 0.2, 0.6, z]}>
              <boxGeometry args={[0.15, 1, 0.3]} />
              <meshStandardMaterial color="#f1c40f" />
            </mesh>
          );
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const t = i / 5;
          const z = -PIT_WIDTH / 2 + 1 + t * (PIT_WIDTH - 2);
          return (
            <mesh key={`fence-right-${i}`} position={[PIT_LENGTH / 2 + 0.2, 0.6, z]}>
              <boxGeometry args={[0.15, 1, 0.3]} />
              <meshStandardMaterial color="#f1c40f" />
            </mesh>
          );
        })}
        <mesh position={[0, 0.8, PIT_WIDTH / 2 + 0.2]}>
          <boxGeometry args={[PIT_LENGTH, 0.12, 0.08]} />
          <meshStandardMaterial color="#f39c12" />
        </mesh>
        <mesh position={[0, 0.8, -PIT_WIDTH / 2 - 0.2]}>
          <boxGeometry args={[PIT_LENGTH, 0.12, 0.08]} />
          <meshStandardMaterial color="#f39c12" />
        </mesh>
        <mesh position={[-PIT_LENGTH / 2 - 0.2, 0.8, 0]}>
          <boxGeometry args={[0.08, 0.12, PIT_WIDTH]} />
          <meshStandardMaterial color="#f39c12" />
        </mesh>
        <mesh position={[PIT_LENGTH / 2 + 0.2, 0.8, 0]}>
          <boxGeometry args={[0.08, 0.12, PIT_WIDTH]} />
          <meshStandardMaterial color="#f39c12" />
        </mesh>
      </group>

      <group>
        {delayedNodes.map((node, idx) => {
          const angle = (idx / delayedNodes.length) * Math.PI * 2;
          const radius = 6;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius * 0.5;
          return (
            <DelayedMarker
              key={node.id}
              position={[x, PIT_DEPTH + 2, z]}
            />
          );
        })}
      </group>

      <group>
        {keyNodes.map((node, idx) => {
          const t = (idx + 1) / (keyNodes.length + 1);
          const x = -PIT_LENGTH / 2 + PIT_LENGTH * t;
          const y = -PIT_DEPTH + 0.5;
          const z = 0;
          const nodeProgress = node.progress / 100;
          return (
            <group key={node.id} position={[x, y, z]}>
              <mesh>
                <boxGeometry
                  args={[
                    1.8,
                    nodeProgress * (PIT_DEPTH - 1),
                    PIT_WIDTH - 1,
                  ]}
                />
                <meshStandardMaterial
                  color="#ffd700"
                  transparent
                  opacity={0.15}
                />
              </mesh>
              <lineSegments>
                <edgesGeometry
                  args={[
                    new THREE.BoxGeometry(
                      1.8,
                      nodeProgress * (PIT_DEPTH - 1),
                      PIT_WIDTH - 1
                    ),
                  ]}
                />
                <lineBasicMaterial color="#ffd700" linewidth={2} />
              </lineSegments>
            </group>
          );
        })}
      </group>
    </group>
  );
}

export default StationPit3D;
