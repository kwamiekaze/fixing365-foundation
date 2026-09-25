import { useEffect, type RefObject } from "react";
import { rigInput, world } from "@/three/world/store";
import { storyStep } from "@/three/world/story";

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
    // A quick vertical flick on a phone is the "scroll" for the story.
    let flick = { t: 0, x: 0, y: 0, dragY: 0, touch: false };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      flick = {
        t: performance.now(),
        x: e.clientX,
        y: e.clientY,
        dragY: rigInput.dragY,
        touch: e.pointerType === "touch",
      };
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
      if (flick.touch && pointers.size === 1 && pointers.has(e.pointerId)) {
        const dx = e.clientX - flick.x;
        const dy = e.clientY - flick.y;
        if (
          performance.now() - flick.t < 450 &&
          Math.abs(dy) > 70 &&
          Math.abs(dy) > Math.abs(dx) * 2
        ) {
          rigInput.dragY = flick.dragY;
          storyStep(dy < 0 ? 1 : -1);
        }
      }
      pointers.delete(e.pointerId);
      pinch = null;
      if (pointers.size === 0) rigInput.dragging = false;
    };
    // Scroll drives the story: one notch fixes the problem on screen or
    // moves to the next. A trackpad burst counts once, then locks briefly so
    // every move plays out. Pinch (or Ctrl + scroll) zooms instead.
    let lockUntil = 0;
    let acc = 0;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      rigInput.lastInput = performance.now() / 1000;
      if (e.ctrlKey || e.metaKey) {
        rigInput.zoom = clamp(rigInput.zoom + e.deltaY / 300, -1, 1);
        return;
      }
      const horizontal =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (horizontal !== 0) {
        rigInput.dragX = wrap(rigInput.dragX + horizontal * 0.006);
        return;
      }
      const now = performance.now();
      if (now < lockUntil) return;
      acc += e.deltaY;
      if (Math.abs(acc) < 40) return;
      storyStep(acc > 0 ? 1 : -1);
      acc = 0;
      lockUntil = now + 1100;
    };
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT|BUTTON/.test(t.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      if (["ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        storyStep(1);
      } else if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        storyStep(-1);
      }
    };

    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
    };
  }, [ref]);
}
