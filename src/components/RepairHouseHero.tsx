import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSceneGestures } from "./useSceneGestures";
import { Link } from "@tanstack/react-router";
import {
  Check,
  RotateCcw,
  Rows3,
  ScanEye,
  ScanSearch,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { startAmbience, stopAmbience } from "@/lib/ambience";
import { Button } from "./ui/button";
import { LoadingScreen } from "./LoadingScreen";
import { Fallback2D } from "./Fallback2D";
import { ServicePanel } from "./ServicePanel";
import { getZone, spotsForZone, zones, type ZoneId } from "@/config/world";
import { supportsWebGL } from "@/lib/webgl";
import { useWorld, world } from "@/three/world/store";
import { stopShowcase } from "@/three/world/showcase";

const Scene = lazyWithRetry(() => import("@/three/Scene"));
import { lazyWithRetry } from "@/lib/lazyWithRetry";

export function RepairHouseHero() {
  const [simple, setSimple] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  useSceneGestures(stage);
  const [webgl, setWebgl] = useState(true);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const zone = useWorld((s) => s.zone);
  const spot = useWorld((s) => s.spot);
  const xray = useWorld((s) => s.xray);
  const sound = useWorld((s) => s.sound);
  const explored = useWorld((s) => s.explored);
  const card = useWorld((s) => s.card);
  const touring = useWorld((s) => s.touring);
  const caption = useWorld((s) => s.tourCaption);
  const showcase = useWorld((s) => s.showcase);
  const reel = useWorld((s) => s.showcaseCaption);
  const showIntro = !explored && !touring;

  useEffect(() => {
    setWebgl(supportsWebGL());
    world.set({ reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") world.back();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const onZoneDetail = useCallback(
    (id: ZoneId, ok: boolean) => setLoaded((l) => (l[id] === ok ? l : { ...l, [id]: ok })),
    [],
  );
  const useSimple = simple || !webgl;
  const chips = spotsForZone(zone, xray);
  const streaming = !useSimple && !loaded[zone];
  const current = getZone(zone);

  return (
    <section
      className="relative h-full overflow-hidden"
      aria-label="Interactive Fixing365 neighborhood"
    >
      <div
        ref={stage}
        className={`absolute inset-0 ${useSimple ? "" : "cursor-grab touch-none select-none active:cursor-grabbing"}`}
      >
        {useSimple ? (
          <Fallback2D />
        ) : (
          <Suspense fallback={<LoadingScreen />}>
            <Scene onZoneDetail={onZoneDetail} />
          </Suspense>
        )}
      </div>

      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-64 bg-gradient-to-b from-panel-strong/90 to-transparent transition-opacity duration-500 ${showIntro ? "opacity-100" : "opacity-50"}`}
      />

      {explored && !touring && showcase === "off" && current && (
        <div className="pointer-events-none absolute left-4 top-[5.1rem] z-20 max-w-[12.5rem] md:left-10 md:top-[5.5rem] md:max-w-xs">
          <p className="font-display text-xl font-bold leading-tight md:text-2xl">
            {current.id === "house" ? "What’s your fix?" : current.name}
          </p>
          <p className="mt-1 text-xs leading-snug text-foreground/70 md:text-sm">
            {xray ? "X-Ray: see the systems hidden inside the walls." : current.blurb}
          </p>
        </div>
      )}

      <div
        className="pointer-events-auto absolute right-3 top-[4.9rem] z-30 flex items-center gap-2 md:right-5 md:top-[5.25rem]"
        aria-label="View options"
      >
        {!useSimple && (
          <Button
            variant={xray ? "hero" : "inverse"}
            size="sm"
            aria-pressed={xray}
            onClick={() => world.set({ xray: !xray, spot: null, explored: true })}
          >
            <ScanEye />
            X-Ray
          </Button>
        )}
        <Button
          variant={sound ? "hero" : "inverse"}
          size="sm"
          aria-pressed={sound}
          aria-label={sound ? "Sound off" : "Sound on"}
          title={sound ? "Sound off" : "Sound on"}
          onClick={() => {
            const on = !sound;
            world.set({ sound: on });
            if (on) void startAmbience();
            else stopAmbience();
          }}
        >
          {sound ? <Volume2 /> : <VolumeX />}
          <span className="max-md:sr-only">{sound ? "Sound on" : "Sound off"}</span>
        </Button>
        <Button variant="inverse" size="sm" onClick={() => setSimple((v) => !v)}>
          <Rows3 />
          <span className="max-md:sr-only">{useSimple ? "3D view" : "Simple view"}</span>
        </Button>
      </div>

      {streaming && (
        <div className="pointer-events-none absolute left-1/2 top-[9rem] z-20 -translate-x-1/2 rounded-full border border-border bg-panel px-4 py-2 text-xs font-bold backdrop-blur-md">
          Loading {current?.name ?? "area"} detail…
        </div>
      )}

      {spot && <ServicePanel />}

      {touring && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-24 z-20 px-5 md:bottom-10 md:px-10"
          aria-live="polite"
        >
          <p
            key={caption ?? "travel"}
            className={`tour-caption max-w-xl font-display text-2xl font-bold leading-tight text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,.6)] md:text-4xl ${caption ? "opacity-100" : "opacity-0"}`}
          >
            {caption ?? " "}
          </p>
          <p className="mt-2 text-xs font-bold text-foreground/70 md:text-sm">
            Tap anywhere to explore
          </p>
        </div>
      )}

      {showcase !== "off" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 px-5 md:bottom-10 md:px-10">
          <div className="flex items-end justify-between gap-4">
            <div aria-live="polite" className="min-w-0 max-w-2xl">
              {reel && (
                <div key={`${reel.title}-${reel.done ? 1 : 0}`} className="tour-caption">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary drop-shadow-[0_1px_6px_rgba(0,0,0,.7)] md:text-sm">
                    {reel.kicker}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold leading-tight text-balance drop-shadow-[0_2px_14px_rgba(0,0,0,.75)] md:text-4xl">
                    {reel.title}
                  </p>
                  {reel.done && (
                    <p className="fixed-stamp mt-2 inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-bold text-background md:text-sm">
                      <Check className="size-3.5" /> Fixed
                    </p>
                  )}
                </div>
              )}
              {reel?.step && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1 w-40 overflow-hidden rounded-full bg-foreground/20 md:w-64">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                      style={{
                        width: `${((reel.step[0] - (reel.done ? 0 : 1)) / reel.step[1]) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-foreground/75">
                    {reel.step[0]} / {reel.step[1]}
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="inverse"
              size="sm"
              className="pointer-events-auto shrink-0"
              onClick={() => stopShowcase()}
            >
              <Square className="fill-current" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {!useSimple && (
        <div
          className={`absolute inset-x-0 bottom-24 z-20 px-3 md:bottom-5 md:px-6 ${(spot && card === "compact") || touring || showcase !== "off" ? "hidden" : spot && card === "full" ? "max-md:hidden" : ""}`}
        >
          <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-2">
            <div className="flex items-center gap-2">
              {zones.length > 1 && (
                <div
                  role="tablist"
                  aria-label="Neighborhood areas"
                  className="flex rounded-md border border-border bg-panel p-1 backdrop-blur-md"
                >
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      role="tab"
                      aria-selected={zone === z.id}
                      onClick={() => world.goZone(z.id)}
                      className={`min-h-9 rounded px-3 text-xs font-bold transition md:px-4 ${zone === z.id ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:text-foreground"}`}
                    >
                      {z.short}
                    </button>
                  ))}
                </div>
              )}
              {(spot || zone !== "house") && (
                <Button
                  variant="inverse"
                  size="sm"
                  className="min-h-11"
                  onClick={() => world.back()}
                >
                  <RotateCcw />
                  {spot ? "Back" : "House"}
                </Button>
              )}
            </div>
            <div
              className="scrollbar-none flex gap-2 overflow-x-auto pb-1"
              aria-label="Problems you can tap"
            >
              {chips.map((c) => (
                <button
                  key={c.id}
                  onClick={() => world.selectSpot(c.id)}
                  className={`min-h-11 shrink-0 rounded-md border px-4 text-xs font-bold backdrop-blur-md transition ${spot === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-panel text-foreground hover:border-primary"}`}
                >
                  {c.chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
