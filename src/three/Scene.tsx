import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Suspense, lazy, useState } from "react";
import * as THREE from "three";
import { homeView, type ZoneId } from "@/config/world";
import { CameraRig } from "./world/CameraRig";
import { DebugInfo } from "./world/DebugInfo";
import { WorldEnvironment } from "./world/Environment";
import { ZoneSlot } from "./world/ZoneSlot";
import { HouseLow } from "./zones/house/HouseLow";

/*
 * Each zone's detailed chunk is its own code-split module. Nothing about a
 * zone's detail is downloaded or put on the GPU until the camera focus is
 * near it. To grow the city, add a zone to config/world.ts, a Low massing
 * component, a lazy Detail chunk, and one ZoneSlot below.
 */
const HouseDetail = lazyWithRetry(() => import("./zones/house/HouseDetail"));
import { lazyWithRetry } from "@/lib/lazyWithRetry";

interface Props {
  onZoneDetail?: (zone: ZoneId, loaded: boolean) => void;
}

export default function Scene({ onZoneDetail }: Props) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  // ?lite forces the low tier (no shadows, 1x resolution). Also what weak devices fall back to.
  const lite =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("lite");
  const [dpr, setDpr] = useState(lite ? 1 : mobile ? 1.25 : 1.5);
  const [shadows, setShadows] = useState(!mobile && !lite);
  return (
    <Canvas
      shadows={shadows}
      dpr={dpr}
      camera={{ position: homeView.position, fov: 40, near: 0.1, far: 300 }}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setShadows(false);
        }}
        onIncline={() => !lite && setDpr(mobile ? 1.5 : 1.75)}
      />
      <Suspense fallback={null}>
        <WorldEnvironment shadows={shadows} />
      </Suspense>
      <ZoneSlot id="house" low={<HouseLow />} Detail={HouseDetail} onDetail={onZoneDetail} />
      <CameraRig />
      <DebugInfo />
    </Canvas>
  );
}
