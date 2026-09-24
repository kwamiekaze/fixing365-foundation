import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getSpot, getZone, homeView, type CameraView } from "@/config/world";
import { useWorld, world } from "./store";

/** Pull the camera back on tall screens so the same composition fits a phone. */
function framed(view: CameraView, aspect: number) {
  const target = new THREE.Vector3(...view.target);
  const offset = new THREE.Vector3(...view.position).sub(target);
  const k = aspect < 1.3 ? Math.min(2.8, Math.pow(1.3 / aspect, 0.9)) : 1;
  return { position: target.clone().add(offset.multiplyScalar(k)), target };
}

export function CameraRig({ canRotate }: { canRotate: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const spotId = useWorld((s) => s.spot);
  const zoneId = useWorld((s) => s.zone);
  const flying = useRef(true);
  const aspect = size.width / Math.max(1, size.height);

  const view = useMemo(() => {
    const v = getSpot(spotId)?.view ?? getZone(zoneId)?.view ?? homeView;
    return framed(v, aspect);
  }, [spotId, zoneId, aspect]);

  const limits = useMemo(() => {
    const off = view.position.clone().sub(view.target);
    const az = Math.atan2(off.x, off.z);
    const dist = off.length();
    const spread = spotId ? 0.45 : 0.6;
    return { minAz: az - spread, maxAz: az + spread, minD: dist * 0.9, maxD: dist * 1.1 };
  }, [view, spotId]);

  useEffect(() => {
    flying.current = true;
    if (world.get().reduced && controls.current) {
      camera.position.copy(view.position);
      controls.current.target.copy(view.target);
      controls.current.update();
      flying.current = false;
    }
  }, [view, camera]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => {
      flying.current = false;
      world.set({ explored: true });
    };
    c.addEventListener("start", stop);
    return () => c.removeEventListener("start", stop);
  }, []);

  // Shift the projection so the subject is not hidden: right of the headline
  // during the intro, left of the side panel on desktop, above the bottom
  // sheet on phones.
  const shift = useRef({ x: 0, y: 0 });
  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const w = world.get();
    const wide = aspect > 1.2;
    const want = { x: 0, y: 0 };
    if (w.spot && wide) want.x = size.width * 0.19;
    else if (w.spot) want.y = size.height * 0.2;
    else if (wide && !w.explored) want.x = -size.width * 0.11;
    const k = w.reduced ? 1 : 1 - Math.exp(-4 * Math.min(dt, 0.05));
    const s = shift.current;
    const nx = s.x + (want.x - s.x) * k;
    const ny = s.y + (want.y - s.y) * k;
    if (
      Math.abs(nx - s.x) < 0.05 &&
      Math.abs(ny - s.y) < 0.05 &&
      cam.view?.enabled === (want.x !== 0 || want.y !== 0)
    )
      return;
    s.x = Math.abs(nx - want.x) < 0.5 ? want.x : nx;
    s.y = Math.abs(ny - want.y) < 0.5 ? want.y : ny;
    if (s.x === 0 && s.y === 0) cam.clearViewOffset();
    else cam.setViewOffset(size.width, size.height, s.x, s.y, size.width, size.height);
  });

  useFrame((_, dt) => {
    const c = controls.current;
    if (!c || !flying.current) return;
    const t = 1 - Math.exp(-3.2 * Math.min(dt, 0.05));
    camera.position.lerp(view.position, t);
    c.target.lerp(view.target, t);
    c.update();
    if (camera.position.distanceTo(view.position) < 0.01 && c.target.distanceTo(view.target) < 0.01)
      flying.current = false;
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      enableZoom={false}
      enableRotate={canRotate}
      rotateSpeed={0.5}
      minAzimuthAngle={limits.minAz}
      maxAzimuthAngle={limits.maxAz}
      minPolarAngle={0.35}
      maxPolarAngle={1.42}
      minDistance={limits.minD}
      maxDistance={limits.maxD}
    />
  );
}
