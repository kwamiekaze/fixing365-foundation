import { Billboard } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { getSpot } from "@/config/world";
import { StaticBatch } from "./StaticBatch";
import { useWorld, world } from "./store";

const ringGeo = new THREE.RingGeometry(0.2, 0.26, 40);
const discGeo = new THREE.CircleGeometry(0.17, 32);
const barGeo = new THREE.PlaneGeometry(0.05, 0.14);
const dotGeo = new THREE.CircleGeometry(0.032, 16);
const hitGeo = new THREE.SphereGeometry(0.5, 8, 6);
const haloGeo = new THREE.CircleGeometry(0.42, 32);
/** Soft radial glow behind each marker so it reads as light, not a sticker. */
function makeHalo() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,0.5)");
  r.addColorStop(0.4, "rgba(255,255,255,0.18)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  return new THREE.MeshBasicMaterial({
    map: t,
    color: "#ff9a4a",
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}
let halos: [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial] | null = null;
function getHalos() {
  if (!halos) {
    const a = makeHalo();
    const b = a.clone();
    b.color.set("#5dffa0");
    halos = [a, b];
  }
  return halos;
}
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
const tmp = new THREE.Vector3();
const white = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });

/**
 * Wraps the 3D objects that make up one problem. Tapping any of them, or the
 * floating marker, selects the spot. Name convention: spot-<id>.
 */
export function Hotspot({
  id,
  children,
  live = false,
}: {
  id: string;
  children: ReactNode;
  /** Skip batching when children animate on their own. */ live?: boolean;
}) {
  const spot = getSpot(id);
  const selected = useWorld((s) => s.spot === id);
  const visible = useWorld(
    (s) =>
      spot !== undefined &&
      s.zone === spot.zone &&
      s.xray === Boolean(spot.xray) &&
      (s.spot === null || s.spot === "welcome") &&
      !s.touring,
  );
  const fixed = useWorld((s) => Boolean(s.fixed[id]));
  const [hover, setHover] = useState(false);
  const ring = useRef<THREE.Mesh>(null);
  const disc = useRef<THREE.Group>(null);
  const ringMat = useRef(
    new THREE.MeshBasicMaterial({
      color: "#ff7a1a",
      transparent: true,
      toneMapped: false,
      depthWrite: false,
    }),
  );
  const discMat = useRef(new THREE.MeshBasicMaterial({ color: "#ff7a1a", toneMapped: false }));

  const holder = useRef<THREE.Group>(null);
  useFrame(({ clock, camera }) => {
    // Keep markers a steady size on screen: small when zoomed in close.
    if (holder.current && spot) {
      const d = camera.position.distanceTo(holder.current.getWorldPosition(tmp));
      holder.current.scale.setScalar(Math.min(1.25, Math.max(0.28, d / 7)));
    }
    const color = fixed ? "#3ddc84" : "#ff7a1a";
    discMat.current.color.set(color);
    ringMat.current.color.set(color);
    if (!ring.current || !disc.current) return;
    const reduced = world.get().reduced;
    const t = reduced ? 0.4 : (clock.elapsedTime * 0.8 + id.length * 0.13) % 1;
    ring.current.scale.setScalar(1 + t * 1.2);
    ringMat.current.opacity = (1 - t) * 0.85;
    const s = hover || selected ? 1.25 : 1;
    disc.current.scale.lerp(new THREE.Vector3(s, s, s), 0.2);
  });

  if (!spot) return <>{children}</>;
  const choose = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // A drag that happens to end on an object is a camera move, not a tap.
    if (e.delta > 8) return;
    world.selectSpot(id);
  };
  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHover(true);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHover(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group name={`spot-${id}`}>
      <group onClick={choose} onPointerOver={over} onPointerOut={out}>
        {live ? (
          children
        ) : (
          <StaticBatch name={`batch-${id}`} version={fixed ? 1 : 0}>
            {children}
          </StaticBatch>
        )}
      </group>
      {visible && (
        <Billboard position={spot.marker} name={`marker-${id}`} ref={holder}>
          <group onClick={choose} onPointerOver={over} onPointerOut={out}>
            <mesh geometry={hitGeo} material={hitMat} />
            <mesh geometry={haloGeo} material={getHalos()[fixed ? 1 : 0]} renderOrder={9} />
            <mesh ref={ring} geometry={ringGeo} material={ringMat.current} renderOrder={10} />
            <group ref={disc}>
              <mesh geometry={discGeo} material={discMat.current} renderOrder={11} />
              {fixed ? (
                <group renderOrder={12}>
                  <mesh
                    geometry={barGeo}
                    material={white}
                    position={[0.03, 0.005, 0.001]}
                    rotation={[0, 0, -0.7]}
                    scale={[1, 1.25, 1]}
                  />
                  <mesh
                    geometry={barGeo}
                    material={white}
                    position={[-0.045, -0.025, 0.001]}
                    rotation={[0, 0, 0.8]}
                    scale={[1, 0.55, 1]}
                  />
                </group>
              ) : (
                <group>
                  <mesh geometry={barGeo} material={white} position={[0, 0.03, 0.001]} />
                  <mesh geometry={dotGeo} material={white} position={[0, -0.075, 0.001]} />
                </group>
              )}
            </group>
          </group>
        </Billboard>
      )}
      {selected && (
        <pointLight
          position={spot.marker}
          intensity={fixed ? 7 : 9}
          distance={5}
          decay={1.4}
          color={fixed ? "#e9fff2" : "#fff0d8"}
        />
      )}
    </group>
  );
}
