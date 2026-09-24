import { getService } from "@/config/services";
import { spots, zones } from "@/config/world";
import { useWorld, world } from "@/three/world/store";

/** Simple view for devices without WebGL or visitors who prefer a list. Same spots, same panel. */
export function Fallback2D() {
  const selected = useWorld((s) => s.spot);
  return (
    <div className="absolute inset-0 overflow-y-auto bg-panel-strong px-4 pb-40 pt-28 md:pt-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="max-w-2xl font-display text-3xl font-bold">Tap what’s broken.</h2>
        {zones.map((z) => (
          <section key={z.id} className="mt-8">
            <h3 className="font-display text-lg font-bold">{z.name}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {spots
                .filter((s) => s.zone === z.id)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => world.selectSpot(s.id)}
                    className={`min-h-28 rounded-md border p-4 text-left transition ${selected === s.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary"}`}
                  >
                    <span className="block text-xs font-bold text-primary">
                      {getService(s.service)?.shortName ?? "Start here"}
                    </span>
                    <span className="mt-2 block font-display text-sm font-bold leading-snug">
                      {s.title}
                    </span>
                  </button>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
