import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ClipboardList,
  FileCheck2,
  LifeBuoy,
  SearchCheck,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { services } from "@/config/services";
import { RequestForm } from "../RequestForm";
import { Button } from "../ui/button";
import { SLOGAN } from "@/config/brand";
import { openRequest, overlays, useOverlay, type OverlayId } from "./store";

const TITLES: Record<OverlayId, [string, string]> = {
  request: [
    "Tell us what’s broken",
    "Snap a photo, add a few details and we’ll match you with the right provider.",
  ],
  services: [
    "Services",
    "Almost anything in a home or property that needs diagnosing, repairing, installing or replacing.",
  ],
  how: ["How it works", "Three steps from broken to fixed."],
  providers: ["For providers", "Get matched with local jobs that fit your trade and credentials."],
  about: [
    "About Fixing365",
    "One place to start when something in your home or property is broken.",
  ],
  help: ["Get help", "Not sure what’s wrong? You don’t need to know. Tell us what you see."],
};

function Steps() {
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
    [ClipboardList, "Get your fix", "Compare quotes or book a visit with a qualified provider."],
  ];
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map(([Icon, t, d], i) => (
        <li key={t} className="rounded-lg border border-white/10 bg-background/35 p-4">
          <Icon className="size-5 text-primary" />
          <p className="mt-3 text-sm font-bold">
            {i + 1}. {t}
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground/75">{d}</p>
        </li>
      ))}
    </ol>
  );
}

function Body({ id, category, problem }: { id: OverlayId; category: string; problem: string }) {
  switch (id) {
    case "request":
      return <RequestForm initialCategory={category} initialProblem={problem} bare />;
    case "services":
      return (
        <div className="grid gap-3 md:grid-cols-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => openRequest(s.id)}
              className="group rounded-lg border border-white/10 bg-background/35 p-4 text-left transition hover:border-primary"
            >
              <p className="flex items-center justify-between font-display text-base font-bold">
                {s.name}{" "}
                <ArrowRight className="size-4 text-primary opacity-0 transition group-hover:opacity-100" />
              </p>
              <p className="mt-1 text-xs leading-5 text-foreground/70">
                {s.services.slice(0, 5).join(", ")}
              </p>
              {s.licensedProvider && (
                <p className="mt-2 text-[11px] font-bold text-cool">
                  Qualified or licensed providers
                </p>
              )}
            </button>
          ))}
        </div>
      );
    case "how":
      return (
        <>
          <Steps />
          <p className="mt-4 text-sm leading-6 text-foreground/75">
            Regulated work such as electrical, plumbing and HVAC is matched with appropriately
            qualified or licensed providers.
          </p>
        </>
      );
    case "providers":
      return (
        <>
          <p className="text-sm leading-6 text-foreground/80">
            Handymen, electricians, plumbers, HVAC techs, appliance pros and specialty trades can
            apply. Verification badges only show on your profile once each check is complete.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                [UserCheck, "Identity Verified"],
                [ShieldCheck, "Insurance Verified"],
                [FileCheck2, "License Verified"],
                [BadgeCheck, "Background Checked"],
              ] as const
            ).map(([Icon, label]) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs font-bold text-success"
              >
                <Icon className="size-4" /> {label}
              </li>
            ))}
          </ul>
          <Button asChild variant="hero" className="mt-5">
            <a href="/providers">
              Apply to join <ArrowRight />
            </a>
          </Button>
        </>
      );
    case "about":
      return (
        <>
          <p className="text-sm leading-6 text-foreground/80">
            Fixing365 helps you find the right provider for virtually anything that needs fixing:
            handyman jobs, electrical, plumbing, heating and air, appliances, interior and exterior
            repairs, and smart home installs.
          </p>
          <p className="mt-3 text-sm leading-6 text-foreground/80">
            Need cleaning, junk removal, lawn care or pressure washing? That’s our sister company,{" "}
            <a
              className="underline"
              href="https://kleanupcrew.com"
              target="_blank"
              rel="noreferrer"
            >
              KleanupCrew.com
            </a>
            .
          </p>
          <div className="mt-5">
            <Steps />
          </div>
        </>
      );
    case "help":
      return (
        <>
          <ul className="grid gap-3 text-sm leading-6 text-foreground/80">
            <li>
              <strong className="text-foreground">Water leaking?</strong> Shut off the nearest valve
              or the main, then tell us what you see.
            </li>
            <li>
              <strong className="text-foreground">Burning smell or sparking?</strong> Turn off the
              breaker if it is safe to, and call 911 if there is smoke or fire.
            </li>
            <li>
              <strong className="text-foreground">Gas smell?</strong> Leave the building and call
              your gas company’s emergency line from outside.
            </li>
            <li>
              <strong className="text-foreground">Everything else:</strong> a photo and a sentence
              or two is all we need.
            </li>
          </ul>
          <Button variant="hero" className="mt-5" onClick={() => openRequest()}>
            <LifeBuoy /> Tell us what’s broken
          </Button>
        </>
      );
  }
}

/** Renders whichever pop-up is open, over the live 3D scene. */
export function OverlayHost() {
  const { open, category, problem } = useOverlay();
  // Any link to /request anywhere on the site opens the pop-up instead of
  // leaving the page, carrying its category and problem along.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/request") return;
      e.preventDefault();
      e.stopPropagation();
      openRequest(url.searchParams.get("category") ?? "", url.searchParams.get("problem") ?? "");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  const id = open;
  return (
    <DialogPrimitive.Root open={id !== null} onOpenChange={(o) => !o && overlays.close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="overlay-fade fixed inset-0 z-[60] bg-background/15" />
        <DialogPrimitive.Content
          className="overlay-rise fixed inset-x-3 bottom-3 top-20 z-[61] mx-auto flex max-w-3xl flex-col overflow-hidden rounded-xl border border-white/15 bg-panel/55 shadow-2xl backdrop-blur-md md:inset-x-8 md:bottom-8 md:top-24"
          aria-describedby={undefined}
        >
          {id && (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-7 md:py-5">
                <div>
                  <p className="text-xs font-bold text-primary">Fixing365. {SLOGAN}</p>
                  <DialogPrimitive.Title className="mt-1 font-display text-2xl font-bold md:text-3xl">
                    {TITLES[id][0]}
                  </DialogPrimitive.Title>
                  <p className="mt-1 text-sm text-foreground/75">{TITLES[id][1]}</p>
                </div>
                <DialogPrimitive.Close
                  className="grid size-10 shrink-0 place-items-center rounded-md border border-white/10 bg-background/40 hover:border-primary"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7">
                <Body id={id} category={category} problem={problem} />
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function OverlayButton({
  id,
  children,
  className,
}: {
  id: OverlayId;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button type="button" onClick={() => overlays.open(id)} className={className}>
      {children}
    </button>
  );
}
