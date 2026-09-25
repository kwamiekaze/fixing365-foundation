import { StaticBatch } from "./StaticBatch";
import { NEIGHBOR_HOMES, Neighborhood } from "./Neighborhood";
import { Neighbors } from "./Npcs";
import { ServiceVanDetailed } from "./ServiceVan";
import { GrassField, RealisticTrees, type TreeSpec } from "./Foliage";

const STREET_TREES: TreeSpec[] = [
  [-14, 4.6, 1],
  [19, 4.6, 1.1],
  [-36, 4.6, 1],
  [37, 4.6, 0.9],
  [-12, 15, 1.1],
  [22, 15, 1.2],
  [-30, 15, 0.9],
  [30, 15, 1],
  [-4, -9.5, 1.3],
  [7, -9.8, 1.1],
  [-15, -8, 1.2],
];
/** Keep grass off the house, drives, paths, street and every neighbor's footprint. */
const GRASS_AVOID: [number, number, number, number][] = [
  [-9.5, -6.4, 12.7, 2.35],
  [5.9, 2, 11.7, 4.4],
  [-0.7, 2, 2.9, 4.4],
  [-200, 4.05, 200, 14],
  [-11, -5, -9.4, -3.4],
  ...NEIGHBOR_HOMES.flatMap(({ x, z, face }): [number, number, number, number][] => {
    const f = face ? -1 : 1;
    return [
      [x - 7.8, z - 4.4, x + 7.8, z + 4.4],
      [
        Math.min(x + 3 * f, x + 5.5 * f),
        Math.min(z + 3.4 * f, z + 8.5 * f),
        Math.max(x + 3 * f, x + 5.5 * f),
        Math.max(z + 3.4 * f, z + 8.5 * f),
      ],
    ];
  }),
];
import { Environment as DreiEnv, Lightformer, Sparkles } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { B, C, M, daylight, glow, isEvening, localHour, useClockHour } from "./kit";

export function useDaylight() {
  const h = useClockHour();
  return useMemo(() => daylight(h), [h]);
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

/**
 * Painted panoramic horizon (generated with Higgsfield): tree lines and
 * distant rooftops wrapped on an open cylinder beyond the fog. The lower band
 * keeps the painting; the upper sky blends into the live sky dome colours so
 * the time of day still reads. One draw call, one texture.
 */
function Backdrop({ day }: { day: number }) {
  const mat = useMemo(() => {
    const top = new THREE.Color("#050a18").lerp(new THREE.Color("#3f7fc4"), day);
    const horizon = new THREE.Color("#1a2238").lerp(new THREE.Color("#f3d9b5"), day);
    // Night: dim, cool. Dusk: full painting. Midday: slightly bleached.
    const tint = new THREE.Color("#3b4666").lerp(
      new THREE.Color("#ffffff"),
      Math.min(1, day * 2.2),
    );
    const uMap = { value: null as THREE.Texture | null };
    const uHas = { value: 0 };
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        map: uMap,
        hasMap: uHas,
        top: { value: top },
        horizon: { value: horizon },
        tint: { value: tint },
        skyMix: { value: THREE.MathUtils.smoothstep(day, 0.45, 0.85) },
      },
      vertexShader:
        "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: [
        "uniform sampler2D map; uniform float hasMap; uniform vec3 top; uniform vec3 horizon; uniform vec3 tint; uniform float skyMix;",
        "varying vec2 vUv;",
        "void main(){",
        "  vec3 sky = mix(horizon, top, pow(clamp((vUv.y-0.18)*1.4,0.0,1.0),0.7));",
        "  vec3 img = texture2D(map, vUv).rgb * tint;",
        "  float band = 1.0 - smoothstep(0.34, 0.62, vUv.y);",
        "  float keep = hasMap * max(band, 1.0 - skyMix);",
        "  gl_FragColor = vec4(mix(sky, img, keep), 1.0);",
        "  #include <tonemapping_fragment>",
        "  #include <colorspace_fragment>",
        "}",
      ].join("\n"),
    });
    new THREE.TextureLoader().load("/f365/backdrop.webp", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.MirroredRepeatWrapping;
      t.repeat.set(3, 1);
      uMap.value = t;
      uHas.value = 1;
    });
    return m;
  }, [day]);
  return (
    <mesh name="horizon-backdrop" material={mat} position={[0, 15, 0]} renderOrder={-1}>
      <cylinderGeometry args={[118, 118, 40, 48, 1, true]} />
    </mesh>
  );
}

const beamMat = new THREE.MeshBasicMaterial({
  color: "#ffd9a0",
  transparent: true,
  opacity: 0.07,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const poolMat = new THREE.MeshBasicMaterial({
  color: "#ffcf8a",
  transparent: true,
  opacity: 0.28,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const haloMat = new THREE.MeshBasicMaterial({
  color: "#fff0d0",
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});

/** A lit street lamp at night: real light, a soft beam, a warm pool on the pavement and a glow at the bulb. */
function LampGlow({ x, z, strong }: { x: number; z: number; strong: boolean }) {
  return (
    <group name="street-lamp-glow" position={[x, 0, z]}>
      <pointLight
        position={[0, 4.1, 0]}
        intensity={strong ? 30 : 18}
        distance={16}
        decay={1.5}
        color="#ffd9a0"
      />
      <mesh material={beamMat} position={[0, 2.1, 0]}>
        <coneGeometry args={[1.9, 4.2, 24, 1, true]} />
      </mesh>
      <mesh material={poolMat} position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 32]} />
      </mesh>
      <mesh material={haloMat} position={[0, 4.28, 0]}>
        <sphereGeometry args={[0.28, 12, 10]} />
      </mesh>
    </group>
  );
}

function StreetLamp({ x, z, on }: { x: number; z: number; on: boolean }) {
  const bulb = useMemo(() => (on ? glow("#ffe2b0", 5) : M.white), [on]);
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

export function WorldEnvironment({ shadows }: { shadows: boolean }) {
  const day = useDaylight();
  const night = day < 0.35;
  const lampsOn = isEvening(useClockHour());
  const sun = useMemo(() => {
    const h = localHour();
    const a = ((h - 6) / 12) * Math.PI;
    return new THREE.Vector3(Math.cos(a) * 18, Math.max(4, Math.sin(a) * 22), 14);
  }, []);
  // Warm golden light when the sun is low, clean warm white at midday,
  // moonlit blue at night.
  const golden = 1 - Math.abs(day - 0.5) * 2;
  const sunColor = new THREE.Color("#9fb6ff")
    .lerp(new THREE.Color("#fff1dc"), day)
    .lerp(new THREE.Color("#ffb877"), Math.max(0, golden) * 0.6);
  const bg = new THREE.Color("#0a1120").lerp(new THREE.Color("#c9d8e6"), day);
  const haze = new THREE.Color("#141c33").lerp(new THREE.Color("#ecd9bf"), day);
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <group name="world-environment">
      <color attach="background" args={[bg.getStyle()]} />
      <fog attach="fog" args={[haze.getStyle(), 42, 112]} />
      <Sky day={day} />
      <hemisphereLight args={[night ? "#51659a" : "#dcebff", "#6b5238", 0.45 + day * 0.75]} />
      <ambientLight intensity={0.18 + day * 0.2} />
      <directionalLight
        name="sun-key"
        position={night ? [-12, 20, 10] : sun.toArray()}
        intensity={night ? 0.6 : 1.6 + day * 1.9}
        color={sunColor}
        castShadow={shadows}
        shadow-mapSize={mobile ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-radius={4}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-far={70}
      />
      {/* Cool rim from behind the house so rooflines separate from the sky. */}
      <directionalLight
        name="rim"
        position={[-8, 9, -18]}
        intensity={night ? 0.35 : 0.5 + day * 0.4}
        color={night ? "#7f9cff" : "#cfe2ff"}
      />
      {!mobile && day < 0.55 && (
        <Sparkles
          name="dusk-fireflies"
          count={40}
          scale={[26, 3, 14]}
          position={[1, 1.4, 2]}
          size={3}
          speed={0.25}
          opacity={0.8}
          color="#ffd98a"
        />
      )}
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
      <Backdrop day={day} />
      <RealisticTrees trees={STREET_TREES} />
      <GrassField area={[-38, -16, 42, 27]} avoid={GRASS_AVOID} />
      <Neighborhood />
      <Neighbors />
      <ServiceVanDetailed position={[5.2, 0, 10.85]} />
      {/* Street lights actually light the street after 7 PM: a warm pool under each lamp near the house. */}
      {lampsOn &&
        [-25, -5, 9, 28].map((x) => <LampGlow key={x} x={x} z={6.25} strong={Math.abs(x) < 12} />)}
      <StaticBatch name="street-props" version={lampsOn ? 1 : 0}>
        {/* Lamps sit midway between the street trees so no pole ever runs through a crown. */}
        {[-25, -5, 9, 28].map((x) => (
          <StreetLamp key={x} x={x} z={5.6} on={lampsOn} />
        ))}
        <Car x={24} z={10.6} color="#274b7a" />
        <Car x={20} z={7.4} color="#b8b9bb" flip />
        <Car x={31} z={10.6} color="#8a1f23" />
      </StaticBatch>
    </group>
  );
}
