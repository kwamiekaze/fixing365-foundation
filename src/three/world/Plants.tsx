import { useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "@/config/world";
import { StaticBatch } from "./StaticBatch";

/**
 * Indoor potted plants. Leaves are real leaf silhouettes (pointed, with a
 * slight cup along the midrib) in several greens, lit lighter on top; pots
 * are turned on a lathe with a rim, taper and soil. Each plant merges into
 * a few draw calls.
 */

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

/** Leaf blade: pointed ellipse along +Y, cupped along the midrib. */
function leafGeometry(w: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(w * 0.62, h * 0.22, w * 0.58, h * 0.72, 0, h);
  s.bezierCurveTo(-w * 0.58, h * 0.72, -w * 0.62, h * 0.22, 0, 0);
  const g = new THREE.ShapeGeometry(s, 10);
  const pos = g.attributes["position"]!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Cup the blade and let the tip droop forward a little.
    pos.setZ(i, Math.abs(x) * 0.55 * (w > 0 ? 1 : 0) - (y / h) * (y / h) * h * 0.18);
  }
  g.computeVertexNormals();
  return g;
}

const LEAF_G = {
  broad: leafGeometry(0.16, 0.24),
  narrow: leafGeometry(0.06, 0.3),
  small: leafGeometry(0.06, 0.08),
};
const LEAVES = ["#2f6b2c", "#3b7d34", "#4d8f3c", "#5e9f46", "#2a5e2a"].map(
  (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, side: THREE.DoubleSide }),
);
const STEM = new THREE.MeshStandardMaterial({ color: "#4a6b32", roughness: 0.8 });
const SOIL = new THREE.MeshStandardMaterial({ color: "#3a2a1c", roughness: 1 });
const POTS = {
  terracotta: new THREE.MeshStandardMaterial({ color: "#b8643e", roughness: 0.85 }),
  white: new THREE.MeshStandardMaterial({ color: "#f1efe9", roughness: 0.35 }),
  charcoal: new THREE.MeshStandardMaterial({ color: "#2e3237", roughness: 0.5 }),
};

function potGeometry(r: number, h: number) {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(r * 0.72, 0),
    new THREE.Vector2(r * 0.8, h * 0.08),
    new THREE.Vector2(r * 0.94, h * 0.82),
    new THREE.Vector2(r * 1.04, h * 0.84),
    new THREE.Vector2(r * 1.06, h),
    new THREE.Vector2(r * 0.9, h),
    new THREE.Vector2(r * 0.88, h * 0.9),
  ];
  return new THREE.LatheGeometry(pts, 28);
}

type Kind = "fiddle" | "snake" | "herb" | "fern";

export function PottedPlant({
  p,
  kind = "fiddle",
  scale = 1,
  pot = "white",
  seed = 1,
}: {
  p: Vec3;
  kind?: Kind;
  scale?: number;
  pot?: keyof typeof POTS;
  seed?: number;
}) {
  const parts = useMemo(() => {
    const r = rng(seed * 31 + 7);
    const potR = kind === "herb" ? 0.075 : kind === "fern" ? 0.16 : 0.17;
    const potH = kind === "herb" ? 0.12 : kind === "snake" ? 0.28 : 0.34;
    const leaves: {
      pos: Vec3;
      rot: [number, number, number];
      s: number;
      g: THREE.BufferGeometry;
      m: THREE.Material;
    }[] = [];
    const stems: { a: THREE.Vector3; b: THREE.Vector3 }[] = [];
    if (kind === "snake") {
      for (let i = 0; i < 11; i++) {
        const a = r() * Math.PI * 2;
        const d = r() * potR * 0.6;
        leaves.push({
          pos: [Math.cos(a) * d, potH, Math.sin(a) * d],
          rot: [(r() - 0.5) * 0.25, a, (r() - 0.5) * 0.25],
          s: 1.6 + r() * 1.3,
          g: LEAF_G.narrow,
          m: LEAVES[i % 5]!,
        });
      }
    } else if (kind === "herb") {
      for (let i = 0; i < 26; i++) {
        const a = r() * Math.PI * 2;
        const el = 0.2 + r() * 1.1;
        const len = 0.04 + r() * 0.09;
        const base = new THREE.Vector3(Math.cos(a) * 0.02, potH, Math.sin(a) * 0.02);
        const tip = base
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos(a) * Math.cos(el) * len,
              Math.sin(el) * len + 0.03,
              Math.sin(a) * Math.cos(el) * len,
            ),
          );
        stems.push({ a: base, b: tip });
        leaves.push({
          pos: tip.toArray() as Vec3,
          rot: [-(Math.PI / 2 - el) * 0.9, a + Math.PI / 2, 0],
          s: 0.9 + r() * 0.5,
          g: LEAF_G.small,
          m: LEAVES[(i + 2) % 5]!,
        });
      }
    } else {
      // Fiddle-leaf or fern: stems rising from the pot, leaves along each.
      const stemsN = kind === "fern" ? 9 : 4;
      for (let k = 0; k < stemsN; k++) {
        const a = (k / stemsN) * Math.PI * 2 + r() * 0.6;
        const lean = kind === "fern" ? 0.9 + r() * 0.35 : 0.12 + r() * 0.18;
        const len = kind === "fern" ? 0.45 + r() * 0.2 : 0.8 + r() * 0.55;
        const base = new THREE.Vector3(Math.cos(a) * 0.03, potH - 0.02, Math.sin(a) * 0.03);
        const dir = new THREE.Vector3(
          Math.cos(a) * Math.sin(lean),
          Math.cos(lean),
          Math.sin(a) * Math.sin(lean),
        );
        const tip = base.clone().addScaledVector(dir, len);
        stems.push({ a: base, b: tip });
        const n = kind === "fern" ? 7 : 5;
        for (let j = 1; j <= n; j++) {
          const t = j / n;
          const at = base.clone().addScaledVector(dir, len * t);
          const side = j % 2 ? 1 : -1;
          const la = a + side * (0.9 + r() * 0.5);
          leaves.push({
            pos: at.toArray() as Vec3,
            rot: [-(0.5 + r() * 0.5), la, (r() - 0.5) * 0.4],
            s: (kind === "fern" ? 0.55 : 0.8) * (1.1 - t * 0.35) * (0.85 + r() * 0.3),
            g: kind === "fern" ? LEAF_G.narrow : LEAF_G.broad,
            m: LEAVES[(j + k) % 5]!,
          });
        }
      }
    }
    return { leaves, stems, potR, potH, potGeo: potGeometry(potR, potH) };
  }, [kind, seed]);

  return (
    <group position={p} scale={scale} name={`plant-${kind}`}>
      <StaticBatch name={`plant-${kind}-${seed}`}>
        <mesh geometry={parts.potGeo} material={POTS[pot]} castShadow receiveShadow />
        <mesh material={SOIL} position={[0, parts.potH * 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[parts.potR * 0.88, 20]} />
        </mesh>
        {parts.stems.map((st, i) => {
          const mid = st.a.clone().add(st.b).multiplyScalar(0.5);
          const d = st.b.clone().sub(st.a);
          const q = new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            d.clone().normalize(),
          );
          return (
            <mesh key={`s${i}`} material={STEM} position={mid} quaternion={q}>
              <cylinderGeometry args={[0.006, 0.009, d.length(), 5]} />
            </mesh>
          );
        })}
        {parts.leaves.map((l, i) => (
          <mesh
            key={i}
            geometry={l.g}
            material={l.m}
            position={l.pos}
            rotation={l.rot}
            scale={l.s}
            castShadow
          />
        ))}
      </StaticBatch>
    </group>
  );
}
