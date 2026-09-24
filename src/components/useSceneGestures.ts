import { useEffect, type RefObject } from "react";
import { rigInput, world } from "@/three/world/store";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const wrap = (a: number) => {
  const t = Math.PI * 2;
  return ((((a + Math.PI) % t) + t) % t) - Math.PI;
};

/**
 * Same gestures as the KleanupCrew 3D office: drag to orbit a full 360,
 * drag up or down to tilt, pinch or scroll to zoom. Scrolling past full
 * zoom-out hands the wheel back to the page so the content below is reachable.
 */
export function useSceneGestures(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch: { distance: number; zoom: number } | null = null;
    let moved = 0;

    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = { distance: Math.hypot(a!.x - b!.x, a!.y - b!.y), zoom: rigInput.zoom };
      }
      rigInput.lastInput = performance.now() / 1000;
    };
    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      rigInput.lastInput = performance.now() / 1000;
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
        if (!pinch) pinch = { distance, zoom: rigInput.zoom };
        // Measured from the start of the pinch so a short phone pinch still zooms clearly.
        rigInput.zoom = clamp(
          pinch.zoom - Math.log(distance / Math.max(pinch.distance, 1)) * 2.5,
          -1,
          1,
        );
        rigInput.dragging = true;
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved < 4) return;
      const touch = e.pointerType === "touch";
      rigInput.dragging = true;
      rigInput.dragX = wrap(rigInput.dragX - dx * (touch ? 0.014 : 0.01));
      rigInput.dragY = clamp(rigInput.dragY + dy * (touch ? 0.009 : 0.006), -1, 1);
      if (!world.get().explored) world.set({ explored: true });
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch = null;
      if (pointers.size === 0) rigInput.dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > 1 ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (horizontal !== 0) {
        e.preventDefault();
        rigInput.dragX = wrap(rigInput.dragX + horizontal * 0.006);
        return;
      }
      // At full zoom-out, let the page scroll on to the content below.
      if (e.deltaY > 0 && rigInput.zoom >= 1) return;
      if (e.deltaY < 0 && rigInput.zoom <= -1) return;
      e.preventDefault();
      rigInput.zoom = clamp(rigInput.zoom + e.deltaY / 700, -1, 1);
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [ref]);
}
