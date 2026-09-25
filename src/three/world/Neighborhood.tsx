import * as THREE from "three";
import { B, C } from "./kit";
import { StaticBatch } from "./StaticBatch";
import { RealisticTrees, type TreeSpec } from "./Foliage";

/**
 * The street around the house that needs fixing. Every neighbor is a
 * different, well-kept home: ranch, two-story colonial, Cape Cod with
 * dormers, or craftsman with a deep front porch, each with its own palette,
 * lap siding, trimmed windows with shutters and flower boxes, a brick
 * chimney, porch lights, path, hedges, flower beds and a mailbox. All of it
 * is static and merged per material, so the whole street costs a few dozen
 * draw calls.
 */

/* ---------- Procedural surface textures (drawn once, no downloads) ---------- */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = 1) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 8;
  return t;
}
function rnd(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
/** Lap siding: overlapping boards with a shadow line under each lap and faint wood grain. White so it tints to any wall colour. */
const SIDING = canvasTex(512, 512, (g) => {
  const r = rnd(3);
  const boards = 14;
  const bh = 512 / boards;
  for (let i = 0; i < boards; i++) {
    const y = i * bh;
    const grad = g.createLinearGradient(0, y, 0, y + bh);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.82, "#eeeeee");
    grad.addColorStop(1, "#bdbdbd");
    g.fillStyle = grad;
    g.fillRect(0, y, 512, bh);
    g.fillStyle = "rgba(0,0,0,0.28)";
    g.fillRect(0, y + bh - 2, 512, 2);
    for (let k = 0; k < 10; k++) {
      g.strokeStyle = `rgba(0,0,0,${0.03 + r() * 0.04})`;
      g.lineWidth = 1;
      const gy = y + 3 + r() * (bh - 7);
      g.beginPath();
      g.moveTo(r() * 512, gy);
      g.lineTo(r() * 512, gy + (r() - 0.5) * 2);
      g.stroke();
    }
  }
});
/** Architectural shingles: staggered tabs with colour variation and a shadow edge. Grey so it tints to the roof colour. */
const SHINGLES = canvasTex(
  512,
  512,
  (g) => {
    const r = rnd(9);
    const rows = 16;
    const rh = 512 / rows;
    for (let i = 0; i < rows; i++) {
      const off = (i % 2) * 18;
      for (let x = -40 + off; x < 512; x += 30 + r() * 26) {
        const w = 30 + r() * 26;
        const v = 200 + Math.floor(r() * 55);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, i * rh, w - 2, rh);
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.fillRect(x + w - 2, i * rh, 2, rh);
      }
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.fillRect(0, i * rh + rh - 3, 512, 3);
    }
  },
  0.55,
);
/** Running-bond brick with mortar lines. */
const BRICKS = canvasTex(256, 256, (g) => {
  const r = rnd(5);
  g.fillStyle = "#cfc6bb";
  g.fillRect(0, 0, 256, 256);
  const rows = 12;
  const rh = 256 / rows;
  for (let i = 0; i < rows; i++) {
    const off = (i % 2) * 16;
    for (let x = -32 + off; x < 256; x += 32) {
      const v = 0.8 + r() * 0.35;
      g.fillStyle = `rgb(${Math.round(150 * v)},${Math.round(76 * v)},${Math.round(56 * v)})`;
      g.fillRect(x + 1.5, i * rh + 1.5, 29, rh - 3);
    }
  }
});

const cache = new Map<string, THREE.MeshStandardMaterial>();
const mat = (color: string, roughness = 0.85, emissive?: string, ei = 0) => {
  const key = `${color}-${roughness}-${emissive ?? ""}-${ei}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      ...(emissive ? { emissive: new THREE.Color(emissive), emissiveIntensity: ei } : {}),
    });
    cache.set(key, m);
  }
  return m;
};

interface Palette {
  wall: string;
  trim: string;
  roof: string;
  door: string;
  shutter: string;
}
const PALETTES: Palette[] = [
  { wall: "#9cc48a", trim: "#f4f6ef", roof: "#3f4a44", door: "#b23a2e", shutter: "#2f4a36" },
  { wall: "#7fb069", trim: "#fbfaf3", roof: "#4a5b3e", door: "#1f3b63", shutter: "#f7f7f2" },
  { wall: "#b7d3a4", trim: "#ffffff", roof: "#5a4636", door: "#2e5e3e", shutter: "#5a4636" },
  { wall: "#6f9f75", trim: "#efe9d8", roof: "#2f3437", door: "#e0b43c", shutter: "#243a2c" },
  { wall: "#a9c9b3", trim: "#ffffff", roof: "#4a5566", door: "#8a2d3b", shutter: "#4a5566" },
  { wall: "#8fae6b", trim: "#f6f1e3", roof: "#5c3f2e", door: "#232a30", shutter: "#6d4a33" },
];
const FLOWERS = ["#e94f6b", "#f2c230", "#ffffff", "#b06ad9", "#ff8a3d"];

const GLASS = mat("#bcd6de", 0.15, "#f7e8b0", 0.14);
const DOORWAY = mat("#f6efb0", 0.5, "#f3e27a", 0.6);
const STONE = mat("#a9a79f", 0.95);
const BRICK = new THREE.MeshStandardMaterial({ map: BRICKS, roughness: 0.9 });
/** Textured wall and roof materials, cached per colour. */
const texCache = new Map<string, THREE.MeshStandardMaterial>();
const wallMat = (color: string) => {
  const key = `wall-${color}`;
  let m = texCache.get(key);
  if (!m)
    texCache.set(
      key,
      (m = new THREE.MeshStandardMaterial({ color, map: SIDING, roughness: 0.82 })),
    );
  return m;
};
const roofMat = (color: string) => {
  const key = `roof-${color}`;
  let m = texCache.get(key);
  if (!m)
    texCache.set(
      key,
      (m = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color).multiplyScalar(1.25),
        map: SHINGLES,
        roughness: 0.95,
      })),
    );
  return m;
};
const PAVER = mat("#cfcac0", 0.95);
const HEDGE = mat("#4f7f44", 0.95);
const HEDGE_LIGHT = mat("#679a52", 0.95);
const MULCH = mat("#5b3d28", 1);
const LAMP = mat("#fff1c9", 0.4, "#ffd98a", 1.2);
const IRON = mat("#26292d", 0.5);
const SOIL_BOX = mat("#6a4a30", 0.9);

const roofCache = new Map<string, THREE.ExtrudeGeometry>();
/** Gable roof prism: `span` across the ridge, `length` along it, ridge along local X. */
function gable(span: number, rise: number, length: number) {
  const key = `${span}-${rise}-${length}`;
  let g = roofCache.get(key);
  if (!g) {
    const s = new THREE.Shape();
    s.moveTo(-span / 2, 0);
    s.lineTo(span / 2, 0);
    s.lineTo(0, rise);
    s.closePath();
    g = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false });
    g.translate(0, 0, -length / 2);
    g.rotateY(Math.PI / 2);
    roofCache.set(key, g);
  }
  return g;
}

function Roof({
  span,
  rise,
  length,
  p,
  m,
  rotY = 0,
}: {
  span: number;
  rise: number;
  length: number;
  p: [number, number, number];
  m: THREE.Material;
  rotY?: number;
}) {
  return (
    <mesh
      geometry={gable(span, rise, length)}
      material={m}
      position={p}
      rotation={[0, rotY, 0]}
      castShadow
      receiveShadow
    />
  );
}

function Window({
  x,
  y,
  z,
  w = 1.1,
  h = 1.2,
  pal,
  shutters = true,
  box = false,
}: {
  x: number;
  y: number;
  z: number;
  w?: number;
  h?: number;
  pal: Palette;
  shutters?: boolean;
  box?: boolean;
}) {
  const trim = mat(pal.trim, 0.6);
  const sh = mat(pal.shutter, 0.7);
  return (
    <group position={[x, y, z]}>
      <B s={[w, h, 0.04]} m={GLASS} cast={false} />
      <B p={[0, 0, 0.03]} s={[0.05, h, 0.03]} m={trim} cast={false} />
      <B p={[0, 0, 0.03]} s={[w, 0.05, 0.03]} m={trim} cast={false} />
      <B p={[0, h / 2 + 0.06, 0.04]} s={[w + 0.24, 0.1, 0.08]} m={trim} />
      <B p={[0, -h / 2 - 0.05, 0.07]} s={[w + 0.2, 0.07, 0.16]} m={trim} />
      {[-1, 1].map((sd) => (
        <B
          key={sd}
          p={[sd * (w / 2 + 0.03), 0, 0.03]}
          s={[0.06, h + 0.06, 0.05]}
          m={trim}
          cast={false}
        />
      ))}
      {shutters &&
        [-1, 1].map((sd) => (
          <group key={sd} position={[sd * (w / 2 + 0.26), 0, 0.03]}>
            <B s={[0.4, h, 0.04]} m={sh} />
            {[-0.3, 0, 0.3].map((sy) => (
              <B
                key={sy}
                p={[0, sy * h, 0.025]}
                s={[0.32, 0.03, 0.01]}
                m={mat(pal.shutter, 0.5)}
                cast={false}
              />
            ))}
          </group>
        ))}
      {box && (
        <group position={[0, -h / 2 - 0.2, 0.2]}>
          <B s={[w + 0.1, 0.22, 0.24]} m={SOIL_BOX} />
          {Array.from({ length: 6 }, (_, i) => (
            <B
              key={i}
              p={[-w / 2 + 0.1 + i * (w / 5.2), 0.16, (i % 2) * 0.05]}
              s={[0.12, 0.12, 0.12]}
              m={mat(FLOWERS[i % FLOWERS.length]!, 0.8)}
            />
          ))}
        </group>
      )}
    </group>
  );
}

function Door({ x, z, pal, width = 1 }: { x: number; z: number; pal: Palette; width?: number }) {
  const trim = mat(pal.trim, 0.6);
  return (
    <group position={[x, 0, z]}>
      <B p={[0, 1.1, 0.01]} s={[width + 0.1, 2.2, 0.04]} m={DOORWAY} cast={false} />
      <B
        p={[0.2, 1.08, 0.3]}
        r={[0, -0.9, 0]}
        s={[width - 0.05, 2.12, 0.07]}
        m={mat(pal.door, 0.5)}
      />
      <B p={[0, 2.3, 0.05]} s={[width + 0.5, 0.16, 0.12]} m={trim} />
      {[-1, 1].map((sd) => (
        <B key={sd} p={[sd * (width / 2 + 0.12), 1.12, 0.04]} s={[0.12, 2.26, 0.08]} m={trim} />
      ))}
      {[-1, 1].map((sd) => (
        <group key={`l${sd}`} position={[sd * (width / 2 + 0.38), 1.7, 0.1]}>
          <B s={[0.14, 0.24, 0.12]} m={IRON} />
          <B p={[0, 0, 0.04]} s={[0.09, 0.17, 0.06]} m={LAMP} cast={false} />
        </group>
      ))}
    </group>
  );
}

function Chimney({ x, z, top, w = 0.8 }: { x: number; z: number; top: number; w?: number }) {
  return (
    <group position={[x, 0, z]}>
      <B p={[0, top / 2, 0]} s={[w, top, w]} m={BRICK} />
      <B p={[0, top + 0.06, 0]} s={[w + 0.16, 0.12, w + 0.16]} m={STONE} />
      <B p={[0, top + 0.22, 0]} s={[0.26, 0.2, 0.26]} m={IRON} />
    </group>
  );
}

function Landscaping({
  w,
  front,
  pal,
  seed,
  walkX,
}: {
  w: number;
  front: number;
  pal: Palette;
  seed: number;
  walkX: number;
}) {
  return (
    <group>
      {/* paver walk to the sidewalk and a driveway on the garage side */}
      {Array.from({ length: 4 }, (_, i) => (
        <B
          key={i}
          p={[walkX + (i % 2) * 0.04, 0.025, front + 0.9 + i * 0.62]}
          s={[1.1, 0.03, 0.54]}
          m={PAVER}
          cast={false}
        />
      ))}
      <B p={[w / 2 - 1.3, 0.02, front + 1.7]} s={[2.6, 0.02, 3.4]} m={PAVER} cast={false} />
      {/* foundation beds: mulch, a clipped hedge line and flowers */}
      {[-1, 1].map((sd) => {
        const cx = walkX + sd * (w * 0.26 + 0.6);
        return (
          <group key={sd} position={[cx, 0, front + 0.55]}>
            <B p={[0, 0.03, 0]} s={[w * 0.36, 0.05, 0.9]} m={MULCH} cast={false} />
            <B p={[0, 0.35, -0.12]} s={[w * 0.34, 0.6, 0.5]} m={seed % 2 ? HEDGE : HEDGE_LIGHT} />
            {Array.from({ length: 7 }, (_, i) => (
              <B
                key={i}
                p={[-w * 0.16 + i * (w * 0.053), 0.13, 0.28 + (i % 2) * 0.08]}
                s={[0.14, 0.16, 0.14]}
                m={mat(FLOWERS[(i + seed) % FLOWERS.length]!, 0.8)}
              />
            ))}
          </group>
        );
      })}
      {/* mailbox on a post at the sidewalk */}
      <group position={[walkX + 1.2, 0, front + 2.6]}>
        <B p={[0, 0.55, 0]} s={[0.1, 1.1, 0.1]} m={mat(pal.trim, 0.6)} />
        <B p={[0, 1.15, 0]} s={[0.24, 0.22, 0.46]} m={mat(seed % 2 ? pal.door : "#2b2f33", 0.5)} />
        <B p={[0.13, 1.22, 0.1]} s={[0.02, 0.12, 0.04]} m={mat("#c63b2b", 0.5)} />
      </group>
      {/* garden lamp */}
      <group position={[walkX - 0.9, 0, front + 2.3]}>
        <C p={[0, 0.55, 0]} radius={0.035} h={1.1} m={IRON} seg={8} />
        <B p={[0, 1.15, 0]} s={[0.18, 0.2, 0.18]} m={LAMP} cast={false} />
      </group>
    </group>
  );
}

type Style = "ranch" | "colonial" | "cape" | "craftsman";
export interface HouseSpec {
  x: number;
  z: number;
  /** 0 faces the street to the south (+z), 1 faces north (-z). */
  face: 0 | 1;
  seed: number;
  style: Style;
}

function House({ x, z, face, seed, style }: HouseSpec) {
  const pal = PALETTES[seed % PALETTES.length]!;
  const wall = wallMat(pal.wall);
  const trim = mat(pal.trim, 0.6);
  const roof = roofMat(pal.roof);
  const sizes: Record<Style, { w: number; d: number; h: number; rise: number }> = {
    ranch: { w: 8.2, d: 7.2, h: 2.9, rise: 1.8 },
    colonial: { w: 9.4, d: 7.4, h: 5.7, rise: 2.4 },
    cape: { w: 9, d: 7.2, h: 2.7, rise: 3.4 },
    craftsman: { w: 9.2, d: 6.4, h: 3.2, rise: 2.5 },
  };
  const { w, d, h, rise } = sizes[style];
  const f = d / 2;
  const walkX = style === "colonial" ? 0 : -0.9;
  return (
    <group position={[x, 0, z]} rotation={[0, face ? Math.PI : 0, 0]} name={`neighbor-${style}`}>
      {/* body on a stone foundation, lap siding on the front, corner boards */}
      <B p={[0, 0.18, 0]} s={[w + 0.1, 0.36, d + 0.1]} m={STONE} />
      <B p={[0, h / 2 + 0.18, 0]} s={[w, h - 0.36, d]} m={wall} />
      {[-1, 1].map((sd) => (
        <B
          key={sd}
          p={[sd * (w / 2 - 0.06), h / 2 + 0.18, f + 0.02]}
          s={[0.14, h - 0.36, 0.04]}
          m={trim}
          cast={false}
        />
      ))}
      <B p={[0, h + 0.02, f + 0.05]} s={[w + 0.2, 0.18, 0.1]} m={trim} />
      <Roof span={d + 1} rise={rise} length={w + 0.7} p={[0, h, 0]} m={roof} />
      {/* gable-end trim */}
      <Chimney x={-w / 2 + 1.1} z={-0.6} top={h + rise * 0.9} />

      {style === "ranch" && (
        <>
          <Window x={-w / 2 + 1.5} y={1.6} z={f + 0.03} pal={pal} box />
          <Window x={1.4} y={1.6} z={f + 0.03} w={2} pal={pal} box />
          <Door x={walkX} z={f + 0.02} pal={pal} />
          {/* attached garage wing with its own lower roof */}
          <group position={[w / 2 + 1.7, 0, 0.4]}>
            <B p={[0, 1.25, 0]} s={[3.4, 2.5, d - 0.8]} m={wall} />
            <Roof span={d - 0.2} rise={1.4} length={3.7} p={[0, 2.5, 0]} m={roof} />
            <B p={[0, 1.05, (d - 0.8) / 2 + 0.02]} s={[2.7, 2.1, 0.05]} m={trim} />
            {[0.45, 0.95, 1.45, 1.9].map((gy) => (
              <B
                key={gy}
                p={[0, gy, (d - 0.8) / 2 + 0.05]}
                s={[2.6, 0.025, 0.02]}
                m={STONE}
                cast={false}
              />
            ))}
            {[-0.8, -0.27, 0.27, 0.8].map((wx) => (
              <B
                key={wx}
                p={[wx, 1.8, (d - 0.8) / 2 + 0.06]}
                s={[0.4, 0.24, 0.02]}
                m={GLASS}
                cast={false}
              />
            ))}
          </group>
        </>
      )}

      {style === "colonial" && (
        <>
          {[-w / 2 + 1.6, -1.5, 1.5, w / 2 - 1.6].map((wx) => (
            <Window key={`u${wx}`} x={wx} y={4.3} z={f + 0.03} w={1} h={1.3} pal={pal} />
          ))}
          {[-w / 2 + 1.6, -1.5, 1.5, w / 2 - 1.6]
            .filter((wx) => Math.abs(wx) > 2)
            .map((wx) => (
              <Window key={`l${wx}`} x={wx} y={1.65} z={f + 0.03} w={1} h={1.4} pal={pal} box />
            ))}
          <Door x={0} z={f + 0.02} pal={pal} width={1.1} />
          {/* portico: two columns under a small pediment */}
          <group position={[0, 0, f + 0.9]}>
            {[-0.85, 0.85].map((cx) => (
              <C key={cx} p={[cx, 1.35, 0.3]} radius={0.1} h={2.7} m={trim} seg={12} />
            ))}
            <B p={[0, 2.78, 0.1]} s={[2.1, 0.16, 1.2]} m={trim} />
            <Roof
              span={1.3}
              rise={0.7}
              length={2.3}
              p={[0, 2.86, 0.1]}
              m={roof}
              rotY={Math.PI / 2}
            />
            <B p={[0, 0.1, 0.1]} s={[2.2, 0.2, 1.3]} m={STONE} />
          </group>
          <B p={[0, 3.05, f + 0.04]} s={[w, 0.12, 0.08]} m={trim} />
        </>
      )}

      {style === "cape" && (
        <>
          <Window x={-2.4} y={1.5} z={f + 0.03} pal={pal} box />
          <Window x={2.4} y={1.5} z={f + 0.03} pal={pal} box />
          <Door x={walkX + 0.9} z={f + 0.02} pal={pal} />
          {/* two dormers on the front slope */}
          {[-2.2, 2.2].map((dx) => (
            <group key={dx} position={[dx, h + 1.1, f - 1.1]}>
              <B p={[0, 0.5, 0]} s={[1.5, 1.2, 1.6]} m={wall} />
              <Roof
                span={1.8}
                rise={0.8}
                length={1.9}
                p={[0, 1.1, 0]}
                m={roof}
                rotY={Math.PI / 2}
              />
              <Window x={0} y={0.5} z={0.82} w={0.8} h={0.8} pal={pal} shutters={false} />
            </group>
          ))}
        </>
      )}

      {style === "craftsman" && (
        <>
          <Window x={-2.6} y={1.7} z={f + 0.03} w={1.6} pal={pal} shutters={false} box />
          <Window x={2.6} y={1.7} z={f + 0.03} w={1.6} pal={pal} shutters={false} box />
          <Door x={walkX + 0.9} z={f + 0.02} pal={pal} />
          {/* deep front porch: tapered columns on stone piers, shed roof, railings */}
          <group position={[0, 0, f + 0.8]}>
            <B p={[0, 0.2, 0]} s={[w - 0.6, 0.4, 1.6]} m={mat("#8a6a4a", 0.8)} />
            {[-w / 2 + 0.6, -1.2, 1.2 + 0.9, w / 2 - 0.6].map((cx) => (
              <group key={cx} position={[cx, 0, 0.62]}>
                <B p={[0, 0.75, 0]} s={[0.42, 0.7, 0.42]} m={STONE} />
                <C p={[0, 1.95, 0]} radius={0.12} top={0.09} h={1.7} m={trim} seg={4} />
              </group>
            ))}
            <B p={[0, 2.95, 0]} r={[0.22, 0, 0]} s={[w - 0.2, 0.14, 2.1]} m={roof} />
            <B p={[0, 2.8, 0.66]} s={[w - 0.4, 0.2, 0.14]} m={trim} />
            {[-1, 1].map((sd) => (
              <group key={sd} position={[sd * (w / 2 - 1.8), 0, 0.66]}>
                <B p={[0, 0.95, 0]} s={[1.9, 0.07, 0.07]} m={trim} />
                {Array.from({ length: 8 }, (_, i) => (
                  <B key={i} p={[-0.85 + i * 0.24, 0.68, 0]} s={[0.05, 0.55, 0.05]} m={trim} />
                ))}
              </group>
            ))}
          </group>
        </>
      )}

      <Landscaping
        w={w}
        front={style === "craftsman" ? f + 1.6 : f}
        pal={pal}
        seed={seed}
        walkX={walkX}
      />
    </group>
  );
}

const STYLES: Style[] = ["colonial", "ranch", "cape", "craftsman"];
const spec = (x: number, z: number, face: 0 | 1, seed: number): HouseSpec => ({
  x,
  z,
  face,
  seed,
  style: STYLES[seed % STYLES.length]!,
});

export const NEIGHBOR_HOMES: HouseSpec[] = [
  // Same side of the street as the house that needs fixing.
  spec(-27, -2.4, 0, 1),
  spec(29, -2.4, 0, 2),
  spec(-46, -2.4, 0, 3),
  spec(48, -2.4, 0, 4),
  spec(-65, -2.4, 0, 5),
  spec(67, -2.4, 0, 6),
  // Across the street, facing north.
  spec(-38, 21, 1, 7),
  spec(-19, 21, 1, 8),
  spec(0, 21, 1, 9),
  spec(19, 21, 1, 10),
  spec(38, 21, 1, 11),
  spec(57, 21, 1, 12),
  spec(-57, 21, 1, 13),
  // Back row behind the fence line.
  spec(-18, -21, 1, 14),
  spec(2, -21, 1, 15),
  spec(22, -21, 1, 16),
  spec(-38, -21, 1, 17),
  spec(42, -21, 1, 18),
];

/**
 * One yard tree per home, placed on the side away from the driveway. The
 * home straight across the street skips its tree so the service van parked
 * out front stays in clear view.
 */
const yardTrees: TreeSpec[] = NEIGHBOR_HOMES.filter((h) => !(h.x === 0 && h.z === 21)).map(
  ({ x, z, face, seed, style }) => {
    const half = { ranch: 4.1, colonial: 4.7, cape: 4.5, craftsman: 4.6 }[style];
    const lx = -(half + 2);
    const lz = 5.6 + (seed % 2) * 0.5;
    const f = face ? -1 : 1;
    return [x + lx * f, z + lz * f, 1 + (seed % 3) * 0.15];
  },
);

export function Neighborhood() {
  return (
    <>
      <RealisticTrees trees={yardTrees} seed={7} />
      <StaticBatch name="neighborhood">
        <group name="neighborhood-houses">
          {NEIGHBOR_HOMES.map((h) => (
            <House key={`${h.x}-${h.z}`} {...h} />
          ))}
        </group>
      </StaticBatch>
    </>
  );
}
