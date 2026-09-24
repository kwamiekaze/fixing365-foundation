import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getSpot, getZone, homeView, tour, type CameraView } from "@/config/world";
import { useWorld, world } from "./store";

/** Seconds without a tap, scroll or key before the cinematic tour starts. */
const IDLE_TOUR_S = 10;
/** Seconds after the last drag before the held shot starts breathing again. */
const RESUME_DRIFT_S = 3;

/** Eases in and out with no kick at either end. */
function smootherstep(x: number) {
  const k = Math.min(1, Math.max(0, x));
  return k * k * k * (k * (k * 6 - 15) + 10);
}
/** Smootherstep with a thread of constant speed, so moves never park dead. */
function glide(x: number) {
  const k = Math.min(1, Math.max(0, x));
  return smootherstep(k) * 0.86 + k * 0.14;
}

/** Pull the camera back on tall screens so the same composition fits a phone. */
function framed(view: CameraView, aspect: number) {
  const target = new THREE.Vector3(...view.target);
  const offset = new THREE.Vector3(...view.position).sub(target);
  const k = aspect < 1.3 ? Math.min(2.8, Math.pow(1.3 / aspect, 0.9)) : 1;
  return { position: target.clone().add(offset.multiplyScalar(k)), target };
}

type Mode = "fly" | "hold" | "free" | "tour";
interface Leg {
  fromP: THREE.Vector3;
  fromT: THREE.Vector3;
  toP: THREE.Vector3;
  toT: THREE.Vector3;
  start: number;
  dur: number;
  lift: number;
}

/** Crane move: eased dolly, target leads slightly, and the camera rises over walls mid-flight. */
function flightDuration(a: THREE.Vector3, b: THREE.Vector3) {
  return Math.min(8.5, Math.max(1.6, 1.3 + Math.sqrt(a.distanceTo(b)) * 0.75));
}
function sampleLeg(leg: Leg, now: number, outP: THREE.Vector3, outT: THREE.Vector3) {
  const k = Math.min(1, (now - leg.start) / leg.dur);
  const e = smootherstep(k);
  outP.lerpVectors(leg.fromP, leg.toP, e);
  outP.y += Math.sin(Math.PI * e) * leg.lift;
  outT.lerpVectors(leg.fromT, leg.toT, glide(Math.min(1, k * 1.08)));
  return k;
}
function makeLeg(
  fromP: THREE.Vector3,
  fromT: THREE.Vector3,
  toP: THREE.Vector3,
  toT: THREE.Vector3,
  start: number,
): Leg {
  const d = fromP.distanceTo(toP);
  return {
    fromP: fromP.clone(),
    fromT: fromT.clone(),
    toP: toP.clone(),
    toT: toT.clone(),
    start,
    dur: flightDuration(fromP, toP),
    lift: Math.min(5, d * 0.2),
  };
}

/**
 * Every camera move in the scene runs through here.
 * fly: a timed crane move to a new framing.
 * hold: the framing breathes, a slow arc and sway so a still shot stays alive.
 * free: the visitor is dragging; we stay out of the way.
 * tour: after a quiet spell, the camera walks the whole neighborhood.
 * Closing a card never moves the camera; only choosing a new view does.
 */
export function CameraRig({ canRotate }: { canRotate: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const spotId = useWorld((s) => s.spot);
  const zoneId = useWorld((s) => s.zone);
  const nonce = useWorld((s) => s.viewNonce);
  const aspect = size.width / Math.max(1, size.height);

  const view = useMemo(
    () => framed(getSpot(spotId)?.view ?? getZone(zoneId)?.view ?? homeView, aspect),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spotId, zoneId, aspect, nonce],
  );
  const stops = useMemo(
    () => tour.map((s) => ({ ...s, framed: framed(s.view, aspect) })),
    [aspect],
  );

  const st = useRef({
    mode: "fly" as Mode,
    leg: null as Leg | null,
    anchorP: new THREE.Vector3(),
    anchorT: new THREE.Vector3(),
    holdStart: 0,
    holdScale: 1,
    lastInput: 0,
    dragging: false,
    tourIndex: 0,
    tourPhase: "enter" as "enter" | "hold" | "travel",
    tourPhaseStart: 0,
    tourLeg: null as Leg | null,
  });
  const tmpP = useRef(new THREE.Vector3());
  const tmpT = useRef(new THREE.Vector3());
  const off = useRef(new THREE.Vector3());

  const now = () => performance.now() / 1000;

  const setLimits = (mode: Mode) => {
    const c = controls.current;
    if (!c) return;
    if (mode === "hold" || mode === "free") {
      const o = off.current.copy(st.current.anchorP).sub(st.current.anchorT);
      const az = Math.atan2(o.x, o.z);
      const d = o.length();
      const spread = world.get().spot ? 0.5 : 0.65;
      c.minAzimuthAngle = az - spread;
      c.maxAzimuthAngle = az + spread;
      c.minDistance = d * 0.88;
      c.maxDistance = d * 1.12;
    } else {
      c.minAzimuthAngle = -Infinity;
      c.maxAzimuthAngle = Infinity;
      c.minDistance = 0.1;
      c.maxDistance = 400;
    }
  };

  const enterHold = (p: THREE.Vector3, t: THREE.Vector3) => {
    const s = st.current;
    s.anchorP.copy(p);
    s.anchorT.copy(t);
    s.holdStart = now();
    s.holdScale = Math.min(1, s.anchorP.distanceTo(s.anchorT) / 12);
    s.mode = "hold";
    setLimits("hold");
  };

  const flyTo = (p: THREE.Vector3, t: THREE.Vector3) => {
    const c = controls.current;
    if (!c) return;
    const s = st.current;
    if (world.get().reduced) {
      camera.position.copy(p);
      c.target.copy(t);
      c.update();
      enterHold(p, t);
      return;
    }
    s.leg = makeLeg(camera.position, c.target, p, t, now());
    s.mode = "fly";
    setLimits("fly");
  };

  // A new view (spot, zone or back to the house) is the only thing that moves the camera.
  useEffect(() => {
    if (world.get().touring) return;
    flyTo(view.position, view.target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const stopTour = () => {
    const s = st.current;
    if (s.mode !== "tour") return;
    world.set({ touring: false, tourCaption: null, explored: true });
    const c = controls.current;
    if (c) enterHold(camera.position.clone(), c.target.clone());
  };

  // Any tap, scroll, key or drag counts as the visitor being present.
  useEffect(() => {
    st.current.lastInput = now();
    const mark = () => {
      st.current.lastInput = now();
      stopTour();
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", mark, opts);
    window.addEventListener("wheel", mark, opts);
    window.addEventListener("keydown", mark);
    window.addEventListener("touchstart", mark, opts);
    const c = controls.current;
    const start = () => {
      const s = st.current;
      s.dragging = true;
      s.lastInput = now();
      if (s.mode === "fly" || s.mode === "hold") s.mode = "free";
      world.set({ explored: true });
    };
    const end = () => {
      st.current.dragging = false;
      st.current.lastInput = now();
    };
    c?.addEventListener("start", start);
    c?.addEventListener("end", end);
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("wheel", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("touchstart", mark);
      c?.removeEventListener("start", start);
      c?.removeEventListener("end", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTour = (t: number) => {
    const s = st.current;
    const w = world.get();
    world.set({ touring: true, xray: false, card: w.card === "full" ? "compact" : w.card });
    if (w.spot) world.set({ spot: null });
    s.mode = "tour";
    s.tourIndex = 0;
    s.tourPhase = "enter";
    const first = stops[0]!;
    s.tourLeg = makeLeg(
      camera.position,
      controls.current!.target,
      first.framed.position,
      first.framed.target,
      t,
    );
    setLimits("tour");
  };

  // Projection shift keeps the subject clear of the headline and the cards.
  const shift = useRef({ x: 0, y: 0 });
  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const w = world.get();
    const wide = aspect > 1.2;
    const want = { x: 0, y: 0 };
    if (!w.touring) {
      if (w.spot && w.card === "full" && wide) want.x = size.width * 0.19;
      else if (w.spot && w.card === "full") want.y = size.height * 0.2;
      else if (w.spot && w.card === "compact") want.y = size.height * (wide ? 0.06 : 0.1);
      else if (wide && !w.explored) want.x = -size.width * 0.11;
    }
    const k = w.reduced ? 1 : 1 - Math.exp(-2.4 * Math.min(dt, 0.05));
    const s = shift.current;
    const nx = s.x + (want.x - s.x) * k;
    const ny = s.y + (want.y - s.y) * k;
    const on = want.x !== 0 || want.y !== 0;
    if (Math.abs(nx - s.x) < 0.05 && Math.abs(ny - s.y) < 0.05 && Boolean(cam.view?.enabled) === on)
      return;
    s.x = Math.abs(nx - want.x) < 0.5 ? want.x : nx;
    s.y = Math.abs(ny - want.y) < 0.5 ? want.y : ny;
    if (s.x === 0 && s.y === 0) cam.clearViewOffset();
    else cam.setViewOffset(size.width, size.height, s.x, s.y, size.width, size.height);
  });

  useFrame(() => {
    const c = controls.current;
    if (!c) return;
    const s = st.current;
    const t = now();
    const w = world.get();
    const P = tmpP.current;
    const T = tmpT.current;

    if (w.reduced) {
      c.update();
      return;
    }

    // Quiet for a while, nothing open to read, hero on screen: roll the tour.
    const idle = t - s.lastInput > IDLE_TOUR_S;
    const reading = w.spot !== null && w.card !== "hidden";
    const heroVisible = typeof window === "undefined" || window.scrollY < window.innerHeight * 0.6;
    if (s.mode !== "tour" && s.mode !== "fly" && idle && !reading && !s.dragging && heroVisible)
      startTour(t);

    if (s.mode === "fly" && s.leg) {
      const k = sampleLeg(s.leg, t, P, T);
      camera.position.copy(P);
      c.target.copy(T);
      if (k >= 1) enterHold(s.leg.toP, s.leg.toT);
    } else if (s.mode === "hold") {
      // A held frame still breathes: a slow arc around the subject and a
      // sway on two periods that never line up, like a hand holding the shot.
      const e = t - s.holdStart;
      const ramp = smootherstep(e / 2.5);
      const yaw = Math.sin((e * Math.PI * 2) / 22) * (w.spot ? 0.07 : 0.16) * ramp;
      off.current.copy(s.anchorP).sub(s.anchorT).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      P.copy(s.anchorT).add(off.current);
      P.x += Math.sin(e * 0.35) * 0.05 * s.holdScale * ramp;
      P.y += Math.sin(e * 0.2555 + 1.4) * 0.04 * s.holdScale * ramp;
      camera.position.copy(P);
      c.target.copy(s.anchorT);
    } else if (s.mode === "free") {
      if (!s.dragging && t - s.lastInput > RESUME_DRIFT_S)
        enterHold(camera.position.clone(), c.target.clone());
    } else if (s.mode === "tour") {
      const stop = stops[s.tourIndex]!;
      if (s.tourPhase === "enter" || s.tourPhase === "travel") {
        const k = sampleLeg(s.tourLeg!, t, P, T);
        if (k >= 1) {
          s.tourPhase = "hold";
          s.tourPhaseStart = t;
          world.set({ tourCaption: stop.caption });
        }
      } else {
        // Slow push-in while holding, then crane on to the next stop.
        const e = (t - s.tourPhaseStart) / stop.hold;
        const push = glide(e) * 0.07;
        P.lerpVectors(stop.framed.position, stop.framed.target, push);
        P.y += Math.sin(t * 0.3) * 0.03;
        T.copy(stop.framed.target);
        if (e >= 1) {
          const next = (s.tourIndex + 1) % stops.length;
          const to = stops[next]!;
          s.tourLeg = makeLeg(P, T, to.framed.position, to.framed.target, t);
          s.tourIndex = next;
          s.tourPhase = "travel";
          world.set({ tourCaption: null });
        }
      }
      camera.position.copy(P);
      c.target.copy(T);
    }
    c.update();
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
      minPolarAngle={0.2}
      maxPolarAngle={1.45}
    />
  );
}
