import { getService } from "@/config/services";
import { spotsForZone } from "@/config/world";
import { rigState, world } from "./store";

/**
 * The welcome card's Play button. Every problem in the house is shown
 * broken, then fixed, in the button order (leaning fence through the EV
 * charger), each with a lower-third caption. Then the camera lifts away
 * for a full 360 drone orbit of the finished home (flown by CameraRig in
 * its "orbit" mode) and settles back on the welcome view with everything
 * fixed. Any tap, scroll, swipe or key stops it where it is.
 */

/** Seconds the drone orbit takes; CameraRig reads this too. */
export const ORBIT_S = 26;

let run = 0;
const CANCEL = Symbol("cancel");

function sleep(ms: number, id: number) {
  return new Promise<void>((resolve, reject) =>
    window.setTimeout(() => (id === run ? resolve() : reject(CANCEL)), ms),
  );
}

/** Wait for the camera to land after a new framing was asked for. */
async function landed(id: number, maxMs = 11000) {
  await sleep(160, id);
  const t0 = performance.now();
  while (rigState.mode === "fly" && performance.now() - t0 < maxMs) await sleep(80, id);
}

/** The fixable problems, in the order the buttons and arrows use. */
export function showcaseSpots() {
  return spotsForZone("house").filter((s) => s.service && !s.xray);
}

export const showcaseRunning = () => world.get().showcase !== "off";

export function stopShowcase() {
  if (!showcaseRunning()) return;
  run++;
  const wasFixing = world.get().showcase === "fixing";
  world.set({
    showcase: "off",
    showcaseCaption: null,
    ...(wasFixing && world.get().spot ? { card: "compact" as const } : {}),
  });
}

export async function startShowcase() {
  const id = ++run;
  const list = showcaseSpots();
  const reduced = world.get().reduced;
  world.set({
    fixed: {},
    xray: false,
    touring: false,
    tourCaption: null,
    explored: true,
    showcase: "fixing",
    showcaseCaption: null,
  });
  try {
    for (let i = 0; i < list.length; i++) {
      const spot = list[i]!;
      const kicker = getService(spot.service)?.name ?? "Fixing365";
      const step: [number, number] = [i + 1, list.length];
      world.selectSpot(spot.id);
      world.set({ card: "hidden", showcaseCaption: { kicker, title: spot.title, step } });
      if (reduced) {
        await sleep(700, id);
      } else {
        await landed(id);
        // Let the broken state read for a beat before the fix lands.
        await sleep(950, id);
      }
      world.set({
        fixed: { ...world.get().fixed, [spot.id]: true },
        fixedAt: performance.now(),
        showcaseCaption: { kicker, title: spot.title, step, done: true },
      });
      await sleep(reduced ? 700 : 1750, id);
    }

    // Every fix in: the drone lifts off for the reveal.
    world.set({
      showcase: "orbit",
      spot: null,
      showcaseCaption: {
        kicker: "Before and after",
        title: `${list.length} problems. Every one fixed.`,
      },
    });
    if (!reduced) {
      await sleep((ORBIT_S * 1000) / 2, id);
      world.set({ showcaseCaption: { kicker: "Fixing365", title: "Get your fix." } });
      await sleep((ORBIT_S * 1000) / 2 + 400, id);
    } else {
      await sleep(1500, id);
    }
    run++;
    world.set({ showcase: "off", showcaseCaption: null });
    world.selectSpot("welcome");
  } catch (e) {
    if (e !== CANCEL) throw e;
  }
}
