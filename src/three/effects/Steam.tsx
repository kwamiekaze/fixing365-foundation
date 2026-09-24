import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
export function Steam({ reduced = false }: { reduced?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return;
    ref.current.position.y = (clock.elapsedTime * 0.25) % 0.7;
    ref.current.children.forEach((child, i) => {
      child.position.x = Math.sin(clock.elapsedTime * 1.4 + i) * 0.04;
    });
  });
  return (
    <group ref={ref} name="effect-coffee-steam">
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.06 - 0.06, i * 0.18, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.22} />
        </mesh>
      ))}
    </group>
  );
}
