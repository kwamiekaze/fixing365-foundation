import { StaticBatch } from "../../world/StaticBatch";
import * as THREE from "three";
import { B, M } from "../../world/kit";
import { useDaylight } from "../../world/Environment";

export const H = 3.2;

/** Clear glass for the see-in front wall and ceiling: tinted just enough to read as glass. */
const GLASS_WALL = new THREE.MeshStandardMaterial({
  color: "#cfe6f2",
  roughness: 0.04,
  metalness: 0.1,
  transparent: true,
  opacity: 0.12,
  depthWrite: false,
  envMapIntensity: 1.4,
});
const GLASS_ROOF = new THREE.MeshStandardMaterial({
  color: "#dcecf5",
  roughness: 0.05,
  metalness: 0.05,
  transparent: true,
  opacity: 0.08,
  depthWrite: false,
  envMapIntensity: 1.2,
});

/** Glass pane with a slim frame and mullions, running along X at depth z. */
/**
 * See-in glass wall with a white head rail and mullions. `clip` stops the
 * rail and trims the glass and mullions under an overhanging roof beyond
 * x = clip.x (the garage eave over the utility room), so nothing white
 * pokes up through the shingles.
 */
function GlassFront({
  x1,
  x2,
  z,
  y1,
  y2,
  clip,
}: {
  x1: number;
  x2: number;
  z: number;
  y1: number;
  y2: number;
  clip?: { x: number; y: number };
}) {
  const w = x2 - x1;
  const n = Math.max(1, Math.round(w / 2.2));
  const cx = clip ? Math.min(clip.x, x2) : x2;
  const topAt = (x: number) => (clip && x > clip.x ? clip.y : y2);
  return (
    <group name="front-glass">
      <B
        p={[(x1 + cx) / 2, (y1 + y2) / 2, z]}
        s={[cx - x1, y2 - y1, 0.02]}
        m={GLASS_WALL}
        cast={false}
      />
      {clip && cx < x2 && (
        <B
          p={[(cx + x2) / 2, (y1 + clip.y) / 2, z]}
          s={[x2 - cx, clip.y - y1, 0.02]}
          m={GLASS_WALL}
          cast={false}
        />
      )}
      <B p={[(x1 + cx) / 2, y2 - 0.03, z]} s={[cx - x1, 0.06, 0.07]} m={M.trim} />
      {Array.from({ length: n + 1 }, (_, i) => {
        const x = x1 + (w * i) / n;
        const top = topAt(x);
        return <B key={i} p={[x, (y1 + top) / 2, z]} s={[0.05, top - y1, 0.06]} m={M.trim} />;
      })}
    </group>
  );
}
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
        <WZ name="wall-left-kitchen" z1={-6} z2={2} x={-9} y2={H + 0.012} m={M.wallKitchen} />
        <WZ name="wall-left-siding" z1={-6.1} z2={2.1} x={-9.14} y2={H - 0.025} m={M.siding} />
        {/* Where the garage roof sweeps down over this wall at both eaves, the wall
            stops just under the roof so its top never pokes through the shingles. */}
        <WZ name="wall-right-bath" z1={-5.6} z2={-2.8} x={6} y2={H + 0.012} m={M.wallBath} />
        <WZ name="wall-right-bath-eave" z1={-6} z2={-5.6} x={6} y2={3.0} m={M.wallBath} />
        <WZ name="wall-right-utility" z1={-2.8} z2={1.6} x={6} y2={H + 0.012} m={M.wallUtility} />
        <WZ name="wall-right-utility-eave" z1={1.6} z2={2} x={6} y2={3.0} m={M.wallUtility} />

        {/* Partitions */}
        <WZ
          name="partition-kitchen-living"
          z1={-6}
          z2={-3.4}
          x={-4}
          y2={H - 0.012}
          m={M.wallWarm}
        />
        <WZ
          name="partition-living-thermostat"
          z1={-6}
          z2={-4.3}
          x={2}
          y2={H - 0.012}
          m={M.wallWarm}
        />
        <WZ z1={-4.3} z2={-3.4} x={2} y1={2.25} y2={H - 0.012} m={M.wallWarm} />
        <WZ name="partition-living-utility" z1={-3.4} z2={2} x={2} y2={H - 0.012} m={M.wallWarm} />
        <WX
          name="partition-bath-utility"
          x1={2.08}
          x2={5.92}
          z={-2.8}
          y2={H - 0.024}
          m={M.wallBath}
        />

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
      </StaticBatch>
      {/* Glass stays out of the merged batch so it never casts a shadow into the rooms. */}
      {/* see-in glass front wall above the knee walls, and a clear glass ceiling */}
      <GlassFront x1={-9} x2={0.2} z={2} y1={0.75} y2={H} />
      <GlassFront x1={2} x2={6} z={2} y1={0.75} y2={H} clip={{ x: 5.7, y: 3.0 }} />
      <B
        name="glass-ceiling"
        // stops at the garage eave (x 5.72) so its edge never shows through the garage roof
        p={[-1.665, H + 0.01, -2]}
        s={[14.77, 0.02, 8.1]}
        m={GLASS_ROOF}
        cast={false}
      />
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
