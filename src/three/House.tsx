import { useEffect, useRef } from "react";
import * as THREE from "three";

function InstancedFloor({ xray }: { xray: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    let index = 0;
    for (let x = -8; x < 8; x += 1) {
      for (let z = -6; z < 4; z += 1) {
        dummy.position.set(x + 0.5, 0.02, z + 0.5);
        dummy.updateMatrix();
        ref.current.setMatrixAt(index++, dummy.matrix);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh
      ref={ref}
      name="house-floor-tiles"
      args={[undefined, undefined, 160]}
      receiveShadow
    >
      <boxGeometry args={[0.98, 0.04, 0.98]} />
      <meshStandardMaterial
        color={xray ? "#26364c" : "#394557"}
        roughness={0.9}
        transparent={xray}
        opacity={xray ? 0.28 : 1}
        depthWrite={!xray}
      />
    </instancedMesh>
  );
}

export function House({ xray = false }: { xray?: boolean }) {
  const wallMaterial = (
    <meshStandardMaterial
      color={xray ? "#2d7ca0" : "#283548"}
      roughness={0.92}
      transparent={xray}
      opacity={xray ? 0.16 : 1}
      depthWrite={!xray}
      wireframe={xray}
    />
  );
  return (
    <group name="fixing365-open-front-house">
      <InstancedFloor xray={xray} />
      <mesh name="house-back-wall" position={[0, 2.4, -6]} receiveShadow>
        <boxGeometry args={[16, 4.8, 0.18]} />
        {wallMaterial}
      </mesh>
      <mesh name="house-left-wall" position={[-8, 2.4, -1]} receiveShadow>
        <boxGeometry args={[0.18, 4.8, 10]} />
        {wallMaterial}
      </mesh>
      <mesh name="house-right-wall" position={[8, 2.4, -1]} receiveShadow>
        <boxGeometry args={[0.18, 4.8, 10]} />
        {wallMaterial}
      </mesh>
      <mesh name="house-ceiling-beam" position={[0, 4.7, -5.85]}>
        <boxGeometry args={[16.3, 0.22, 0.32]} />
        <meshStandardMaterial
          color={xray ? "#3e95b9" : "#141f2d"}
          metalness={0.15}
          transparent={xray}
          opacity={xray ? 0.35 : 1}
        />
      </mesh>
      <group name="house-window" position={[-5.5, 2.5, -5.86]}>
        <mesh>
          <boxGeometry args={[2.4, 1.7, 0.1]} />
          <meshStandardMaterial
            color="#87c8e8"
            emissive="#7fc6ea"
            emissiveIntensity={xray ? 0.7 : 0.25}
            transparent
            opacity={xray ? 0.25 : 0.65}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[0.1, 1.8, 0.14]} />
          <meshStandardMaterial color="#d4d6cf" />
        </mesh>
        <mesh>
          <boxGeometry args={[2.5, 0.1, 0.14]} />
          <meshStandardMaterial color="#d4d6cf" />
        </mesh>
      </group>
      <spotLight
        name="window-sunlight"
        position={[-5.5, 4, -5]}
        target-position={[-2, 0, 1]}
        color="#a8d9ff"
        intensity={18}
        angle={0.5}
        penumbra={0.8}
        distance={14}
      />
    </group>
  );
}
