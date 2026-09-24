import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";

/** With ?debug in the URL, exposes draw calls, triangles and fps on window.__f365 for performance checks. */
export function DebugInfo() {
  const gl = useThree((s) => s.gl);
  const frames = useRef({ n: 0, t: 0 });
  const on =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
  useFrame((_, dt) => {
    if (!on) return;
    gl.info.autoReset = false;
    const calls = gl.info.render.calls;
    const triangles = gl.info.render.triangles;
    gl.info.reset();
    const f = frames.current;
    f.n++;
    f.t += dt;
    if (f.t > 1) {
      (window as unknown as { __f365: unknown }).__f365 = {
        fps: Math.round(f.n / f.t),
        calls,
        triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      };
      f.n = 0;
      f.t = 0;
    }
  });
  return null;
}
