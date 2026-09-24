import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, Move3d, RotateCcw, Rows3, ScanSearch, ScanLine } from "lucide-react";
import { Button } from "./ui/button";
import { LoadingScreen } from "./LoadingScreen";
import { Fallback2D } from "./Fallback2D";
import { ServicePanel } from "./ServicePanel";
import { ProblemPanel } from "./ProblemPanel";
import { AllServicesDrawer } from "./AllServicesDrawer";
import { services } from "@/config/services";
import { problemScenes } from "@/config/problems";
import { supportsWebGL } from "@/lib/webgl";

const Scene = lazy(() => import("@/three/Scene"));

export function RepairHouseHero() {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [fixedProblem, setFixedProblem] = useState<string | null>(null);
  const [xray, setXray] = useState(false);
  const [simple, setSimple] = useState(false);
  const [mobileExplore, setMobileExplore] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setWebgl(supportsWebGL());
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setSelectedProblem(null);
        setFixedProblem(null);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const useSimple = simple || !webgl;
  const closeProblem = () => {
    setSelectedProblem(null);
    setFixedProblem(null);
  };
  return (
    <section
      className="relative h-[100svh] min-h-[42rem] max-h-[75rem] overflow-hidden border-b border-border md:h-[calc(100vh-4rem)]"
      aria-label="Interactive Fixing365 repair neighborhood"
    >
      <div className="absolute inset-0">
        {useSimple ? (
          <Fallback2D selected={selected} onSelect={setSelected} />
        ) : (
          <Suspense fallback={<LoadingScreen />}>
            <Scene
              selected={selected}
              onSelect={setSelected}
              selectedProblem={selectedProblem}
              fixedProblem={fixedProblem}
              onSelectProblem={(id) => {
                setSelectedProblem(id);
                if (id !== fixedProblem) setFixedProblem(null);
              }}
              onRequest={() => location.assign("/request")}
              mobileExplore={mobileExplore}
              reduced={reduced}
              xray={xray}
            />
          </Suspense>
        )}
      </div>
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-72 bg-gradient-to-b ${xray ? "from-[#071824]/95" : "from-panel-strong/95"} to-transparent`}
      />
      <div className="pointer-events-none absolute left-0 top-0 z-20 max-w-3xl px-5 pt-7 md:px-10 md:pt-10 lg:px-16">
        <p className="font-display text-xs font-bold uppercase text-primary">
          The repair neighborhood is live
        </p>
        <h1 className="mt-3 max-w-2xl text-balance font-display text-4xl font-bold leading-[1.05] md:text-6xl">
          Walk in. Tap what’s broken. Find the right provider.
        </h1>
        <p className="mt-4 hidden max-w-xl text-base leading-7 text-foreground/75 sm:block">
          Explore 26 recognizable problems across a continuously streamed home and repair
          neighborhood.
        </p>
        <div className="pointer-events-auto mt-6 flex flex-wrap gap-3">
          <Button asChild variant="hero" size="lg">
            <Link to="/request">
              <ScanSearch />
              Tell us what’s broken
            </Link>
          </Button>
          <AllServicesDrawer />
        </div>
      </div>
      <div className="pointer-events-auto absolute right-4 top-4 z-30 flex flex-wrap justify-end gap-2 md:top-6">
        <Button
          variant={xray ? "hero" : "inverse"}
          size="sm"
          disabled={useSimple}
          onClick={() => setXray((value) => !value)}
        >
          <ScanLine />
          {xray ? "X-Ray on" : "X-Ray"}
        </Button>
        <Button variant="inverse" size="sm" onClick={() => setSimple((value) => !value)}>
          <Rows3 />
          {useSimple ? "3D view" : "Simple view"}
        </Button>
        {!useSimple && (
          <Button
            variant={mobileExplore ? "hero" : "inverse"}
            size="sm"
            className="md:hidden"
            onClick={() => setMobileExplore((value) => !value)}
          >
            <Move3d />
            {mobileExplore ? "Done" : "Explore"}
          </Button>
        )}
      </div>
      {selected && <ServicePanel selected={selected} onClose={() => setSelected(null)} />}
      <ProblemPanel
        problemId={selectedProblem}
        showFix={Boolean(selectedProblem && fixedProblem === selectedProblem)}
        onToggleFix={() =>
          setFixedProblem((current) => (current === selectedProblem ? null : selectedProblem))
        }
        onClose={closeProblem}
      />
      <div className="absolute bottom-24 left-4 z-20 hidden rounded-md border border-border bg-panel px-3 py-2 text-xs font-bold backdrop-blur-md lg:block">
        {problemScenes.length} live problem scenes · 4 streamed zones{xray ? " · X-Ray active" : ""}
      </div>
      <div className="absolute inset-x-0 bottom-4 z-20 px-3 md:bottom-6 md:px-6">
        <div className="pointer-events-auto scrollbar-none mx-auto flex max-w-5xl gap-2 overflow-x-auto pb-2">
          {(selected || selectedProblem) && (
            <Button
              variant="inverse"
              className="min-h-11 shrink-0"
              onClick={() => {
                setSelected(null);
                closeProblem();
              }}
            >
              <RotateCcw />
              Full view
            </Button>
          )}
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                closeProblem();
                setSelected(service.id);
              }}
              className={`min-h-11 shrink-0 rounded-md border px-4 text-xs font-bold backdrop-blur-md transition ${selected === service.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-panel text-foreground hover:border-primary"}`}
            >
              {service.shortName}
            </button>
          ))}
        </div>
        <a
          href="#below-house"
          className="pointer-events-auto mx-auto mt-1 hidden w-fit items-center gap-2 text-xs font-bold text-foreground/70 md:flex"
        >
          Scroll for more <ArrowDown className="size-4" />
        </a>
      </div>
    </section>
  );
}
