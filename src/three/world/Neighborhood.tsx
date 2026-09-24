import { useMemo } from "react";
import * as THREE from "three";
import { B, C, S } from "./kit";
import { StaticBatch } from "./StaticBatch";

/**
 * The street around the repair house: tidy suburban homes in the soft green
 * palette of the reference illustration, each with a gabled roof, chimney,
 * glowing doorway, windows, porch steps, driveway, lawn, tree and fence.
 * Everything here is static and merged into a handful of draw calls, so a
 * whole block costs about as much as one room.
 */
const mat = (color: string, roughness = 0.85, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });

const WALLS = [mat("#86bd74"), mat("#7cb46b"), mat("#93c682"), mat("#72a862")];
const ROOFS = [mat("#4f7f47", 0.9), mat("#44733f", 0.9), mat("#5a8c50", 0.9)];
const TRIM = mat("#eef3e8", 0.6);
const DOOR = mat("#4a6b3f", 0.6);
const DOORWAY = mat("#f6f0a8", 0.5, {
  emissive: new THREE.Color("#f3e27a"),
  emissiveIntensity: 0.55,
});
const WINDOW = mat("#cfe3ea", 0.2, {
  metalness: 0.2,
  emissive: new THREE.Color("#f7e8b0"),
  emissiveIntensity: 0.12,
});
const STEP = mat("#b9bcbf", 0.95);
const DRIVE = mat("#c9ccce", 0.95);
const CROWN = mat("#6fa860", 0.9);
const CROWN_DARK = mat("#5c9450", 0.9);
const TRUNK = mat("#6d7c55", 0.9);
const PICKET = mat("#f4f6f0", 0.6);

const roofCache = new Map<string, THREE.ExtrudeGeometry>();
/** Gable roof as a triangular prism, ridge along the house width. */
function roofGeometry(depth: number, rise: number, width: number) {
  const key = `${depth}-${rise}-${width}`;
  let g = roofCache.get(key);
  if (!g) {
    const s = new THREE.Shape();
    s.moveTo(-depth / 2, 0);
    s.lineTo(depth / 2, 0);
    s.lineTo(0, rise);
    s.closePath();
    g = new THREE.ExtrudeGeometry(s, { depth: width, bevelEnabled: false });
    g.translate(0, 0, -width / 2);
    g.rotateY(Math.PI / 2);
    roofCache.set(key, g);
  }
  return g;
}

interface HouseSpec {
  x: number;
  z: number;
  /** 0 faces the street to the south (+z), 1 faces north (-z). */
  face: 0 | 1;
  seed: number;
}

function House({ x, z, face, seed }: HouseSpec) {
  const w = 8.5 + (seed % 3) * 1.1;
  const d = 7 + (seed % 2) * 0.8;
  const h = 3 + (seed % 2) * 0.4;
  const rise = 2.1 + (seed % 3) * 0.25;
  const wall = WALLS[seed % WALLS.length]!;
  const roof = ROOFS[seed % ROOFS.length]!;
  const garage = seed % 2 === 0;
  const dz = d / 2;
  return (
    <group position={[x, 0, z]} rotation={[0, face ? Math.PI : 0, 0]} name="neighbor-house">
      {/* driveway and front path */}
      <B p={[w / 2 - 1.2, 0.025, dz + 2.3]} s={[2.4, 0.02, 4.4]} m={DRIVE} cast={false} />
      <B p={[-0.6, 0.03, dz + 1.6]} s={[0.9, 0.02, 3.2]} m={DRIVE} cast={false} />
      {/* body, base band and roof */}
      <B p={[0, h / 2, 0]} s={[w, h, d]} m={wall} />
      <B p={[0, 0.12, 0]} s={[w + 0.08, 0.24, d + 0.08]} m={STEP} />
      <mesh
        geometry={roofGeometry(d + 0.9, rise, w + 0.7)}
        material={roof}
        position={[0, h, 0]}
        castShadow
        receiveShadow
      />
      <B p={[0, h + 0.05, dz + 0.42]} s={[w + 0.7, 0.14, 0.06]} m={TRIM} />
      {/* chimney */}
      <B p={[-w / 2 + 1.4, h + rise * 0.75, -0.8]} s={[0.8, rise * 1.1, 0.8]} m={wall} />
      <B p={[-w / 2 + 1.4, h + rise * 1.32, -0.8]} s={[0.95, 0.14, 0.95]} m={roof} />
      {/* front door with warm glowing doorway and steps */}
      <B p={[-0.6, 1.1, dz + 0.02]} s={[1.2, 2.2, 0.06]} m={DOORWAY} cast={false} />
      <B p={[-0.25, 1.1, dz + 0.3]} r={[0, -0.9, 0]} s={[0.95, 2.1, 0.06]} m={DOOR} />
      <B p={[-0.6, 2.27, dz + 0.05]} s={[1.5, 0.14, 0.1]} m={TRIM} />
      <B p={[-0.6, 0.15, dz + 0.5]} s={[1.8, 0.3, 0.9]} m={STEP} />
      <B p={[-0.6, 0.07, dz + 1.05]} s={[1.8, 0.14, 0.5]} m={STEP} />
      {/* windows */}
      {[-w / 2 + 1.5, 1.4].map((wx) => (
        <group key={wx} position={[wx, 1.65, dz + 0.02]}>
          <B s={[1.2, 1.1, 0.04]} m={WINDOW} cast={false} />
          <B p={[0, 0, 0.03]} s={[0.05, 1.1, 0.03]} m={TRIM} cast={false} />
          <B p={[0, 0, 0.03]} s={[1.2, 0.05, 0.03]} m={TRIM} cast={false} />
          <B p={[0, -0.6, 0.06]} s={[1.4, 0.08, 0.14]} m={TRIM} />
        </group>
      ))}
      {garage ? (
        <group position={[w / 2 - 1.2, 0, dz + 0.02]}>
          <B p={[0, 1.05, 0]} s={[2.2, 2.1, 0.05]} m={TRIM} />
          {[0.4, 0.9, 1.4, 1.9].map((gy) => (
            <B key={gy} p={[0, gy, 0.03]} s={[2.1, 0.03, 0.02]} m={STEP} cast={false} />
          ))}
        </group>
      ) : (
        <group position={[w / 2 - 1.3, 1.65, dz + 0.02]}>
          <B s={[1.2, 1.1, 0.04]} m={WINDOW} cast={false} />
          <B p={[0, 0, 0.03]} s={[0.05, 1.1, 0.03]} m={TRIM} cast={false} />
        </group>
      )}
      {/* side windows */}
      <B p={[w / 2 + 0.02, 1.65, 0]} s={[0.04, 1, 1.2]} m={WINDOW} cast={false} />
      <B p={[-w / 2 - 0.02, 1.65, 0.6]} s={[0.04, 1, 1.2]} m={WINDOW} cast={false} />
      {/* yard tree */}
      <group position={[-w / 2 - 1.6, 0, dz + 2.4 + (seed % 2)]}>
        <C p={[0, 1.1, 0]} radius={0.16} top={0.12} h={2.2} m={TRUNK} seg={8} />
        <S p={[0, 2.9, 0]} radius={1.35} s={[1.35, 1.25, 1.35]} m={seed % 2 ? CROWN : CROWN_DARK} />
        <S p={[0.5, 3.6, 0.2]} radius={0.9} s={[0.9, 0.85, 0.9]} m={CROWN} />
      </group>
      {/* shrubs under the windows */}
      {[-w / 2 + 1.1, -w / 2 + 2.0, 1.1, 1.9].map((sx) => (
        <S key={sx} p={[sx, 0.35, dz + 0.55]} radius={0.42} s={[0.45, 0.38, 0.4]} m={CROWN_DARK} />
      ))}
      {/* white picket fence along the front */}
      <B p={[-(w + 6) / 4 - 1.1, 0.55, dz + 2.6]} s={[(w + 6) / 2 - 2.2, 0.08, 0.06]} m={PICKET} />
      {Array.from({ length: 11 }, (_, i) => (
        <B
          key={i}
          p={[-(w + 6) / 2 + 0.3 + i * 0.36, 0.45, dz + 2.6]}
          s={[0.1, 0.9, 0.05]}
          m={PICKET}
        />
      ))}
      <B
        p={[w / 2 + 0.6, 0.6, dz + 2.6]}
        s={[0.12, 1.2, 0.12]}
        m={DOOR}
        name="neighbor-mailbox-post"
      />
      <B p={[w / 2 + 0.6, 1.25, dz + 2.6]} s={[0.26, 0.24, 0.46]} m={wall} />
    </group>
  );
}

export function Neighborhood() {
  const homes = useMemo<HouseSpec[]>(
    () => [
      // Same side of the street as the repair house (front near z = 2).
      { x: -27, z: -2.4, face: 0, seed: 1 },
      { x: 29, z: -2.4, face: 0, seed: 2 },
      { x: -46, z: -2.4, face: 0, seed: 3 },
      { x: 48, z: -2.4, face: 0, seed: 4 },
      { x: -65, z: -2.4, face: 0, seed: 5 },
      { x: 67, z: -2.4, face: 0, seed: 6 },
      // Across the street, facing north toward the house.
      { x: -38, z: 21, face: 1, seed: 7 },
      { x: -19, z: 21, face: 1, seed: 8 },
      { x: 0, z: 21, face: 1, seed: 9 },
      { x: 19, z: 21, face: 1, seed: 10 },
      { x: 38, z: 21, face: 1, seed: 11 },
      { x: 57, z: 21, face: 1, seed: 12 },
      { x: -57, z: 21, face: 1, seed: 13 },
      // Back row behind the fence line, facing the next street over.
      { x: -18, z: -21, face: 1, seed: 14 },
      { x: 2, z: -21, face: 1, seed: 15 },
      { x: 22, z: -21, face: 1, seed: 16 },
      { x: -38, z: -21, face: 1, seed: 17 },
      { x: 42, z: -21, face: 1, seed: 18 },
    ],
    [],
  );
  return (
    <StaticBatch name="neighborhood">
      <group name="neighborhood-houses">
        {homes.map((h) => (
          <House key={`${h.x}-${h.z}`} {...h} />
        ))}
      </group>
    </StaticBatch>
  );
}
