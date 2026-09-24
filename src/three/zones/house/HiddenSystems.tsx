import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "@/config/world";
import { Pipe } from "../../world/kit";
import { Hotspot } from "../../world/Hotspot";
import { useXray } from "../../world/store";

/** Scan-style material: drawn through walls and ground while X-Ray is on. */
function scan(color: string) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
}

function Run({ points, radius, m }: { points: Vec3[]; radius: number; m: THREE.Material }) {
  return (
    <>
      {points.slice(1).map((b, i) => (
        <Pipe key={i} a={points[i]!} b={b} radius={radius} m={m} />
      ))}
    </>
  );
}

export function HiddenSystems() {
  const on = useXray();
  const mats = useMemo(
    () => ({
      cold: scan("#4fc3ff"),
      hot: scan("#ff5a5a"),
      sewer: scan("#b98a56"),
      wire: scan("#ffc53d"),
      duct: scan("#dfe7f0"),
    }),
    [],
  );
  useFrame(({ clock }) => {
    const p = 0.65 + Math.sin(clock.elapsedTime * 3) * 0.25;
    Object.values(mats).forEach((m) => (m.opacity = p));
  });
  if (!on) return null;
  return (
    <group name="xray-hidden-systems" renderOrder={20}>
      <Hotspot id="xray-plumbing">
        <group name="xray-supply-and-drain">
          <Run
            m={mats.cold}
            radius={0.063}
            points={[
              [3.5, -0.3, 6.5],
              [3.5, -0.3, 1.2],
              [3.5, 0.3, 1.2],
              [3.5, 0.3, -2.3],
              [2.9, 0.3, -2.3],
            ]}
          />
          <Run
            m={mats.cold}
            radius={0.054}
            points={[
              [3.5, 0.3, -2.0],
              [-3.5, 0.3, -2.0],
              [-3.5, 0.3, -5.8],
              [-7.0, 0.3, -5.8],
            ]}
          />
          <Run
            m={mats.hot}
            radius={0.054}
            points={[
              [2.9, 2.9, -2.3],
              [2.9, 2.9, -5.8],
              [-7.4, 2.9, -5.8],
              [-7.4, 0.3, -5.8],
            ]}
          />
          <Run
            m={mats.cold}
            radius={0.045}
            points={[
              [3.5, 0.3, -2.9],
              [5.8, 0.3, -2.9],
              [5.8, 0.3, -5.5],
              [5.8, 1.9, -5.5],
            ]}
          />
          <Run
            m={mats.sewer}
            radius={0.108}
            points={[
              [5.4, -0.1, -3.6],
              [4.6, -0.4, -3.6],
              [4.6, -0.6, 4.4],
              [4.6, -0.9, 8.6],
            ]}
          />
          <Run
            m={mats.sewer}
            radius={0.09}
            points={[
              [-7.2, -0.1, -5.4],
              [-7.2, -0.4, -5.4],
              [-7.2, -0.4, 0.8],
              [4.6, -0.45, 0.8],
            ]}
          />
        </group>
      </Hotspot>
      <Hotspot id="xray-wiring">
        <group name="xray-wiring">
          <Run
            m={mats.wire}
            radius={0.029}
            points={[
              [5.85, 1.9, -0.4],
              [5.85, 3.0, -0.4],
              [5.85, 3.0, -5.85],
              [-8.9, 3.0, -5.85],
              [-8.9, 3.0, -1.8],
              [-8.9, 1.9, -1.8],
            ]}
          />
          <Run
            m={mats.wire}
            radius={0.025}
            points={[
              [-1, 3.0, -5.85],
              [-1, 3.0, -2.8],
            ]}
          />
          <Run
            m={mats.wire}
            radius={0.025}
            points={[
              [2.0, 3.0, -5.85],
              [2.0, 1.55, -5.4],
            ]}
          />
          <Run
            m={mats.wire}
            radius={0.025}
            points={[
              [-5.3, 3.0, -5.85],
              [-5.3, 1.0, -5.85],
            ]}
          />
          <Run
            m={mats.wire}
            radius={0.025}
            points={[
              [5.85, 3.0, 0.6],
              [11.5, 3.0, 0.6],
              [11.5, 1.3, 0.6],
            ]}
          />
          <Run
            m={mats.wire}
            radius={0.025}
            points={[
              [5.85, 2.4, -0.4],
              [2.2, 2.4, -0.4],
              [2.2, 1.0, 0.7],
            ]}
          />
        </group>
      </Hotspot>
      <Hotspot id="xray-ducts">
        <group name="xray-ductwork">
          <Run
            m={mats.duct}
            radius={0.252}
            points={[
              [4.4, 3.0, -2.38],
              [4.4, 3.6, -2.38],
              [-7.5, 3.6, -2.38],
            ]}
          />
          <Run
            m={mats.duct}
            radius={0.162}
            points={[
              [-1, 3.6, -2.38],
              [-1, 3.6, -5.2],
              [0.9, 3.4, -5.6],
              [0.9, 2.8, -5.8],
            ]}
          />
          <Run
            m={mats.duct}
            radius={0.162}
            points={[
              [-6.5, 3.6, -2.38],
              [-6.5, 3.6, -4.5],
              [-6.5, 3.2, -4.5],
            ]}
          />
          <Run
            m={mats.duct}
            radius={0.144}
            points={[
              [4.4, 3.6, -2.38],
              [4.4, 3.6, -4.6],
              [4.4, 3.2, -4.6],
            ]}
          />
          <Run
            m={mats.duct}
            radius={0.108}
            points={[
              [-10.25, 0.4, -4.2],
              [-9.1, 0.4, -4.2],
              [-9.1, 3.6, -2.38],
            ]}
          />
        </group>
      </Hotspot>
    </group>
  );
}
