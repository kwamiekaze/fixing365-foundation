import { StaticBatch } from "../../world/StaticBatch";
import { Suspense, useMemo } from "react";
import { HQDesk } from "../../HQDesk";
import { B, C, M, S, glow } from "../../world/kit";
import { Hotspot } from "../../world/Hotspot";
import { Label } from "../../world/Label";
import { useReduced } from "../../world/store";

const X = -25;

/** Detailed chunk for Fixing365 HQ: a glass-front office around the command desk. */
export default function HqDetail() {
  const reduced = useReduced();
  const sign = useMemo(() => glow("#ff7a1a", 2.2), []);
  const panel = useMemo(() => glow("#fff4e6", 1.4), []);
  return (
    <group name="hq-detail">
      <StaticBatch name="hq-static">
        <B name="hq-floor" p={[X, 0.04, -1]} s={[12, 0.08, 4.8]} m={M.stone} cast={false} />
        <B name="hq-back-wall" p={[X, 2.1, -3.45]} s={[12, 4.2, 0.16]} m={M.navy} />
        <B p={[X - 6, 2.1, -1]} s={[0.16, 4.2, 4.8]} m={M.navy} />
        <B p={[X + 6, 2.1, -1]} s={[0.16, 4.2, 4.8]} m={M.navy} />
        <B name="hq-roof" p={[X, 4.28, -1]} s={[12.4, 0.16, 5.2]} m={M.darkMetal} />
        <B p={[X, 4.28, 1.38]} s={[12.4, 0.5, 0.12]} m={M.navy} />
        <Label p={[X - 3.3, 4.3, 1.46]} size={0.34} color="#ff7a1a" anchorX="left">
          FIXING365
        </Label>
        <B p={[X - 3.5, 4.3, 1.45]} s={[0.1, 0.34, 0.02]} m={sign} cast={false} />
        <B name="hq-glass-front" p={[X, 2.1, 1.4]} s={[12, 4.2, 0.04]} m={M.glass} cast={false} />
        {[-6, -3, 0, 3, 6].map((dx) => (
          <B key={dx} p={[X + dx, 2.1, 1.4]} s={[0.08, 4.2, 0.1]} m={M.darkMetal} />
        ))}
        {/* ceiling light panels */}
        {[-3, 0, 3].map((dx) => (
          <B key={dx} p={[X + dx, 4.15, -1.2]} s={[2, 0.04, 0.6]} m={panel} cast={false} />
        ))}
      </StaticBatch>
      <pointLight
        position={[X, 3.6, -0.8]}
        intensity={7}
        distance={10}
        color="#fff0dc"
        decay={1.4}
      />
      <Hotspot id="hq-desk" live>
        <group position={[X, 0, -1.1]}>
          <Suspense fallback={null}>
            <HQDesk onRequest={() => window.location.assign("/request")} reduced={reduced} />
          </Suspense>
        </group>
      </Hotspot>
      {/* pegboard tool wall */}
      <group name="hq-tool-wall" position={[X - 4.3, 2.0, -3.34]}>
        <B s={[2.6, 1.6, 0.04]} m={M.woodLight} />
        {(
          [
            [-0.9, 0.4],
            [-0.3, 0.45],
            [0.35, 0.4],
            [0.9, 0.35],
            [-0.6, -0.3],
            [0.1, -0.3],
            [0.8, -0.35],
          ] as [number, number][]
        ).map(([x, y], i) => (
          <B
            key={i}
            p={[x, y, 0.05]}
            r={[0, 0, (i % 3) * 0.4]}
            s={[0.08, 0.42, 0.04]}
            m={i % 2 ? M.orange : M.darkMetal}
          />
        ))}
      </group>
      {/* waiting area */}
      <group name="hq-lounge" position={[X + 3.8, 0, -1.2]}>
        {[-0.6, 0.6].map((dx) => (
          <group key={dx} position={[dx, 0, 0]}>
            <B p={[0, 0.42, 0]} s={[0.8, 0.12, 0.7]} m={M.fabricWarm} />
            <B p={[0, 0.75, -0.3]} s={[0.8, 0.6, 0.12]} m={M.fabricWarm} />
            <C p={[0, 0.2, 0]} radius={0.03} h={0.4} m={M.darkMetal} />
          </group>
        ))}
        <C p={[0, 0.25, 0.9]} radius={0.35} h={0.04} m={M.woodLight} />
        <C p={[1.6, 0.25, -1.6]} radius={0.2} h={0.5} m={M.white} />
        <S p={[1.6, 0.9, -1.6]} radius={0.35} s={[0.35, 0.55, 0.35]} m={M.plant} />
      </group>
    </group>
  );
}
