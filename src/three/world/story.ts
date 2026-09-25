import { getSpot, spotsForZone } from "@/config/world";
import { world } from "./store";
import { showcaseRunning, stopShowcase } from "./showcase";

/**
 * Scroll story: each step forward either fixes the problem on screen or,
 * once it's fixed, flies on to the next one in the button order. Going
 * back reverses it. After the last problem the camera pulls back to the
 * welcome view with the whole house fixed. Backward steps undo fixes.
 */
export function storyStep(dir: 1 | -1) {
  // A scroll or swipe during the Play showcase hands control back instead.
  if (showcaseRunning()) return stopShowcase();
  const w = world.get();
  const id = w.spot ?? "welcome";
  const spot = getSpot(id);
  const list = spotsForZone("house");
  const i = Math.max(
    0,
    list.findIndex((s) => s.id === id),
  );
  const fixable = Boolean(spot?.service) && !spot?.xray;
  if (dir > 0) {
    if (fixable && !w.fixed[id]) {
      world.set({ fixed: { ...w.fixed, [id]: true }, fixedAt: performance.now() });
      return;
    }
    const next = list[(i + 1) % list.length]!;
    world.selectSpot(next.id);
  } else {
    if (fixable && w.fixed[id]) {
      world.set({ fixed: { ...w.fixed, [id]: false } });
      return;
    }
    const prev = list[(i - 1 + list.length) % list.length]!;
    world.selectSpot(prev.id);
  }
}
