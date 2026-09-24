import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { cameraConfig } from "@/config/camera";
import { getStation, stations } from "@/config/stations";
import { House } from "./House";
import { HQDesk } from "./HQDesk";
import { ProblemScenes } from "./ProblemScenes";
import {
  ApplianceStation,
  ElectricalStation,
  ExteriorStation,
  HandymanStation,
  HvacStation,
  InteriorStation,
  PlumbingStation,
  SmartStation,
} from "./stations";

interface Props {
  selected: string | null;
  onSelect: (id: string | null) => void;
  selectedProblem: string | null;
  fixedProblem: string | null;
  onSelectProblem: (id: string | null) => void;
  onRequest: () => void;
  mobileExplore: boolean;
  reduced: boolean;
  xray: boolean;
}

function CameraRig({
  selected,
  reduced,
  mobileExplore,
}: {
  selected: string | null;
  reduced: boolean;
  mobileExplore: boolean;
}) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...cameraConfig.homeTarget));
  useEffect(() => {
    const station = getStation(selected);
    target.current.set(...(station?.cameraTarget ?? cameraConfig.homeTarget));
    const next = new THREE.Vector3(...(station?.cameraPosition ?? cameraConfig.homePosition));
    if (reduced) {
      camera.position.copy(next);
      controls.current?.target.copy(target.current);
      controls.current?.update();
    }
  }, [selected, reduced, camera]);
  useFrame((_, raw) => {
    if (reduced) return;
    const station = getStation(selected);
    const desired = new THREE.Vector3(...(station?.cameraPosition ?? cameraConfig.homePosition));
    const t = 1 - Math.exp(-4 * Math.min(raw, 0.05));
    camera.position.lerp(desired, t);
    if (controls.current) {
      controls.current.target.lerp(target.current, t);
      controls.current.update();
    }
  });
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      enableZoom={false}
      enableRotate={mobileExplore || typeof window === "undefined" || window.innerWidth >= 768}
      minAzimuthAngle={cameraConfig.minAzimuthAngle}
      maxAzimuthAngle={cameraConfig.maxAzimuthAngle}
      minPolarAngle={cameraConfig.minPolarAngle}
      maxPolarAngle={cameraConfig.maxPolarAngle}
      minDistance={cameraConfig.minDistance}
      maxDistance={cameraConfig.maxDistance}
    />
  );
}

const stationComponents = {
  handyman: HandymanStation,
  electrical: ElectricalStation,
  plumbing: PlumbingStation,
  hvac: HvacStation,
  appliances: ApplianceStation,
  interior: InteriorStation,
  exterior: ExteriorStation,
  smart: SmartStation,
};

function World({
  selected,
  onSelect,
  selectedProblem,
  fixedProblem,
  onSelectProblem,
  onRequest,
  mobileExplore,
  reduced,
  shadows,
  xray,
}: Props & { shadows: boolean }) {
  const common = (id: string) => ({
    selected: selected === id,
    onSelect: (value: string) => {
      onSelectProblem(null);
      onSelect(value);
    },
    reduced,
  });
  return (
    <>
      <color attach="background" args={[xray ? "#071824" : "#0b1220"]} />
      <fog attach="fog" args={[xray ? "#071824" : "#0b1220", 19, 33]} />
      <hemisphereLight args={["#b9ddff", "#6b4c35", xray ? 1.45 : 1.1]} />
      <ambientLight intensity={xray ? 0.9 : 0.65} />
      <directionalLight
        name="sun-key"
        position={[7, 11, 8]}
        intensity={2.5}
        color="#ffe0ae"
        castShadow={shadows && !xray}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={9}
        shadow-camera-bottom={-7}
      />
      <Environment resolution={128}>
        <Lightformer intensity={2.5} position={[0, 8, 2]} scale={[12, 5, 1]} />
        <Lightformer
          intensity={1.2}
          color="#8ecdf0"
          position={[-8, 3, 0]}
          rotation-y={Math.PI / 2}
          scale={[8, 4, 1]}
        />
      </Environment>
      <House xray={xray} />
      <HQDesk onRequest={onRequest} reduced={reduced} />
      {stations.map((station) => {
        const Comp = stationComponents[station.id as keyof typeof stationComponents];
        return Comp ? (
          <group key={station.id} position={station.position} rotation={station.rotation}>
            <Comp {...common(station.id)} />
          </group>
        ) : null;
      })}
      <ProblemScenes
        selectedProblem={selectedProblem}
        fixedProblem={fixedProblem}
        selectedService={selected}
        onSelectProblem={(id) => {
          onSelect(null);
          onSelectProblem(id);
        }}
        reduced={reduced}
      />
      <CameraRig selected={selected} reduced={reduced} mobileExplore={mobileExplore} />
    </>
  );
}

export default function Scene(props: Props) {
  const [dpr, setDpr] = useState(1.5);
  const [shadows, setShadows] = useState(true);
  return (
    <Canvas
      shadows={shadows && !props.xray}
      dpr={dpr}
      camera={{ position: cameraConfig.homePosition, fov: 44, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onPointerMissed={() => {
        props.onSelect(null);
        props.onSelectProblem(null);
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setShadows(false);
        }}
        onIncline={() => setDpr(1.75)}
      />
      <Suspense fallback={null}>
        <World {...props} shadows={shadows} />
      </Suspense>
    </Canvas>
  );
}
