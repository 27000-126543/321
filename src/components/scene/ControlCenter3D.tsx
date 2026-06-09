const ControlCenter3D = () => {
  return (
    <group position={[0, 0, 18]}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[6, 3, 4]} />
        <meshStandardMaterial color={'#64748b'} />
      </mesh>

      <mesh position={[0, 3.05, 0]}>
        <boxGeometry args={[6.2, 0.1, 4.2]} />
        <meshStandardMaterial color={'#475569'} />
      </mesh>

      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
        <meshStandardMaterial color={'#94a3b8'} />
      </mesh>

      <mesh position={[0, 5.6, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.25, 0.5, 8]} />
        <meshStandardMaterial color={'#ef4444'} emissive={'#ef4444'} emissiveIntensity={0.6} />
      </mesh>

      <group position={[0, 1.2, 2.01]}>
        <mesh position={[-1.8, 0.8, 0]}>
          <boxGeometry args={[1.4, 1, 0.1]} />
          <meshStandardMaterial color={'#3b82f6'} emissive={'#3b82f6'} emissiveIntensity={0.5} />
        </mesh>

        <mesh position={[-1.8, 0.8, 0.06]}>
          <boxGeometry args={[1.5, 1.1, 0.02]} />
          <meshStandardMaterial color={'#1e293b'} />
        </mesh>

        <mesh position={[-0.4, 0.8, 0]}>
          <boxGeometry args={[1.4, 1, 0.1]} />
          <meshStandardMaterial color={'#3b82f6'} emissive={'#3b82f6'} emissiveIntensity={0.5} />
        </mesh>

        <mesh position={[-0.4, 0.8, 0.06]}>
          <boxGeometry args={[1.5, 1.1, 0.02]} />
          <meshStandardMaterial color={'#1e293b'} />
        </mesh>

        <mesh position={[1.0, 0.8, 0]}>
          <boxGeometry args={[1.4, 1, 0.1]} />
          <meshStandardMaterial color={'#3b82f6'} emissive={'#3b82f6'} emissiveIntensity={0.5} />
        </mesh>

        <mesh position={[1.0, 0.8, 0.06]}>
          <boxGeometry args={[1.5, 1.1, 0.02]} />
          <meshStandardMaterial color={'#1e293b'} />
        </mesh>

        <mesh position={[2.4, 0.8, 0]}>
          <boxGeometry args={[1.4, 1, 0.1]} />
          <meshStandardMaterial color={'#3b82f6'} emissive={'#3b82f6'} emissiveIntensity={0.5} />
        </mesh>

        <mesh position={[2.4, 0.8, 0.06]}>
          <boxGeometry args={[1.5, 1.1, 0.02]} />
          <meshStandardMaterial color={'#1e293b'} />
        </mesh>

        <mesh position={[-1.8, -0.6, 0]}>
          <boxGeometry args={[1.4, 0.6, 0.05]} />
          <meshStandardMaterial color={'#94a3b8'} />
        </mesh>

        <mesh position={[-0.4, -0.6, 0]}>
          <boxGeometry args={[1.4, 0.6, 0.05]} />
          <meshStandardMaterial color={'#94a3b8'} />
        </mesh>

        <mesh position={[1.0, -0.6, 0]}>
          <boxGeometry args={[1.4, 0.6, 0.05]} />
          <meshStandardMaterial color={'#94a3b8'} />
        </mesh>

        <mesh position={[2.4, -0.6, 0]}>
          <boxGeometry args={[1.4, 0.6, 0.05]} />
          <meshStandardMaterial color={'#94a3b8'} />
        </mesh>
      </group>

      <group position={[0, 0, 2.02]}>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[1.2, 0.5, 0.02]} />
          <meshStandardMaterial color={'#1e293b'} />
        </mesh>

        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.2, 0.1, 0.04]} />
          <meshStandardMaterial color={'#334155'} />
        </mesh>
      </group>

      <group position={[0, 0, 2.2]}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[2, 0.1, 1.5]} />
          <meshStandardMaterial color={'#475569'} />
        </mesh>

        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[1.8, 0.1, 1.3]} />
          <meshStandardMaterial color={'#64748b'} />
        </mesh>

        <mesh position={[0, -0.15, 0]}>
          <boxGeometry args={[1.6, 0.1, 1.1]} />
          <meshStandardMaterial color={'#94a3b8'} />
        </mesh>
      </group>

      <mesh position={[0, 0.05, -2.01]}>
        <boxGeometry args={[1.2, 1.8, 0.02]} />
        <meshStandardMaterial color={'#1e293b'} />
      </mesh>

      <mesh position={[-2.5, 1.5, -2.01]}>
        <boxGeometry args={[0.8, 1, 0.02]} />
        <meshStandardMaterial color={'#0ea5e9'} emissive={'#0ea5e9'} emissiveIntensity={0.15} transparent opacity={0.8} />
      </mesh>

      <mesh position={[2.5, 1.5, -2.01]}>
        <boxGeometry args={[0.8, 1, 0.02]} />
        <meshStandardMaterial color={'#0ea5e9'} emissive={'#0ea5e9'} emissiveIntensity={0.15} transparent opacity={0.8} />
      </mesh>

      <mesh position={[-2.5, 1.5, 2.01]}>
        <boxGeometry args={[0.8, 1, 0.02]} />
        <meshStandardMaterial color={'#0ea5e9'} emissive={'#0ea5e9'} emissiveIntensity={0.15} transparent opacity={0.8} />
      </mesh>

      <mesh position={[2.5, 1.5, 2.01]}>
        <boxGeometry args={[0.8, 1, 0.02]} />
        <meshStandardMaterial color={'#0ea5e9'} emissive={'#0ea5e9'} emissiveIntensity={0.15} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

export default ControlCenter3D;
