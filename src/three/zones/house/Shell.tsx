import { StaticBatch } from "../../world/StaticBatch";
import type * as THREE from "three";
import { B, M } from "../../world/kit";
import { useDaylight } from "../../world/Environment";

export const H = 3.2;
const T = 0.16;

/** Wall along X at depth z. */
function WX({
  x1,
  x2,
  z,
  y1 = 0,
  y2 = H,
  m,
  name,
}: {
  x1: number;
  x2: number;
  z: number;
  y1?: number;
  y2?: number;
  m: THREE.Material;
  name?: string;
}) {
  return <B name={name} p={[(x1 + x2) / 2, (y1 + y2) / 2, z]} s={[x2 - x1, y2 - y1, T]} m={m} />;
}
/** Wall along Z at x. */
function WZ({
  z1,
  z2,
  x,
  y1 = 0,
  y2 = H,
  m,
  name,
}: {
  z1: number;
  z2: number;
  x: number;
  y1?: number;
  y2?: number;
  m: THREE.Material;
  name?: string;
}) {
  return <B name={name} p={[x, (y1 + y2) / 2, (z1 + z2) / 2]} s={[T, y2 - y1, z2 - z1]} m={m} />;
}

function Window({
  x,
  z,
  w = 1.4,
  y1 = 1.3,
  y2 = 2.5,
}: {
  x: number;
  z: number;
  w?: number;
  y1?: number;
  y2?: number;
}) {
  const h = y2 - y1;
  return (
    <group name="house-window" position={[x, (y1 + y2) / 2, z]}>
      <B s={[w, h, 0.04]} m={M.glass} cast={false} />
      <B p={[0, h / 2, 0]} s={[w + 0.12, 0.08, 0.22]} m={M.trim} />
      <B p={[0, -h / 2, 0.06]} s={[w + 0.2, 0.07, 0.3]} m={M.trim} />
      <B p={[-w / 2, 0, 0]} s={[0.07, h, 0.2]} m={M.trim} />
      <B p={[w / 2, 0, 0]} s={[0.07, h, 0.2]} m={M.trim} />
      <B p={[0, 0, 0]} s={[0.04, h, 0.1]} m={M.trim} />
    </group>
  );
}

export function Shell() {
  const day = useDaylight();
  const indoor = 1 + (1 - day) * 2.2;
  return (
    <>
      <StaticBatch name="house-shell">
        {/* Foundation and floors */}
        <B
          name="house-foundation"
          p={[1.25, -0.08, -2]}
          s={[20.8, 0.2, 8.4]}
          m={M.floorConcrete}
          cast={false}
        />
        <B
          name="floor-kitchen"
          p={[-6.5, 0.02, -2]}
          s={[5, 0.06, 8]}
          m={M.floorTile}
          cast={false}
        />
        <B name="floor-living" p={[-1, 0.02, -2]} s={[6, 0.06, 8]} m={M.floorWood} cast={false} />
        <B name="floor-bath" p={[4, 0.02, -4.4]} s={[4, 0.06, 3.2]} m={M.floorTile} cast={false} />
        <B
          name="floor-utility"
          p={[4, 0.02, -0.4]}
          s={[4, 0.06, 4.8]}
          m={M.floorConcrete}
          cast={false}
        />
        <B name="living-rug" p={[-1.6, 0.06, -3]} s={[3.4, 0.02, 2.6]} m={M.rug} cast={false} />

        {/* Back wall with kitchen window */}
        <WX name="wall-back-kitchen-a" x1={-9} x2={-7.9} z={-6} m={M.wallKitchen} />
        <WX name="wall-back-kitchen-b" x1={-6.5} x2={-4} z={-6} m={M.wallKitchen} />
        <WX x1={-7.9} x2={-6.5} z={-6} y2={1.3} m={M.wallKitchen} />
        <WX x1={-7.9} x2={-6.5} z={-6} y1={2.5} m={M.wallKitchen} />
        <Window x={-7.2} z={-6} />
        <WX name="wall-back-living" x1={-4} x2={2} z={-6} m={M.wallWarm} />
        <WX name="wall-back-bath" x1={2} x2={6} z={-6} m={M.wallBath} />

        {/* Side walls */}
        <WZ name="wall-left-kitchen" z1={-6} z2={2} x={-9} m={M.wallKitchen} />
        <WZ name="wall-left-siding" z1={-6.1} z2={2.1} x={-9.14} m={M.siding} />
        <WZ name="wall-right-bath" z1={-6} z2={-2.8} x={6} m={M.wallBath} />
        <WZ name="wall-right-utility" z1={-2.8} z2={2} x={6} m={M.wallUtility} />

        {/* Partitions */}
        <WZ name="partition-kitchen-living" z1={-6} z2={-3.4} x={-4} m={M.wallWarm} />
        <WZ name="partition-living-thermostat" z1={-6} z2={-4.3} x={2} m={M.wallWarm} />
        <WZ z1={-4.3} z2={-3.4} x={2} y1={2.25} m={M.wallWarm} />
        <WZ name="partition-living-utility" z1={-3.4} z2={2} x={2} m={M.wallWarm} />
        <WX name="partition-bath-utility" x1={2} x2={6} z={-2.8} m={M.wallBath} />

        {/* Cutaway front: knee walls, front door wall */}
        <WX name="front-knee-left" x1={-9} x2={0.2} z={2} y2={0.7} m={M.siding} />
        <B p={[-4.4, 0.72, 2]} s={[9.2, 0.06, 0.24]} m={M.trim} />
        <WX name="front-door-wall-left" x1={0.2} x2={0.6} z={2} m={M.sidingLight} />
        <WX name="front-door-wall-right" x1={1.6} x2={2} z={2} m={M.sidingLight} />
        <WX name="front-door-header" x1={0.6} x2={1.6} z={2} y1={2.3} m={M.sidingLight} />
        <WX name="front-knee-right" x1={2} x2={6} z={2} y2={0.7} m={M.siding} />
        <B p={[4, 0.72, 2]} s={[4, 0.06, 0.24]} m={M.trim} />

        {/* Baseboards */}
        <B p={[-1, 0.08, -5.9]} s={[6, 0.12, 0.04]} m={M.trim} cast={false} />
        <B p={[-3.9, 0.08, -4.7]} s={[0.04, 0.12, 2.6]} m={M.trim} cast={false} />
        <B p={[1.9, 0.08, -1.3]} s={[0.04, 0.12, 4.2]} m={M.trim} cast={false} />

        {/* Exposed ceiling beams, cutaway so the camera can look in */}
        {[-8, -6, -4, -2, -1, 0, 2, 4].map((x) => (
          <B
            key={x}
            name="ceiling-beam"
            p={[x, H - 0.1, -2]}
            s={[0.16, 0.2, 8]}
            m={M.floorWoodDark}
          />
        ))}
        <B
          name="ceiling-ridge"
          p={[-1.5, H - 0.08, -2.8]}
          s={[15, 0.16, 0.16]}
          m={M.floorWoodDark}
        />
      </StaticBatch>
      <group name="house-lights">
        <pointLight
          name="light-kitchen"
          position={[-6.5, 2.7, -3.4]}
          intensity={4 * indoor}
          distance={7}
          color="#ffe2b8"
          decay={1.6}
        />
        <pointLight
          name="light-living"
          position={[-1, 2.6, -2.4]}
          intensity={4 * indoor}
          distance={7}
          color="#ffd9a8"
          decay={1.6}
        />
        <pointLight
          name="light-bath-utility"
          position={[4, 2.7, -2]}
          intensity={3.2 * indoor}
          distance={6.5}
          color="#eef3ff"
          decay={1.6}
        />
      </group>
    </>
  );
}
