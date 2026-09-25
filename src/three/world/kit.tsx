import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useEffect, useState, type ReactNode } from "react";
import type { Vec3 } from "@/config/world";
import { rigState, world } from "./store";
import { texturize } from "./surfaces";

/**
 * Shared material library. Reusing one material per surface keeps shader
 * programs and draw state switches low, which matters most on phones.
 */
const std = (
  color: string,
  roughness = 0.7,
  metalness = 0,
  extra: THREE.MeshStandardMaterialParameters = {},
) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

export const M = {
  wall: std("#e9e3d8", 0.92),
  wallWarm: std("#d9c7ad", 0.9),
  wallKitchen: std("#c9d6d0", 0.88),
  wallBath: std("#cfd9e2", 0.6),
  wallUtility: std("#bfc5cc", 0.9),
  siding: std("#5d6b7a", 0.8),
  sidingLight: std("#8a97a4", 0.8),
  trim: std("#f4f1ea", 0.6),
  floorWood: std("#9a6b45", 0.55),
  floorWoodDark: std("#6f4a2f", 0.6),
  floorTile: std("#d8d4cc", 0.35),
  floorConcrete: std("#8d9096", 0.95),
  cabinet: std("#2f4a5a", 0.5),
  cabinetLight: std("#f1ede4", 0.45),
  counter: std("#e8e6e1", 0.18, 0.05),
  stone: std("#3a3f47", 0.3),
  steel: std("#c9ced4", 0.25, 0.85),
  chrome: std("#e8ecf0", 0.12, 1),
  darkMetal: std("#2a2f36", 0.4, 0.6),
  black: std("#14171c", 0.35, 0.2),
  screen: std("#07090d", 0.15, 0.3),
  white: std("#f6f6f3", 0.4),
  porcelain: std("#fbfbf8", 0.15),
  copper: std("#c77c48", 0.3, 0.9),
  pvc: std("#f2f2ee", 0.5),
  rust: std("#7d4a2a", 0.9, 0.2),
  water: std("#6fd6ff", 0.05, 0.1, { transparent: true, opacity: 0.55 }),
  puddle: std("#5aa9c9", 0.02, 0.2, { transparent: true, opacity: 0.45 }),
  suds: std("#ffffff", 0.4, 0, { transparent: true, opacity: 0.8 }),
  glass: std("#a9d4ea", 0.05, 0.1, { transparent: true, opacity: 0.28 }),
  fabric: std("#4a5566", 0.95),
  fabricWarm: std("#b0663c", 0.95),
  rug: std("#c9b79a", 1),
  cardboard: std("#b88a55", 0.95),
  woodLight: std("#c9a27a", 0.7),
  woodRaw: std("#b88c5c", 0.8),
  fence: std("#8a6a4a", 0.9),
  shingle: std("#3b3f46", 0.95),
  shingleDark: std("#2b2e33", 0.95),
  underlay: std("#1d1f22", 1),
  brick: std("#8e4b36", 0.9),
  grass: std("#3f6b3a", 1),
  grassDark: std("#335a30", 1),
  asphalt: std("#2a2d33", 0.95),
  sidewalk: std("#9ea2a8", 0.95),
  soil: std("#5a4330", 1),
  plant: std("#3e7a44", 0.9),
  orange: std("#ff7a1a", 0.45),
  navy: std("#0f1a2b", 0.5, 0.2),
  gutter: std("#e7e7e2", 0.4, 0.3),
  duct: std("#b8bec6", 0.35, 0.8),
};

// Photographic surfaces (Higgsfield generated, world-space mapped).
texturize(M.floorWood, "wood-floor", 0.45);
texturize(M.floorTile, "floor-tile", 0.42);
texturize(M.wallBath, "subway-tile", 0.9, "#f4f7fa");
texturize(M.siding, "siding", 0.5);
texturize(M.sidingLight, "siding", 0.5, "#c9d4de");
texturize(M.grass, "lawn", 0.22);
texturize(M.grassDark, "lawn", 0.12, "#b9c9ae");
texturize(M.shingle, "shingles", 0.45);
texturize(M.shingleDark, "shingles", 0.45, "#b5b8bd");
texturize(M.sidewalk, "pavers", 0.33);

/** Walls that fade in X-Ray mode. */
export const xrayMaterials = [
  M.wall,
  M.wallWarm,
  M.wallKitchen,
  M.wallBath,
  M.wallUtility,
  M.siding,
  M.sidingLight,
];
xrayMaterials.forEach((m) => (m.transparent = true));

/** Emissive helpers are created per use so glow can be animated independently. */
export const glow = (color: string, intensity = 2) =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    toneMapped: false,
  });

/** Fades wall materials when X-Ray mode toggles. */
export function XrayFader() {
  useFrame((_, dt) => {
    const target = world.get().xray ? 0.1 : rigState.cutaway ? 0.22 : 1;
    const k = world.get().reduced ? 1 : 1 - Math.exp(-6 * Math.min(dt, 0.05));
    for (const m of xrayMaterials) {
      m.opacity += (target - m.opacity) * k;
      const solid = m.opacity > 0.98;
      if (m.depthWrite !== solid) {
        m.depthWrite = solid;
        m.needsUpdate = true;
      }
    }
  });
  return null;
}

type MatProp = THREE.Material;
interface BoxProps {
  p?: Vec3;
  s?: Vec3;
  r?: Vec3 | undefined;
  m?: MatProp;
  name?: string | undefined;
  cast?: boolean;
  children?: ReactNode;
}
const ZERO: Vec3 = [0, 0, 0];

/** Box primitive with shared geometry. */
const unitBox = new THREE.BoxGeometry(1, 1, 1);
export function B({ p = [0, 0, 0], s = [1, 1, 1], r, m = M.white, name, cast = true }: BoxProps) {
  return (
    <mesh
      name={name ?? ""}
      geometry={unitBox}
      material={m}
      position={p}
      scale={s}
      rotation={r ?? ZERO}
      castShadow={cast}
      receiveShadow
    />
  );
}

const cylCache = new Map<string, THREE.CylinderGeometry>();
function cylGeo(rt: number, rb: number, seg: number) {
  const key = `${rt}-${rb}-${seg}`;
  let g = cylCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, 1, seg);
    cylCache.set(key, g);
  }
  return g;
}
interface CylProps {
  p?: Vec3;
  r?: Vec3 | undefined;
  radius?: number;
  top?: number | undefined;
  h?: number;
  m?: MatProp;
  seg?: number;
  name?: string | undefined;
  cast?: boolean;
}
/** Cylinder primitive. Height is applied with scale so geometry is shared. */
export function C({
  p = [0, 0, 0],
  r,
  radius = 0.1,
  top,
  h = 1,
  m = M.steel,
  seg = 16,
  name,
  cast = true,
}: CylProps) {
  return (
    <mesh
      name={name ?? ""}
      geometry={cylGeo(top ?? radius, radius, seg)}
      material={m}
      position={p}
      rotation={r ?? ZERO}
      scale={[1, h, 1]}
      castShadow={cast}
      receiveShadow
    />
  );
}

const sphereGeo = new THREE.SphereGeometry(1, 16, 12);
export function S({
  p = [0, 0, 0],
  radius = 0.1,
  m = M.white,
  name,
  s,
}: {
  p?: Vec3;
  radius?: number;
  m?: MatProp;
  name?: string | undefined;
  s?: Vec3 | undefined;
}) {
  return (
    <mesh
      name={name ?? ""}
      geometry={sphereGeo}
      material={m}
      position={p}
      scale={s ?? [radius, radius, radius]}
    />
  );
}

/** Pipe segment between two points. */
export function Pipe({
  a,
  b,
  radius = 0.04,
  m = M.copper,
  name,
}: {
  a: Vec3;
  b: Vec3;
  radius?: number;
  m?: MatProp;
  name?: string | undefined;
}) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh
      name={name ?? ""}
      geometry={cylGeo(radius, radius, 10)}
      material={m}
      position={mid}
      quaternion={q}
      scale={[1, len, 1]}
    />
  );
}

/** Local time of day in hours, with ?time=HH override for testing. */
export function localHour() {
  if (typeof window !== "undefined") {
    const o = new URLSearchParams(window.location.search).get("time");
    if (o !== null && !Number.isNaN(Number(o))) return Number(o);
  }
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}
/** 0 at night, 1 at midday, smooth dawn and dusk. */
export function daylight(hour = localHour()) {
  const x = Math.sin(((hour - 6) / 12) * Math.PI);
  return THREE.MathUtils.clamp(x * 1.6 + 0.15, 0, 1);
}

/** Local hour that stays current: rechecks every minute so evening changes happen live. */
export function useClockHour() {
  const [h, setH] = useState(localHour);
  useEffect(() => {
    const id = window.setInterval(() => setH(localHour()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return h;
}
/** After 7 PM and before sunrise: street lights on, neighbors inside. */
export const isEvening = (hour: number) => hour >= 19 || hour < 7;
