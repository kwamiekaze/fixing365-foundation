import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getSpot, getZone, homeView, tour, type CameraView } from "@/config/world";
import { resetRigInput, rigInput, rigState, useWorld, world } from "./store";

/** Seconds without a tap, scroll or key before the cinematic tour starts. */
const IDLE_TOUR_S =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("notour")
    ? Infinity
    : 25;

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
const BASE_FOV = 40;

function framed(view: CameraView, aspect: number, close = false) {
  const target = new THREE.Vector3(...view.target);
  const offset = new THREE.Vector3(...view.position).sub(target);
  if (close) {
    // Close-ups are indoors: pulling back on a tall screen would put walls
    // between camera and subject. Keep the camera where it is and widen the
    // lens instead, so a phone sees what a desktop sees across.
    const k = aspect < 1.3 ? 1.08 : 1;
    const hfov = 2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) * 1.6);
    const vfov =
      aspect < 1.3
        ? Math.min(66, (2 * Math.atan(Math.tan(hfov / 2) / aspect) * 180) / Math.PI)
        : BASE_FOV;
    return { position: target.clone().add(offset.multiplyScalar(k)), target, fov: vfov };
  }
  const k = aspect < 1.3 ? Math.min(2.8, Math.pow(1.3 / aspect, 0.9)) : 1;
  return { position: target.clone().add(offset.multiplyScalar(k)), target, fov: BASE_FOV };
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

/** House footprint, used to cut away walls between the camera and a subject inside. */
const HOUSE = { x1: -9.3, x2: 6.2, z1: -6.2, z2: 2.2, top: 3.3 };
const inside = (v: THREE.Vector3, m = 0): boolean =>
  v.x > HOUSE.x1 - m && v.x < HOUSE.x2 + m && v.z > HOUSE.z1 - m && v.z < HOUSE.z2 + m;

/**
 * Every camera move in the scene runs through here.
 * fly: a timed crane move to a new framing.
 * hold: the framing breathes, a slow arc and sway so a still shot stays alive.
 * tour: after a quiet spell, the camera walks the whole neighborhood.
 * On top of fly and hold, the visitor's gestures apply exactly as on the
 * KleanupCrew office: drag orbits a full 360, vertical drag tilts, pinch or
 * wheel zooms in close. Closing a card never moves the camera.
 */
export function CameraRig() {
  const { camera, size } = useThree();
  const spotId = useWorld((s) => s.spot);
  const zoneId = useWorld((s) => s.zone);
  const nonce = useWorld((s) => s.viewNonce);
  const aspect = size.width / Math.max(1, size.height);

  const view = useMemo(
    () => {
      const spot = getSpot(spotId);
      return spot
        ? framed(
            spot.view,
            aspect,
            spot.zone === "house" &&
              spot.area !== "Exterior" &&
              spot.area !== "Welcome" &&
              !spot.xray,
          )
        : framed(getZone(zoneId)?.view ?? homeView, aspect);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spotId, zoneId, aspect, nonce],
  );
  const stops = useMemo(
    () => tour.map((s) => ({ ...s, framed: framed(s.view, aspect, Boolean(s.close)) })),
    [aspect],
  );

  const st = useRef({
    mode: "hold" as Mode,
    leg: null as Leg | null,
    anchorP: new THREE.Vector3().fromArray(homeView.position),
    anchorT: new THREE.Vector3().fromArray(homeView.target),
    holdStart: 0,
    holdScale: 1,
    tourIndex: 0,
    tourPhase: "enter" as "enter" | "hold" | "travel",
    tourPhaseStart: 0,
    tourLeg: null as Leg | null,
    look: new THREE.Vector3().fromArray(homeView.target),
    fov: BASE_FOV,
    baseP: new THREE.Vector3().fromArray(homeView.position),
    baseT: new THREE.Vector3().fromArray(homeView.target),
  });
  const P = useRef(new THREE.Vector3()).current;
  const T = useRef(new THREE.Vector3()).current;
  const off = useRef(new THREE.Vector3()).current;
  const desired = useRef(new THREE.Vector3()).current;
  const now = () => performance.now() / 1000;

  const enterHold = (p: THREE.Vector3, t: THREE.Vector3) => {
    const s = st.current;
    s.anchorP.copy(p);
    s.anchorT.copy(t);
    s.holdStart = now();
    s.holdScale = Math.min(1, s.anchorP.distanceTo(s.anchorT) / 12);
    s.mode = "hold";
  };

  // A new view (spot, zone or Back) is the only thing that moves the camera.
  useEffect(() => {
    if (world.get().touring) return;
    const s = st.current;
    resetRigInput();
    if (world.get().reduced) {
      enterHold(view.position, view.target);
      s.fov = view.fov;
      return;
    }
    s.leg = makeLeg(s.baseP, s.baseT, view.position, view.target, now());
    s.fov = view.fov;
    s.mode = "fly";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const stopTour = () => {
    const s = st.current;
    if (s.mode !== "tour") return;
    world.set({ touring: false, tourCaption: null, explored: true });
    resetRigInput();
    enterHold(camera.position.clone(), s.look.clone());
  };

  // Any tap, scroll or key counts as the visitor being present.
  useEffect(() => {
    rigInput.lastInput = now();
    const mark = () => {
      rigInput.lastInput = now();
      stopTour();
    };
    const opts = { passive: true } as const;
    window.addEventListener("pointerdown", mark, opts);
    window.addEventListener("wheel", mark, opts);
    window.addEventListener("keydown", mark);
    return () => {
      window.removeEventListener("pointerdown", mark);
      window.removeEventListener("wheel", mark);
      window.removeEventListener("keydown", mark);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTour = (t: number) => {
    const s = st.current;
    const w = world.get();
    world.set({ touring: true, xray: false, card: w.card === "full" ? "compact" : w.card });
    if (w.spot) world.set({ spot: null });
    resetRigInput();
    s.mode = "tour";
    s.tourIndex = 0;
    s.tourPhase = "enter";
    const first = stops[0]!;
    s.tourLeg = makeLeg(camera.position, s.look, first.framed.position, first.framed.target, t);
    s.fov = first.framed.fov;
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
      else if (w.spot === "welcome" && w.card === "compact" && wide) want.x = -size.width * 0.12;
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

  useFrame((_, rawDt) => {
    const s = st.current;
    const t = now();
    const dt = Math.min(rawDt, 0.05);
    const w = world.get();
    const i = rigInput;

    // Quiet for a while, nothing open to read, hero on screen: roll the tour.
    const idle = t - i.lastInput > IDLE_TOUR_S;
    const reading = w.spot !== null && w.card !== "hidden";
    const heroVisible = window.scrollY < window.innerHeight * 0.6;
    if (
      !w.reduced &&
      s.mode !== "tour" &&
      s.mode !== "fly" &&
      idle &&
      !reading &&
      !i.dragging &&
      heroVisible
    )
      startTour(t);

    // 1. Where the shot wants to be before the visitor's gestures.
    if (s.mode === "fly" && s.leg) {
      const k = sampleLeg(s.leg, t, P, T);
      if (k >= 1) enterHold(s.leg.toP, s.leg.toT);
    } else if (s.mode === "tour") {
      const stop = stops[s.tourIndex]!;
      if (s.tourPhase !== "hold") {
        if (sampleLeg(s.tourLeg!, t, P, T) >= 1) {
          s.tourPhase = "hold";
          s.tourPhaseStart = t;
          world.set({ tourCaption: stop.caption });
        }
      } else {
        const e = (t - s.tourPhaseStart) / stop.hold;
        P.lerpVectors(stop.framed.position, stop.framed.target, glide(e) * 0.07);
        P.y += Math.sin(t * 0.3) * 0.03;
        T.copy(stop.framed.target);
        if (e >= 1) {
          const next = (s.tourIndex + 1) % stops.length;
          const to = stops[next]!;
          s.tourLeg = makeLeg(P, T, to.framed.position, to.framed.target, t);
          s.fov = to.framed.fov;
          s.tourIndex = next;
          s.tourPhase = "travel";
          world.set({ tourCaption: null });
        }
      }
    }
    if (s.mode === "hold") {
      // A held frame still breathes: a slow arc and a sway on two periods
      // that never line up, like a hand holding the shot.
      const e = t - s.holdStart;
      const ramp = w.reduced ? 0 : smootherstep(e / 2.5);
      const yaw =
        Math.sin((e * Math.PI * 2) / 22) * (w.spot && w.spot !== "welcome" ? 0.07 : 0.16) * ramp;
      off.copy(s.anchorP).sub(s.anchorT).applyAxisAngle(THREE.Object3D.DEFAULT_UP, yaw);
      P.copy(s.anchorT).add(off);
      P.x += Math.sin(e * 0.35) * 0.05 * s.holdScale * ramp;
      P.y += Math.sin(e * 0.2555 + 1.4) * 0.04 * s.holdScale * ramp;
      T.copy(s.anchorT);
    }
    s.baseP.copy(P);
    s.baseT.copy(T);

    // 2. The visitor's gestures on top: full 360 orbit, tilt and zoom.
    off.copy(P).sub(T);
    const dist = Math.max(off.length(), 0.001);
    const yaw = Math.atan2(off.x, off.z) + i.dragX;
    const pitch = Math.min(1.42, Math.max(0.04, Math.asin(off.y / dist) + i.dragY * 0.7));
    // Zooming in is a real dolly: far shots travel most of the way in, close
    // shots stop just short of the subject. Zooming out stays restrained.
    const pullIn = dist > 12 ? 0.85 : dist > 5 ? 0.7 : 0.55;
    const scale = i.zoom < 0 ? 1 + i.zoom * pullIn : 1 + i.zoom * 0.6;
    // Turning away from the framed side pulls wide shots in, so a full 360
    // circles the neighborhood instead of swinging out into the skyline.
    const turned = Math.min(1, Math.abs(i.dragX) / (Math.PI / 2));
    const orbitDist = dist > 22 ? dist + (22 - dist) * smootherstep(turned) : dist;
    const radius = Math.max(0.7, orbitDist * scale);
    desired.set(
      T.x + Math.sin(yaw) * Math.cos(pitch) * radius,
      T.y + Math.sin(pitch) * radius,
      T.z + Math.cos(yaw) * Math.cos(pitch) * radius,
    );
    desired.y = Math.max(0.3, desired.y);

    // 3. Ease the real camera onto it, so drags glide rather than snap.
    const touchFirst = size.width < 768;
    const k = w.reduced ? 1 : 1 - Math.exp(-(s.mode === "tour" ? 9 : touchFirst ? 8 : 5.5) * dt);
    camera.position.lerp(desired, k);
    s.look.lerp(T, k);
    camera.lookAt(s.look);
    rigState.target.copy(s.look);
    const dbg = (window as unknown as { __rig?: { dist: number } }).__rig;
    if (dbg) dbg.dist = camera.position.distanceTo(s.look);
    const cam = camera as THREE.PerspectiveCamera;
    const fov = Math.min(72, Math.max(22, s.fov + i.zoom * 16));
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov += (fov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }

    // Looking into the house from outside at eye level: cut the walls away.
    // The front of the house is already open, so only the back and side walls need it.
    const cp = camera.position;
    const behindWall = cp.z < HOUSE.z1 || cp.x < HOUSE.x1 || cp.x > HOUSE.x2;
    rigState.cutaway = !w.xray && inside(s.look) && behindWall && cp.y < HOUSE.top + 1.2;
  });

  return null;
}
