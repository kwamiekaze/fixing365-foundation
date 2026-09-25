import { useSyncExternalStore } from "react";

/**
 * Holds the 3D scene back while the splash video starts, so the video
 * plays smoothly first. The scene begins loading 1.75 s after the video
 * starts playing, straight away if the visitor taps through, and never
 * later than 3.5 s after the splash appears.
 */
let open = false;
const listeners = new Set<() => void>();
export function openSceneGate() {
  if (open) return;
  open = true;
  listeners.forEach((l) => l());
}
export function useSceneGate() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
    () => false,
  );
}
