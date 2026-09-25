import { ArrowRight, Camera, Menu } from "lucide-react";
import { Brand } from "./Brand";
import { Button } from "./ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { openRequest, overlays, type OverlayId } from "./overlays/store";

/** Every section opens as a see-through pop-up over the 3D scene, never a new page. */
const links: [OverlayId, string][] = [
  ["services", "Services"],
  ["how", "How It Works"],
  ["providers", "For Providers"],
  ["about", "About"],
  ["help", "Get Help"],
];

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-panel backdrop-blur-xl">
        <div className="page-shell flex h-16 items-center justify-between">
          {/* The logo always reloads the homepage fresh, back to the welcome view. */}
          <a
            href="/"
            aria-label="Fixing365 home"
            onClick={(e) => {
              e.preventDefault();
              window.location.assign("/");
            }}
          >
            <Brand compact />
          </a>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
            {links.map(([id, label]) => (
              <button
                key={id}
                onClick={() => overlays.open(id)}
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => overlays.open("providers")}
              className="text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              Become a Provider
            </button>
            <Button variant="hero" onClick={() => openRequest()}>
              <Camera />
              Tell Us What’s Broken <ArrowRight />
            </Button>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="border-border bg-panel-strong">
              <SheetHeader>
                <SheetTitle>
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-10 grid gap-2">
                {links.map(([id, label]) => (
                  <SheetClose key={id} asChild>
                    <button
                      onClick={() => overlays.open(id)}
                      className="flex min-h-12 items-center border-b border-border py-3 text-left font-display text-xl font-semibold"
                    >
                      {label}
                    </button>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <button
                    onClick={() => openRequest()}
                    className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 font-bold text-primary-foreground"
                  >
                    <Camera className="size-5" />
                    Tell Us What’s Broken
                  </button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="fixed inset-x-4 bottom-4 z-40 md:hidden">
        <Button
          variant="hero"
          size="lg"
          className="w-full shadow-2xl"
          onClick={() => openRequest()}
        >
          <Camera />
          Tell Us What’s Broken <ArrowRight />
        </Button>
      </div>
    </>
  );
}
