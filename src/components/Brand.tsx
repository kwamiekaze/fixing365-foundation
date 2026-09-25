import { SLOGAN } from "@/config/brand";

/** Lucide-style wrench, shared by the DOM logo and the van livery textures. */
export const WRENCH_PATH =
  "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z";

/** The badge: orange rounded tile with a lit top edge and a white wrench. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      className="shrink-0 drop-shadow-[0_6px_14px_rgba(255,122,26,0.35)]"
    >
      <defs>
        <linearGradient id="f365-badge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffa24d" />
          <stop offset="1" stopColor="#f26a0d" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill="url(#f365-badge)" />
      <rect
        x="1.5"
        y="1.5"
        width="45"
        height="45"
        rx="11.5"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
      />
      <g transform="translate(10 10) scale(1.17)">
        <path
          d={WRENCH_PATH}
          fill="none"
          stroke="#fff"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Fixing365 lockup from the brand artwork: the house, calendar and wrench
 * badge, the wordmark with a green 365, and the slogan in italics beneath.
 */
export function Brand({ compact = false }: { compact?: boolean }) {
  const icon = compact ? 40 : 46;
  return (
    <span className="inline-flex items-center gap-2.5 text-foreground">
      <img
        src="/brand/fixing365-icon.webp"
        alt=""
        width={icon}
        height={icon}
        className="shrink-0 rounded-[10px] drop-shadow-[0_0_10px_rgba(56,189,248,0.35)]"
        style={{ width: icon, height: icon }}
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-tight ${compact ? "text-[1.35rem]" : "text-2xl"}`}
        >
          Fixing
          <span className="bg-gradient-to-b from-[#8ef04a] to-[#12c24c] bg-clip-text text-transparent">
            365
          </span>
        </span>
        <span
          className={`mt-1 font-display font-bold italic text-[#b9c6d8] ${compact ? "text-[0.74rem]" : "text-sm"}`}
        >
          {SLOGAN.replace(/\.$/, "")}
        </span>
      </span>
    </span>
  );
}
