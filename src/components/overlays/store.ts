import { useSyncExternalStore } from "react";

/**
 * Site-wide pop-ups, KleanupCrew style: every section and the request form
 * opens as a see-through panel over the 3D scene instead of a new page.
 */
export type OverlayId = "request" | "services" | "how" | "providers" | "about" | "help";
export interface OverlayState {
  open: OverlayId | null;
  category: string;
  problem: string;
}

let state: OverlayState = { open: null, category: "", problem: "" };
const listeners = new Set<() => void>();

export const overlays = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  open(id: OverlayId, request: { category?: string; problem?: string } = {}) {
    state = { open: id, category: request.category ?? "", problem: request.problem ?? "" };
    listeners.forEach((l) => l());
  },
  close() {
    state = { ...state, open: null };
    listeners.forEach((l) => l());
  },
};

export const openRequest = (category = "", problem = "") =>
  overlays.open("request", { category, problem });

export function useOverlay() {
  return useSyncExternalStore(overlays.subscribe, overlays.get, overlays.get);
}
