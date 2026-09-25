import * as THREE from "three";
import { useSyncExternalStore } from "react";
import { getSpot, type ZoneId } from "@/config/world";

/** Shared world state. Plain module store so the DOM overlay and the R3F canvas read the same values. */
export interface WorldState {
  zone: ZoneId;
  spot: string | null;
  xray: boolean;
  /** Neighborhood sound on or off (off until the visitor turns it on). */
  sound: boolean;
  fixed: Record<string, boolean>;
  reduced: boolean;
  /** Set when a user drags or picks a view, used to hide the intro copy. */
  explored: boolean;
  /** Selected spot's card: a short title card, the full details, or tucked away. */
  card: "compact" | "full" | "hidden";
  /** True while the idle cinematic tour is flying the camera. */
  touring: boolean;
  /** Caption for the tour stop currently on screen. */
  tourCaption: string | null;
  /** Bumped on every navigation so choosing the same view again still re-frames it. */
  viewNonce: number;
  /** performance.now() when the scroll story last fixed something, for the camera push-in. */
  fixedAt: number;
  /** Play-the-fix showcase from the welcome card: fixing every problem in turn, then the drone orbit. */
  showcase: "off" | "fixing" | "orbit";
  /** Lower-third caption shown while the showcase plays. */
  showcaseCaption: ShowcaseCaption | null;
}

export interface ShowcaseCaption {
  kicker: string;
  title: string;
  /** True once the problem on screen has been fixed. */
  done?: boolean;
  /** 1-based position and total, for the progress bar. */
  step?: [number, number];
}

let state: WorldState = {
  zone: "house",
  spot: "welcome",
  xray: false,
  sound: false,
  fixed: {},
  reduced: false,
  explored: false,
  card: "compact",
  touring: false,
  tourCaption: null,
  viewNonce: 0,
  fixedAt: 0,
  showcase: "off",
  showcaseCaption: null,
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const world = {
  get: () => state,
  set(patch: Partial<WorldState>) {
    state = { ...state, ...patch };
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  selectSpot(id: string | null) {
    const spot = getSpot(id);
    if (!spot)
      return world.set({
        spot: null,
        touring: false,
        tourCaption: null,
        viewNonce: state.viewNonce + 1,
      });
    world.set({
      spot: spot.id,
      zone: spot.zone,
      explored: true,
      card: "compact",
      viewNonce: state.viewNonce + 1,
      touring: false,
      tourCaption: null,
      xray: spot.xray ? true : state.xray,
    });
  },
  /** Change how much of the selected spot's card is showing. Never moves the camera. */
  setCard(card: WorldState["card"]) {
    world.set({ card });
  },
  goZone(zone: ZoneId) {
    world.set({
      zone,
      spot: null,
      touring: false,
      tourCaption: null,
      viewNonce: state.viewNonce + 1,
      explored: zone !== "house" || state.explored,
    });
  },
  back() {
    const nonce = state.viewNonce + 1;
    if (state.spot) return world.set({ spot: null, viewNonce: nonce });
    world.set({ zone: "house", viewNonce: nonce });
  },
  toggleFix(id: string) {
    world.set({ fixed: { ...state.fixed, [id]: !state.fixed[id] } });
  },
};

export function useWorld<T>(select: (s: WorldState) => T): T {
  return useSyncExternalStore(
    world.subscribe,
    () => select(state),
    () => select(state),
  );
}

export const useFixed = (id: string) => useWorld((s) => Boolean(s.fixed[id]));
export const useXray = () => useWorld((s) => s.xray);
export const useReduced = () => useWorld((s) => s.reduced);

// With ?debug, expose the store for automated visual checks.
if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug")) {
  (window as unknown as { __world: typeof world }).__world = world;
  queueMicrotask(
    () => ((window as unknown as { __rig: unknown }).__rig = { rigInput, rigState, dist: 0 }),
  );
}

/**
 * Live gesture input, KleanupCrew style: drag orbits a full 360, vertical
 * drag tilts, pinch or wheel zooms. Mutable on purpose, read every frame.
 */
export const rigInput = { dragX: 0, dragY: 0, zoom: 0, dragging: false, lastInput: 0 };
/** What the camera is looking at right now. Streaming reads this. */
export const rigState = {
  /** Camera rig mode, read by the showcase director to know when a move has landed. */
  mode: "hold" as string,
  target: new THREE.Vector3(1, 0.3, -1.8),
  cutaway: false,
};
export function resetRigInput() {
  rigInput.dragX = 0;
  rigInput.dragY = 0;
  rigInput.zoom = 0;
}
