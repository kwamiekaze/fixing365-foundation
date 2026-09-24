import { useSyncExternalStore } from "react";
import { getSpot, type ZoneId } from "@/config/world";

/** Shared world state. Plain module store so the DOM overlay and the R3F canvas read the same values. */
export interface WorldState {
  zone: ZoneId;
  spot: string | null;
  xray: boolean;
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
}

let state: WorldState = {
  zone: "house",
  spot: null,
  xray: false,
  fixed: {},
  reduced: false,
  explored: false,
  card: "compact",
  touring: false,
  tourCaption: null,
  viewNonce: 0,
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
}
