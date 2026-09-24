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
}

let state: WorldState = {
  zone: "house",
  spot: null,
  xray: false,
  fixed: {},
  reduced: false,
  explored: false,
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
    if (!spot) return world.set({ spot: null });
    world.set({
      spot: spot.id,
      zone: spot.zone,
      explored: true,
      xray: spot.xray ? true : state.xray,
    });
  },
  goZone(zone: ZoneId) {
    world.set({ zone, spot: null, explored: zone !== "house" || state.explored });
  },
  back() {
    if (state.spot) return world.set({ spot: null });
    if (state.zone !== "house") return world.set({ zone: "house" });
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
