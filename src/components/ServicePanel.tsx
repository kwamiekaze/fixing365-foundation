import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Minus,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { getService } from "@/config/services";
import { getSpot } from "@/config/world";
import { useWorld, world } from "@/three/world/store";
import { Button } from "./ui/button";

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
export function ServicePanel() {
  const spotId = useWorld((s) => s.spot);
  const card = useWorld((s) => s.card);
  const spot = getSpot(spotId);
  if (!spot || card === "hidden") return null;
  const service = getService(spot.service);
  const request = (
    <Link
      to="/request"
      search={{
        category: spot.service || undefined,
        problem: spot.service ? spot.title : undefined,
      }}
    >
      {spot.service ? "Request this fix" : "Describe your problem"} <ArrowRight />
    </Link>
  );

  if (card === "compact")
    return (
      <section
        aria-live="polite"
        className="spot-card-in absolute inset-x-3 bottom-24 z-30 rounded-lg border border-border bg-panel p-4 shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-6 md:left-10 md:w-[27rem] md:p-5"
      >
        <button
          onClick={() => world.setCard("hidden")}
          aria-label="Hide details"
          title="Hide"
          className="absolute right-2 top-2 grid size-10 place-items-center rounded-md text-foreground/70 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <p className="pr-10 text-xs font-bold text-primary">{service?.name ?? "Fixing365 HQ"}</p>
        <h2 className="mt-1 pr-10 font-display text-lg font-bold leading-snug md:text-xl">
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
