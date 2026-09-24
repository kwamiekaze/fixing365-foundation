import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { neighborhoodZones, problemScenes } from "@/config/problems";

interface Props {
  selectedProblem: string | null;
  fixedProblem: string | null;
  selectedService: string | null;
  onSelectProblem: (id: string) => void;
  reduced: boolean;
}

function ProblemMarker({
  id,
  position,
  urgent,
  active,
  fixed,
  onSelect,
  reduced,
}: {
  id: string;
  position: [number, number, number];
  urgent?: boolean;
  active: boolean;
  fixed: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ring.current || reduced) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.4 + position[0]) * 0.1;
    ring.current.scale.setScalar(active ? 1.22 : pulse);
    ring.current.rotation.z += fixed ? 0.012 : 0.006;
  });
  const color = fixed ? "#56e39f" : urgent ? "#ff6b4a" : "#f4b942";
  return (
    <group
      position={position}
      name={`problem-${id}`}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <mesh ref={ring} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.19, 0.045, 8, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active || fixed ? 2.2 : 1}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow>
        <sphereGeometry args={[active ? 0.13 : 0.1, 12, 12]} />
        <meshStandardMaterial
          color={fixed ? "#d9ffeb" : "#fff8e8"}
          emissive={color}
          emissiveIntensity={active || fixed ? 2.6 : 1.4}
        />
      </mesh>
      {fixed && (
        <group position={[0, 0.31, 0]}>
          <mesh rotation-z={Math.PI / 4}>
            <boxGeometry args={[0.08, 0.32, 0.07]} />
            <meshStandardMaterial color="#56e39f" emissive="#56e39f" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.1, 0.11, 0]} rotation-z={-Math.PI / 4}>
            <boxGeometry args={[0.08, 0.2, 0.07]} />
            <meshStandardMaterial color="#56e39f" emissive="#56e39f" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )}
      <pointLight
        color={color}
        intensity={active || fixed ? 3 : 1}
        distance={active || fixed ? 2.5 : 1.2}
      />
    </group>
  );
}

export function ProblemScenes({
  selectedProblem,
  fixedProblem,
  selectedService,
  onSelectProblem,
  reduced,
}: Props) {
  const { camera } = useThree();
  const groups = useRef<Record<string, THREE.Group | null>>({});
  useFrame(() => {
    for (const zone of neighborhoodZones) {
      const group = groups.current[zone.id];
      if (!group) continue;
      group.visible =
        camera.position.distanceTo(new THREE.Vector3(...zone.center)) < 24 ||
        Boolean(selectedProblem) ||
        Boolean(selectedService);
    }
  });
  return (
    <group name="fixing365-problem-scenes">
      {neighborhoodZones.map((zone) => (
        <group
          key={zone.id}
          name={`stream-zone-${zone.id}`}
          ref={(node) => {
            groups.current[zone.id] = node;
          }}
        >
          {problemScenes
            .filter((problem) => problem.zone === zone.id)
            .map((problem) => (
              <ProblemMarker
                key={problem.id}
                id={problem.id}
                position={problem.position}
                urgent={problem.urgent}
                active={selectedProblem === problem.id}
                fixed={fixedProblem === problem.id}
                reduced={reduced}
                onSelect={() => onSelectProblem(problem.id)}
              />
            ))}
        </group>
      ))}
    </group>
  );
}
