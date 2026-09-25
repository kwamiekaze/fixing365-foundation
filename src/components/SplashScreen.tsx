import { useEffect, useState } from "react";
import video from "@/assets/fixing365-splash.mp4.asset.json";
import poster from "@/assets/fixing365-splash-poster.jpg.asset.json";

const KEY = "f365-splash-seen";

/** Full-screen intro video shown once per visit, over the already-loading site. */
export function SplashScreen() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(KEY)) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    if (leaving) return;
    sessionStorage.setItem(KEY, "1");
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
        loop
        preload="auto"
        disablePictureInPicture
        className="pointer-events-none h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 flex justify-center bottom-[calc(7vh+env(safe-area-inset-bottom))]">
        <span className="splash-cta rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-[0.32em] text-foreground">
          Tap to continue
        </span>
      </div>
    </div>
  );
}
