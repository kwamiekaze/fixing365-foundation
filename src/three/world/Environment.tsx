import { StaticBatch } from "./StaticBatch";
import { Environment as DreiEnv, Lightformer } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { B, C, M, daylight, glow, localHour } from "./kit";

/** Seeded random so the city layout is identical on every load. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function useDaylight() {
  return useMemo(() => daylight(localHour()), []);
}

function Sky({ day }: { day: number }) {
  const mat = useMemo(() => {
    const top = new THREE.Color("#050a18").lerp(new THREE.Color("#3f7fc4"), day);
    const horizon = new THREE.Color("#1a2238").lerp(new THREE.Color("#f3d9b5"), day);
    const dusk = 1 - Math.abs(day - 0.45) * 2.2;
    if (dusk > 0) horizon.lerp(new THREE.Color("#ff9a5a"), dusk * 0.55);
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { top: { value: top }, horizon: { value: horizon } },
      vertexShader:
        "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader:
        "uniform vec3 top; uniform vec3 horizon; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.05,0.0,1.0); gl_FragColor = vec4(mix(horizon, top, pow(h,0.7)),1.0); }",
    });
  }, [day]);
  return (
    <mesh name="sky-dome" material={mat} renderOrder={-1}>
      <sphereGeometry args={[140, 24, 16]} />
    </mesh>
  );
}

/** Procedural lit-window texture shared by every background building. */
function useWindowTexture(day: number) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 128;
    const g = c.getContext("2d")!;
    g.fillStyle = "#3a4250";
    g.fillRect(0, 0, 64, 128);
    const r = rng(7);
    for (let y = 4; y < 128; y += 10)
      for (let x = 4; x < 64; x += 10) {
        const lit = r() < (day > 0.6 ? 0.08 : 0.45);
        g.fillStyle = lit ? (r() < 0.5 ? "#ffd9a0" : "#fff1d6") : day > 0.5 ? "#7d93ab" : "#1b2130";
        g.fillRect(x, y, 6, 6);
      }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    return t;
  }, [day]);
}

/** Distant city skyline: one instanced mesh, one material, a single draw call. */
function Skyline({ day }: { day: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tex = useWindowTexture(day);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: day > 0.6 ? 0.05 : 0.9,
        roughness: 0.8,
      }),
    [tex, day],
  );
  const items = useMemo(() => {
    const r = rng(42);
    const out: { x: number; z: number; w: number; d: number; h: number }[] = [];
    // North of the street only: the camera always looks north, so buildings
    // behind it would only ever block the view on tall phone screens.
    for (let i = 0; i < 42; i++) {
      const x = -75 + r() * 150;
      const z = -26 - r() * 36;
      out.push({ x, z, w: 4 + r() * 7, d: 4 + r() * 7, h: 6 + Math.pow(r(), 2) * 38 });
    }
    return out;
  }, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    items.forEach((b, i) => {
      o.position.set(b.x, b.h / 2, b.z);
      o.scale.set(b.w, b.h, b.d);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      name="city-skyline"
      args={[undefined, undefined, items.length]}
      material={mat}
      frustumCulled={false}
    >
      <boxGeometry />
    </instancedMesh>
  );
}

/** Instanced street trees. */
function Trees() {
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo<[number, number, number][]>(
    () => [
      [-14, 4.6, 1],
      [19, 4.6, 1.1],
      [-36, 4.6, 1],
      [37, 4.6, 0.9],
      [-12, 15, 1.1],
      [0, 15, 1],
      [22, 15, 1.2],
      [-30, 15, 0.9],
      [30, 15, 1],
      [-4, -9.5, 1.3],
      [7, -9.8, 1.1],
      [-15, -8, 1.2],
    ],
    [],
  );
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    spots.forEach(([x, z, s], i) => {
      o.position.set(x, 0.9 * s, z);
      o.scale.set(s, s, s);
      o.updateMatrix();
      trunk.current!.setMatrixAt(i, o.matrix);
      o.position.set(x, 2.6 * s, z);
      o.updateMatrix();
      crown.current!.setMatrixAt(i, o.matrix);
    });
    trunk.current!.instanceMatrix.needsUpdate = true;
    crown.current!.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <group name="street-trees">
      <instancedMesh
        ref={trunk}
        args={[undefined, undefined, spots.length]}
        material={M.floorWoodDark}
        castShadow
      >
        <cylinderGeometry args={[0.12, 0.18, 1.8, 8]} />
      </instancedMesh>
      <instancedMesh
        ref={crown}
        args={[undefined, undefined, spots.length]}
        material={M.plant}
        castShadow
      >
        <icosahedronGeometry args={[1.3, 1]} />
      </instancedMesh>
    </group>
  );
}

function StreetLamp({ x, z, on }: { x: number; z: number; on: boolean }) {
  const bulb = useMemo(() => (on ? glow("#ffd9a0", 3) : M.white), [on]);
  return (
    <group name="street-lamp" position={[x, 0, z]}>
      <C p={[0, 2.2, 0]} radius={0.06} h={4.4} m={M.darkMetal} seg={8} />
      <B p={[0, 4.4, 0.35]} s={[0.12, 0.08, 0.8]} m={M.darkMetal} />
      <B p={[0, 4.33, 0.65]} s={[0.26, 0.06, 0.3]} m={bulb} cast={false} />
    </group>
  );
}

function Car({
  x,
  z,
  color,
  flip = false,
}: {
  x: number;
  z: number;
  color: string;
  flip?: boolean;
}) {
  const paint = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6 }),
    [color],
  );
  return (
    <group name="parked-car" position={[x, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]}>
      <B p={[0, 0.55, 0]} s={[3.8, 0.6, 1.7]} m={paint} />
      <B p={[-0.2, 1.05, 0]} s={[2.1, 0.5, 1.5]} m={paint} />
      <B p={[-0.2, 1.05, 0]} s={[2.0, 0.42, 1.56]} m={M.glass} cast={false} />
      {(
        [
          [-1.2, 0.8],
          [1.2, 0.8],
          [-1.2, -0.8],
          [1.2, -0.8],
        ] as [number, number][]
      ).map(([wx, wz], i) => (
        <C
          key={i}
          p={[wx, 0.34, wz]}
          r={[Math.PI / 2, 0, 0]}
          radius={0.34}
          h={0.24}
          m={M.black}
          seg={14}
        />
      ))}
    </group>
  );
}

/** Branded Fixing365 service van parked outside HQ. */
function ServiceVan() {
  return (
    <group name="fixing365-service-van" position={[-18.5, 0, 7.4]}>
      <B p={[0, 1.15, 0]} s={[4.6, 1.8, 1.9]} m={M.white} />
      <B p={[2.55, 0.85, 0]} s={[0.8, 1.2, 1.86]} m={M.white} />
      <B p={[2.62, 1.2, 0]} s={[0.72, 0.5, 1.9]} m={M.glass} cast={false} />
      <B p={[0, 0.72, 0.955]} s={[4.6, 0.22, 0.02]} m={M.orange} cast={false} />
      <B p={[0, 0.72, -0.955]} s={[4.6, 0.22, 0.02]} m={M.orange} cast={false} />
      <B p={[-0.4, 1.45, 0.96]} s={[1.6, 0.5, 0.02]} m={M.navy} cast={false} />
      <B p={[-0.4, 1.45, 0.975]} s={[0.5, 0.18, 0.01]} m={M.orange} cast={false} />
      {(
        [
          [-1.5, 0.9],
          [1.7, 0.9],
          [-1.5, -0.9],
          [1.7, -0.9],
        ] as [number, number][]
      ).map(([wx, wz], i) => (
        <C
          key={i}
          p={[wx, 0.36, wz]}
          r={[Math.PI / 2, 0, 0]}
          radius={0.36}
          h={0.26}
          m={M.black}
          seg={14}
        />
      ))}
    </group>
  );
}

export function WorldEnvironment({ shadows }: { shadows: boolean }) {
  const day = useDaylight();
  const night = day < 0.35;
  const sun = useMemo(() => {
    const h = localHour();
    const a = ((h - 6) / 12) * Math.PI;
    return new THREE.Vector3(Math.cos(a) * 18, Math.max(4, Math.sin(a) * 22), 14);
  }, []);
  const sunColor = new THREE.Color("#9fb6ff").lerp(new THREE.Color("#ffe3b8"), day);
  const bg = new THREE.Color("#0a1120").lerp(new THREE.Color("#c9d8e6"), day);

  return (
    <group name="world-environment">
      <color attach="background" args={[bg.getStyle()]} />
      <fog attach="fog" args={[bg.getStyle(), 45, 110]} />
      <Sky day={day} />
      <hemisphereLight args={[night ? "#51659a" : "#cfe6ff", "#4a3b2c", 0.5 + day * 0.8]} />
      <ambientLight intensity={0.25 + day * 0.25} />
      <directionalLight
        name="sun-key"
        position={night ? [-12, 20, 10] : sun.toArray()}
        intensity={night ? 0.55 : 1.2 + day * 1.8}
        color={sunColor}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.035}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-far={70}
      />
      <DreiEnv resolution={64} frames={1}>
        <Lightformer intensity={1.2 + day * 1.5} position={[0, 10, 4]} scale={[20, 6, 1]} />
        <Lightformer
          intensity={0.8}
          color="#ffcf9a"
          position={[-10, 3, 2]}
          rotation-y={Math.PI / 2}
          scale={[10, 4, 1]}
        />
        <Lightformer
          intensity={0.6}
          color="#8ecdf0"
          position={[10, 3, 2]}
          rotation-y={-Math.PI / 2}
          scale={[10, 4, 1]}
        />
      </DreiEnv>

      {/* Ground, street and sidewalks */}
      <mesh
        name="ground"
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        material={M.grassDark}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
      </mesh>
      <StaticBatch name="street-static">
        <B name="street" p={[0, -0.005, 9]} s={[200, 0.02, 6.4]} m={M.asphalt} cast={false} />
        {Array.from({ length: 30 }, (_, i) => (
          <B key={i} p={[-72 + i * 5, 0.01, 9]} s={[2.2, 0.01, 0.14]} m={M.trim} cast={false} />
        ))}
        <B
          name="sidewalk-north"
          p={[0, 0.06, 5.1]}
          s={[200, 0.12, 1.8]}
          m={M.sidewalk}
          cast={false}
        />
        <B
          name="sidewalk-south"
          p={[0, 0.06, 12.9]}
          s={[200, 0.12, 1.8]}
          m={M.sidewalk}
          cast={false}
        />
      </StaticBatch>
      <Skyline day={day} />
      <Trees />
      {night && <pointLight position={[-10, 4, 6]} intensity={8} distance={14} color="#ffcf8a" />}
      <StaticBatch name="street-props" version={night ? 1 : 0}>
        {[-34, -14, 15, 35].map((x) => (
          <StreetLamp key={x} x={x} z={5.6} on={night || day < 0.5} />
        ))}
        <Car x={-1} z={10.6} color="#274b7a" />
        <Car x={20} z={7.4} color="#b8b9bb" flip />
        <Car x={31} z={10.6} color="#8a1f23" />
        <ServiceVan />
      </StaticBatch>
    </group>
  );
}
