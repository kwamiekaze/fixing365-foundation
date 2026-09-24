import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { world } from "./store";

/**
 * Realistic vegetation on a phone budget. Trees are a bark-textured trunk
 * with limbs and a crown of alpha-cut leaf cards drawn procedurally at load
 * (hundreds of individual leaves per card, varied greens, sun-lit edges).
 * Grass is instanced crossed blade cards that sway in a light breeze.
 * Every tree in the scene shares three instanced draw calls, and all grass
 * is one draw call.
 */

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 768;

function leafTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = rng(11);
  const greens = ["#2f5a24", "#3b6b2b", "#4a7d33", "#5b8f3d", "#6f9f47", "#86b457"];
  for (let i = 0; i < 780; i++) {
    // Leaves cluster toward the middle so each card reads as a clump, not a square.
    const a = r() * Math.PI * 2;
    const d = Math.pow(r(), 0.65) * 112;
    const x = 128 + Math.cos(a) * d;
    const y = 128 + Math.sin(a) * d * 0.9;
    const lit = 1 - (y / 256) * 0.7;
    g.save();
    g.translate(x, y);
    g.rotate(r() * Math.PI * 2);
    g.fillStyle = greens[Math.min(greens.length - 1, Math.floor(r() * 3 + lit * 3))]!;
    g.beginPath();
    g.ellipse(0, 0, 3 + r() * 5, 7 + r() * 7, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(20,40,15,0.35)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(0, -6);
    g.lineTo(0, 6);
    g.stroke();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function barkTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#5b4633";
  g.fillRect(0, 0, 64, 256);
  const r = rng(5);
  for (let i = 0; i < 90; i++) {
    const x = r() * 64;
    g.strokeStyle = r() < 0.5 ? "rgba(35,25,18,0.55)" : "rgba(130,110,90,0.35)";
    g.lineWidth = 1 + r() * 2.5;
    g.beginPath();
    g.moveTo(x, 0);
    let y = 0;
    let xx = x;
    while (y < 256) {
      y += 8 + r() * 20;
      xx += (r() - 0.5) * 4;
      g.lineTo(xx, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function grassTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d")!;
  const r = rng(3);
  for (let i = 0; i < 70; i++) {
    const x = 10 + r() * 108;
    const h = 60 + r() * 64;
    const bend = (r() - 0.5) * 26;
    const shade = 90 + Math.floor(r() * 70);
    const grad = g.createLinearGradient(0, 128, 0, 128 - h);
    grad.addColorStop(0, `rgb(${40},${shade - 30},${25})`);
    grad.addColorStop(1, `rgb(${110 + Math.floor(r() * 40)},${shade + 60},${55})`);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x - 2.4, 128);
    g.quadraticCurveTo(x + bend * 0.4, 128 - h * 0.6, x + bend, 128 - h);
    g.quadraticCurveTo(x + bend * 0.4 + 1.2, 128 - h * 0.6, x + 2.4, 128);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type TreeSpec = [x: number, z: number, scale: number];

export function RealisticTrees({ trees, seed = 1 }: { trees: TreeSpec[]; seed?: number }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const limbRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const cards = isMobile() ? 40 : 70;
  const limbs = 4;

  const mats = useMemo(() => {
    const bark = barkTexture();
    return {
      bark: new THREE.MeshStandardMaterial({ map: bark, roughness: 0.95 }),
      leaf: new THREE.MeshStandardMaterial({
        map: leafTexture(),
        alphaTest: 0.36,
        side: THREE.DoubleSide,
        roughness: 0.8,
      }),
    };
  }, []);
  const geos = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.11, 0.2, 1, 9);
    trunk.translate(0, 0.5, 0);
    const limb = new THREE.CylinderGeometry(0.03, 0.07, 1, 6);
    limb.translate(0, 0.5, 0);
    return { trunk, limb, card: new THREE.PlaneGeometry(1.7, 1.7) };
  }, []);

  useLayoutEffect(() => {
    const r = rng(seed * 97 + 13);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    trees.forEach(([x, z, s], ti) => {
      const trunkH = 2.1 * s;
      o.position.set(x, 0, z);
      o.rotation.set(0, r() * 6.28, (r() - 0.5) * 0.06);
      o.scale.set(s, trunkH, s);
      o.updateMatrix();
      trunkRef.current!.setMatrixAt(ti, o.matrix);
      for (let l = 0; l < limbs; l++) {
        const a = (l / limbs) * Math.PI * 2 + r();
        o.position.set(x, trunkH * (0.62 + r() * 0.25), z);
        o.rotation.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
        o.scale.set(s, 1.3 * s, s);
        o.updateMatrix();
        limbRef.current!.setMatrixAt(ti * limbs + l, o.matrix);
      }
      const cy = trunkH + 1.2 * s;
      for (let k = 0; k < cards; k++) {
        // Cards fill an irregular, slightly flattened crown; outer cards are
        // brighter so the canopy has a lit top and a shaded underside.
        const u = r() * Math.PI * 2;
        const v = Math.acos(2 * r() - 1);
        const rad = Math.pow(r(), 0.4);
        const px = Math.sin(v) * Math.cos(u) * 1.75 * s * rad;
        const py = Math.cos(v) * 1.35 * s * rad;
        const pz = Math.sin(v) * Math.sin(u) * 1.75 * s * rad;
        o.position.set(x + px, cy + py, z + pz);
        o.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
        const sc = s * (0.8 + r() * 0.5);
        o.scale.set(sc, sc, sc);
        o.updateMatrix();
        const i = ti * cards + k;
        leafRef.current!.setMatrixAt(i, o.matrix);
        const light = 0.72 + (py / (1.35 * s) + 1) * 0.2 + r() * 0.1;
        col.setRGB(light * (0.92 + r() * 0.1), light, light * (0.85 + r() * 0.1));
        leafRef.current!.setColorAt(i, col);
      }
    });
    for (const m of [trunkRef, limbRef, leafRef]) m.current!.instanceMatrix.needsUpdate = true;
    if (leafRef.current!.instanceColor) leafRef.current!.instanceColor.needsUpdate = true;
  }, [trees, cards, seed]);

  return (
    <group name="realistic-trees">
      <instancedMesh
        ref={trunkRef}
        args={[geos.trunk, mats.bark, trees.length]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={limbRef}
        args={[geos.limb, mats.bark, trees.length * limbs]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={leafRef}
        args={[geos.card, mats.leaf, trees.length * cards]}
        receiveShadow
        frustumCulled={false}
      />
    </group>
  );
}

type Rect = [x1: number, z1: number, x2: number, z2: number];

/** Instanced grass tufts scattered over the lawns, avoiding anything in `avoid`. */
export function GrassField({ area, avoid, count }: { area: Rect; avoid: Rect[]; count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = count ?? (isMobile() ? 900 : 2400);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: grassTexture(),
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 1,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms["uTime"] = { value: 0 };
      m.userData["shader"] = shader;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nfloat sway = uv.y * uv.y * 0.07;\nvec4 wp = instanceMatrix * vec4(0.0,0.0,0.0,1.0);\ntransformed.x += sin(uTime * 1.6 + wp.x * 0.35 + wp.z * 0.2) * sway;",
        );
    };
    return m;
  }, []);
  const geometry = useMemo(() => {
    // Two crossed blade cards per tuft.
    const a = new THREE.PlaneGeometry(0.5, 0.36);
    a.translate(0, 0.18, 0);
    const b = a.clone();
    b.rotateY(Math.PI / 2);
    const merged = new THREE.BufferGeometry();
    const pos = [...a.attributes["position"]!.array, ...b.attributes["position"]!.array];
    const nor = [...a.attributes["normal"]!.array, ...b.attributes["normal"]!.array];
    const uv = [...a.attributes["uv"]!.array, ...b.attributes["uv"]!.array];
    const idx = [...a.index!.array, ...Array.from(b.index!.array, (i) => i + 4)];
    merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    merged.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    merged.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    merged.setIndex(idx);
    return merged;
  }, []);

  useLayoutEffect(() => {
    const r = rng(29);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    let placed = 0;
    let tries = 0;
    while (placed < n && tries < n * 20) {
      tries++;
      // Denser near the house, thinning toward the edges.
      const cx = (area[0] + area[2]) / 2;
      const cz = (area[1] + area[3]) / 2;
      const spread = Math.pow(r(), 0.8);
      const ang = r() * Math.PI * 2;
      const x = cx + Math.cos(ang) * spread * (area[2] - area[0]) * 0.5;
      const z = cz + Math.sin(ang) * spread * (area[3] - area[1]) * 0.5;
      if (x < area[0] || x > area[2] || z < area[1] || z > area[3]) continue;
      if (avoid.some(([x1, z1, x2, z2]) => x > x1 && x < x2 && z > z1 && z < z2)) continue;
      o.position.set(x, 0, z);
      o.rotation.set(0, r() * Math.PI, 0);
      const s = 0.7 + r() * 0.8;
      o.scale.set(s, s * (0.8 + r() * 0.6), s);
      o.updateMatrix();
      ref.current!.setMatrixAt(placed, o.matrix);
      const g = 0.8 + r() * 0.35;
      col.setRGB(g * 0.95, g, g * 0.85);
      ref.current!.setColorAt(placed, col);
      placed++;
    }
    ref.current!.count = placed;
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [area, avoid, n]);

  useFrame(({ clock }) => {
    const sh = material.userData["shader"] as
      { uniforms: { uTime: { value: number } } } | undefined;
    if (sh && !world.get().reduced) sh.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <instancedMesh
      ref={ref}
      name="grass-tufts"
      args={[geometry, material, n]}
      receiveShadow
      frustumCulled={false}
    />
  );
}
