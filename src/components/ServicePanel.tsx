import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Wrench, X } from "lucide-react";
import { getService } from "@/config/services";
import { getSpot } from "@/config/world";
import { useWorld, world } from "@/three/world/store";
import { Button } from "./ui/button";

/** Details for the selected problem spot: what is wrong, what a pro does, and a prefilled request. */
export function ServicePanel() {
  const spotId = useWorld((s) => s.spot);
  const fixed = useWorld((s) => Boolean(spotId && s.fixed[spotId]));
  const spot = getSpot(spotId);
  if (!spot) return null;
  const service = getService(spot.service);
  const close = () => world.selectSpot(null);
  return (
    <aside
      aria-live="polite"
      className="absolute inset-x-2 bottom-24 z-30 max-h-[50%] overflow-y-auto rounded-lg border border-border bg-panel p-5 shadow-2xl backdrop-blur-xl md:inset-y-5 md:left-auto md:right-5 md:max-h-none md:w-[25rem] md:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-primary">{service?.name ?? "Fixing365 HQ"}</p>
        <Button
          size="icon"
          variant="ghost"
          className="-mr-2 -mt-2"
          onClick={close}
          aria-label="Close details"
        >
          <X />
        </Button>
      </div>
      <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{spot.title}</h2>
      <p className="mt-3 text-sm leading-6 text-foreground/80">{spot.problem}</p>

      {spot.service && (
        <button
          onClick={() => world.toggleFix(spot.id)}
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
      )}

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
        <Link
          to="/request"
          search={{
            category: spot.service || undefined,
            problem: spot.service ? spot.title : undefined,
          }}
        >
          {spot.service ? "Request this fix" : "Describe your problem"} <ArrowRight />
        </Link>
      </Button>
      <Button variant="ghost" className="mt-2 w-full" onClick={close}>
        <ArrowLeft />
        Back to {spot.zone === "house" ? "the house" : "the street"}
      </Button>
    </aside>
  );
}
