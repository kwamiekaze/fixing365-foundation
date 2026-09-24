import { Text } from "@react-three/drei";
import { Suspense } from "react";
import type { Vec3 } from "@/config/world";

/** Self-hosted so 3D text never waits on a third-party CDN. */
export const FONT_URL = "/fonts/SpaceGrotesk-Bold.woff";

export function Label({
  children,
  p = [0, 0, 0],
  r,
  size = 0.1,
  color = "#ffffff",
  anchorX = "center",
  maxWidth,
  outline,
}: {
  children: string;
  p?: Vec3;
  r?: Vec3 | undefined;
  size?: number;
  color?: string;
  anchorX?: "center" | "left" | "right";
  maxWidth?: number | undefined;
  outline?: string | undefined;
}) {
  // Own boundary: slow font or glyph generation never blocks the zone it sits in.
  return (
    <Suspense fallback={null}>
      <Text
        font={FONT_URL}
        position={p}
        rotation={r ?? [0, 0, 0]}
        fontSize={size}
        color={color}
        anchorX={anchorX}
        anchorY="middle"
        maxWidth={maxWidth ?? Infinity}
        outlineWidth={outline ? size * 0.06 : 0}
        outlineColor={outline ?? "#000000"}
        material-toneMapped={false}
      >
        {children}
      </Text>
    </Suspense>
  );
}
