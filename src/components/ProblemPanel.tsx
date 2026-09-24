import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, MapPin, X } from "lucide-react";
import { getProblem } from "@/config/problems";
import { getService } from "@/config/services";
import { Button } from "./ui/button";

export function ProblemPanel({
  problemId,
  showFix,
  onToggleFix,
  onClose,
}: {
  problemId: string | null;
  showFix: boolean;
  onToggleFix: () => void;
  onClose: () => void;
}) {
  const problem = getProblem(problemId);
  if (!problem) return null;
  const service = getService(problem.serviceId);
  return (
    <aside className="absolute inset-x-3 bottom-24 z-30 rounded-md border border-border bg-panel p-5 shadow-2xl backdrop-blur-xl md:inset-y-auto md:bottom-24 md:left-auto md:right-5 md:w-[25rem] md:p-6">
      <div className="flex items-start justify-between">
        <span className="flex items-center gap-2 font-display text-xs font-bold uppercase text-primary">
          <MapPin className="size-4" />
          Problem scene
        </span>
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close problem details">
          <X />
        </Button>
      </div>
      <h2 className="mt-3 font-display text-2xl font-bold">{problem.label}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{problem.symptom}</p>
      <div
        className={`mt-5 rounded-md border p-4 transition-colors ${showFix ? "border-success/50 bg-success/10" : "border-border bg-background/60"}`}
      >
        {showFix ? (
          <>
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-success">
              <CheckCircle2 className="size-4" />
              Recommended fix
            </p>
            <p className="mt-2 text-sm leading-6">{problem.fix}</p>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase text-muted-foreground">Matched service</p>
            <p className="mt-1 font-display font-bold">{service?.name}</p>
          </>
        )}
      </div>
      {problem.urgent && !showFix && (
        <p className="mt-4 flex gap-2 text-xs leading-5 text-primary">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Potentially urgent. If there is immediate danger, shut down the affected system when safe
          and contact emergency services.
        </p>
      )}
      <Button
        variant={showFix ? "outline" : "secondary"}
        size="lg"
        className="mt-5 w-full"
        onClick={onToggleFix}
      >
        <Eye />
        {showFix ? "Show the problem" : "Show the fix"}
      </Button>
      <Button asChild variant="hero" size="lg" className="mt-3 w-full">
        <Link to="/request" search={{ category: problem.serviceId }}>
          Request this repair <ArrowRight />
        </Link>
      </Button>
    </aside>
  );
}
