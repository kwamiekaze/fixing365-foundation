import { useEffect, useState } from "react";
import { openSceneGate } from "./sceneGate";
import video from "@/assets/fixing365-splash.mp4.asset.json";
import poster from "@/assets/fixing365-splash-poster.jpg.asset.json";

/** Full-screen intro video shown on every homepage load; plays once, over the already-loading site. */
export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setShow(true);
    // Safety net: start the scene even if the video never plays.
    const id = window.setTimeout(openSceneGate, 3500);
    return () => window.clearTimeout(id);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    if (leaving) return;
    openSceneGate();
    setLeaving(true);
    window.setTimeout(() => setShow(false), 450);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Tap to continue"
      onClick={dismiss}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " || e.key === "Escape") && dismiss()}
      className={`splash fixed inset-0 z-[100] cursor-pointer touch-manipulation bg-panel-strong ${leaving ? "splash-leave" : ""}`}
    >
      <video
        src={video.url}
        poster={poster.url}
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        onPlaying={() => window.setTimeout(openSceneGate, 1750)}
        preload="auto"
        disablePictureInPicture
        className="pointer-events-none h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 flex justify-center bottom-[calc(3vh+env(safe-area-inset-bottom))]">
        <span className="splash-cta rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-[0.32em] text-foreground">
          Tap to continue
        </span>
      </div>
    </div>
  );
}
