import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Vec3 } from "@/config/world";
import { world } from "./store";

const dropGeo = new THREE.SphereGeometry(1, 6, 5);

/**
 * Instanced water stream. One draw call per stream. Particles launch from
 * `origin` with velocity `dir` plus random spread and fall under gravity.
 */
export function Stream({
  origin,
  dir,
  spread = 0.3,
  count = 40,
  size = 0.022,
  life = 0.9,
  gravity = 9.8,
  material,
  name = "fx-stream",
}: {
  origin: Vec3;
  dir: Vec3;
  spread?: number;
  count?: number;
  size?: number;
  life?: number;
  gravity?: number;
  material: THREE.Material;
  name?: string;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        t: (i / count) * life,
        sx: Math.random() - 0.5,
        sy: Math.random() - 0.5,
        sz: Math.random() - 0.5,
      })),
    [count, life],
  );
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const reduced = world.get().reduced;
    seeds.forEach((s, i) => {
      if (!reduced) s.t = (s.t + Math.min(dt, 0.05)) % life;
      const t = s.t;
      o.position.set(
        origin[0] + (dir[0] + s.sx * spread) * t,
        origin[1] + (dir[1] + s.sy * spread) * t - 0.5 * gravity * t * t,
        origin[2] + (dir[2] + s.sz * spread) * t,
      );
      const k = size * (1 - (t / life) * 0.5);
      o.scale.set(k, k * 1.6, k);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} name={name} args={[dropGeo, material, count]} frustumCulled={false} />
  );
}

/** Single falling drip that restarts every `period` seconds. */
export function Drip({
  from,
  fall = 0.8,
  period = 1.6,
  material,
}: {
  from: Vec3;
  fall?: number;
  period?: number;
  material: THREE.Material;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = world.get().reduced ? 0 : (clock.elapsedTime % period) / period;
    const f = Math.max(0, (t - 0.55) / 0.45);
    ref.current.position.set(from[0], from[1] - f * f * fall, from[2]);
    const s = 0.018 + (t < 0.55 ? t * 0.02 : 0.011);
    ref.current.scale.set(s, s * 1.4, s);
  });
  return (
    <mesh
      ref={ref}
      geometry={dropGeo}
      material={material}
      name="fx-drip"
      userData={{ dynamic: true }}
    />
  );
}

/** Toggles visibility on a rhythm, e.g. an error code or chirping LED. */
export function Blink({
  period = 1,
  duty = 0.5,
  children,
}: {
  period?: number;
  duty?: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.visible = world.get().reduced || (clock.elapsedTime % period) / period < duty;
  });
  return (
    <group ref={ref} userData={{ dynamic: true }}>
      {children}
    </group>
  );
}

/** Irregular flicker for a failing light. Animates emissive intensity and an optional light. */
export function useFlicker(
  material: THREE.MeshStandardMaterial,
  base: number,
  on: boolean,
  light?: React.RefObject<THREE.PointLight | null>,
  lightBase = 1,
) {
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let k = 1;
    if (on && !world.get().reduced) {
      const n = Math.sin(t * 23) * Math.sin(t * 7.3) + Math.sin(t * 51);
      k = n > 1.1 ? 0.15 : Math.sin(t * 3.1) > 0.93 ? 0.35 : 1;
    }
    material.emissiveIntensity = base * k;
    if (light?.current) light.current.intensity = lightBase * k;
  });
}

/** Rotates children about an axis. */
export function Spin({
  speed = 1,
  axis = "y",
  children,
  position,
}: {
  speed?: number;
  axis?: "x" | "y" | "z";
  children: ReactNode;
  position?: Vec3 | undefined;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current || world.get().reduced) return;
    ref.current.rotation[axis] += speed * Math.min(dt, 0.05);
  });
  return (
    <group ref={ref} position={position ?? [0, 0, 0]} userData={{ dynamic: true }}>
      {children}
    </group>
  );
}
