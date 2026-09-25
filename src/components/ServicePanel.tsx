import { openRequest } from "./overlays/store";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  ClipboardList,
  SearchCheck,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Minus,
  ShieldCheck,
  Play,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { getService } from "@/config/services";
import { getSpot, stepSpot } from "@/config/world";
import { useWorld, world } from "@/three/world/store";
import { startShowcase } from "@/three/world/showcase";
import { Button } from "./ui/button";
import { SLOGAN } from "@/config/brand";
import { AllServicesDrawer } from "./AllServicesDrawer";
import { services } from "@/config/services";

function FixToggle({ id, compact = false }: { id: string; compact?: boolean }) {
  const fixed = useWorld((s) => Boolean(s.fixed[id]));
  if (compact)
    return (
      <Button
        variant={fixed ? "default" : "inverse"}
        size="sm"
        className={fixed ? "bg-success text-background hover:bg-success/90" : ""}
        aria-pressed={fixed}
        onClick={() => world.toggleFix(id)}
      >
        <Sparkles />
        {fixed ? "Fixed" : "Show the fix"}
      </Button>
    );
  return (
    <button
      onClick={() => world.toggleFix(id)}
      aria-pressed={fixed}
      className={`mt-5 flex min-h-12 w-full items-center gap-3 rounded-md border px-4 text-left text-sm font-bold transition ${fixed ? "border-success/50 bg-success/15 text-success" : "border-border bg-background/60 hover:border-primary"}`}
    >
      <Sparkles className="size-4 shrink-0" />
      <span className="flex-1">{fixed ? "Fixed. Show the problem again" : "Show the fix"}</span>
      <span
        className={`h-5 w-9 rounded-full p-0.5 transition ${fixed ? "bg-success" : "bg-secondary"}`}
      >
        <span
          className={`block size-4 rounded-full bg-foreground transition ${fixed ? "translate-x-4" : ""}`}
        />
      </span>
    </button>
  );
}

/**
 * The selected problem's card. Opens as a short title card with the main
 * actions and a More info button, the same pattern as the KleanupCrew office.
 * Closing or shrinking it never moves the camera.
 */

/** Primary action everywhere: the camera icon tells people they can snap a photo of the problem. */
/** Previous / next problem, in the same order as the buttons along the bottom. */
function StepArrows({ id, keepFull = false }: { id: string; keepFull?: boolean }) {
  const go = (dir: 1 | -1) => {
    const next = stepSpot(id, dir);
    if (!next) return;
    world.selectSpot(next);
    if (keepFull) world.setCard("full");
  };
  const cls =
    "grid size-9 place-items-center rounded-md border border-border bg-background/40 text-foreground/80 hover:border-primary hover:text-foreground";
  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous problem"
        title="Previous"
        className={cls}
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next problem"
        title="Next"
        className={cls}
      >
        <ChevronRight className="size-4" />
      </button>
    </span>
  );
}

export function TellUsLink({
  label = "Tell us what’s broken",
  ...rest
}: { label?: string } & Record<string, unknown>) {
  return (
    <button type="button" onClick={() => openRequest()} {...rest}>
      <Camera />
      {label}
    </button>
  );
}

/** Plays the whole house being fixed, then the drone orbit. */
function PlayFixes() {
  return (
    <button
      type="button"
      onClick={() => void startShowcase()}
      aria-label="Play: watch every fix, start to finish"
      title="Watch every fix"
      className="play-fixes group relative grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_24px_-6px] shadow-primary/70 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
    >
      <span
        aria-hidden
        className="play-fixes-ring pointer-events-none absolute inset-0 rounded-full border-2 border-primary"
      />
      <Play className="ml-0.5 size-5 fill-current" />
    </button>
  );
}

/** Welcome card, the first thing a visitor sees, like the KleanupCrew office. */
function WelcomeCard({ full }: { full: boolean }) {
  if (!full)
    return (
      <section
        aria-live="polite"
        className="spot-card-in absolute inset-x-3 bottom-24 z-30 rounded-lg border border-border bg-panel p-4 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-6 md:left-10 md:w-[26rem] md:p-5"
      >
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <StepArrows id="welcome" />
          <button
            onClick={() => world.setCard("hidden")}
            aria-label="Hide welcome"
            title="Hide"
            className="grid size-9 place-items-center rounded-md text-foreground/70 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="pr-28 text-xs font-bold text-primary">Welcome to Fixing365</p>
        <h1 className="mt-1 pr-28 font-display text-2xl font-bold leading-tight md:text-3xl">
          {SLOGAN}
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground/80">
          Scroll or swipe up to fix the whole house, one problem at a time. Or tap anything broken
          to jump straight to it.
        </p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <Button asChild variant="hero" size="sm">
              <TellUsLink />
            </Button>
            <Button
              variant="inverse"
              size="sm"
              onClick={() => world.setCard("full")}
              aria-haspopup="dialog"
            >
              More info <ArrowUpRight />
            </Button>
            <AllServicesDrawer />
          </div>
          <PlayFixes />
        </div>
      </section>
    );
  const steps: [typeof Camera, string, string][] = [
    [
      Camera,
      "Tell us what’s broken",
      "Describe it and snap a photo. Symptoms are more useful than a diagnosis.",
    ],
    [
      SearchCheck,
      "Get matched",
      "We route the job to providers suited to the work and its requirements.",
    ],
    [ClipboardList, "Get it fixed", "Compare quotes or book a visit with a qualified provider."],
  ];
  return (
    <aside
      aria-live="polite"
      className="spot-card-in absolute inset-x-2 bottom-24 z-30 max-h-[62%] overflow-y-auto rounded-lg border border-border bg-panel p-5 shadow-2xl backdrop-blur-xl md:inset-y-5 md:bottom-auto md:left-auto md:right-5 md:max-h-none md:w-[27rem] md:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-primary">Welcome to Fixing365</p>
        <span className="ml-auto">
          <StepArrows id="welcome" keepFull />
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="-mr-2 -mt-2"
          onClick={() => world.setCard("compact")}
          aria-label="Show less"
          title="Show less"
        >
          <Minus />
        </Button>
      </div>
      <h2 className="mt-1 font-display text-2xl font-bold leading-tight">
        Walk in, tap what’s broken, find the right provider.
      </h2>
      <ol className="mt-5 space-y-4">
        {steps.map(([Icon, t, d], i) => (
          <li key={t} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-background/60 text-primary">
              <Icon className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-bold">
                {i + 1}. {t}
              </span>
              <span className="block text-sm leading-6 text-foreground/75">{d}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs font-bold text-foreground/70">What we cover</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {services.map((sv) => (
          <li key={sv.id} className="rounded-full border border-border px-3 py-1 text-xs">
            {sv.name}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex gap-3 rounded-md border border-cool/30 bg-cool/10 p-3 text-xs leading-5 text-cool">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Electrical, plumbing, HVAC and other regulated work is matched with appropriately qualified
        or licensed providers. Verification badges only appear when a provider has passed that
        check.
      </div>
      <p className="mt-5 text-xs leading-5 text-foreground/65">
        Need cleaning, junk removal, lawn care or pressure washing? That’s our sister company,{" "}
        <a className="underline" href="https://kleanupcrew.com" target="_blank" rel="noreferrer">
          KleanupCrew.com
        </a>
        .
      </p>
      <Button asChild variant="hero" size="lg" className="mt-6 w-full">
        <TellUsLink />
      </Button>
    </aside>
  );
}

export function ServicePanel() {
  const spotId = useWorld((s) => s.spot);
  const card = useWorld((s) => s.card);
  const spot = getSpot(spotId);
  if (!spot || card === "hidden") return null;
  if (spot.id === "welcome") return <WelcomeCard full={card === "full"} />;
  const service = getService(spot.service);
  const request = (
    <button type="button" onClick={() => openRequest(spot.service, spot.service ? spot.title : "")}>
      {spot.service ? "Request this fix" : "Describe your problem"} <ArrowRight />
    </button>
  );

  if (card === "compact")
    return (
      <section
        aria-live="polite"
        className="spot-card-in absolute inset-x-3 bottom-24 z-30 rounded-lg border border-border bg-panel p-4 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-6 md:left-10 md:w-[27rem] md:p-5"
      >
        <div className="absolute right-2 top-2 flex items-center gap-1.5">
          <StepArrows id={spot.id} />
          <button
            onClick={() => world.setCard("hidden")}
            aria-label="Hide details"
            title="Hide"
            className="grid size-9 place-items-center rounded-md text-foreground/70 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="pr-28 text-xs font-bold text-primary">{service?.name ?? "Fixing365 HQ"}</p>
        <h2 className="mt-1 pr-28 font-display text-lg font-bold leading-snug md:text-xl">
          {spot.title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button asChild variant="hero" size="sm">
            {request}
          </Button>
          <Button
            variant="inverse"
            size="sm"
            onClick={() => world.setCard("full")}
            aria-haspopup="dialog"
          >
            More info <ArrowUpRight />
          </Button>
          {spot.service && <FixToggle id={spot.id} compact />}
        </div>
      </section>
    );

  return (
    <aside
      aria-live="polite"
      className="spot-card-in absolute inset-x-2 bottom-24 z-30 max-h-[58%] overflow-y-auto rounded-lg border border-border bg-panel p-5 shadow-2xl backdrop-blur-xl md:inset-y-5 md:bottom-auto md:left-auto md:right-5 md:max-h-none md:w-[25rem] md:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-primary">{service?.name ?? "Fixing365 HQ"}</p>
        <span className="ml-auto">
          <StepArrows id={spot.id} keepFull />
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="-mr-2 -mt-2"
          onClick={() => world.setCard("compact")}
          aria-label="Show less"
          title="Show less"
        >
          <Minus />
        </Button>
      </div>
      <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{spot.title}</h2>
      <p className="mt-3 text-sm leading-6 text-foreground/80">{spot.problem}</p>
      {spot.service && <FixToggle id={spot.id} />}
      <div className="mt-5 rounded-md border border-border bg-background/40 p-4">
        <p className="flex items-center gap-2 text-xs font-bold text-foreground/70">
          <Wrench className="size-3.5" />
          What a pro does
        </p>
        <p className="mt-2 text-sm leading-6">{spot.fix}</p>
      </div>
      <ul className="mt-5 flex flex-wrap gap-2">
        {spot.related.map((item) => (
          <li key={item} className="rounded-full border border-border px-3 py-1 text-xs">
            {item}
          </li>
        ))}
      </ul>
      {service?.licensedProvider && (
        <div className="mt-5 flex gap-3 rounded-md border border-cool/30 bg-cool/10 p-3 text-xs leading-5 text-cool">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          Regulated work is matched with appropriately qualified or licensed providers.
        </div>
      )}
      <Button asChild variant="hero" size="lg" className="mt-6 w-full">
        {request}
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={() => world.back()}>
        <ArrowLeft />
        Back to {spot.zone === "house" ? "the house" : "the street"}
      </Button>
    </aside>
  );
}
