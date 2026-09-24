// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * Dev only: TanStack devtools tags every JSX element with data-tsd-source.
 * React Three Fiber treats that as a Three.js property path and throws when
 * an element updates (for example when Show the Fix swaps a part), so strip
 * it from 3D scene files in every mode.
 */
function stripSourceTagsFrom3d(): Plugin {
  return {
    name: "fixing365-strip-tsd-source-3d",
    // Runs in dev AND builds: preview builds (build:dev) also carry the devtools tags.
    enforce: "post",
    transform(code, id) {
      if (!/\/src\/three\//.test(id) || !code.includes("data-tsd-source")) return null;
      return {
        code: code
          .replace(/["']data-tsd-source["']\s*:\s*("[^"]*"|'[^']*'|`[^`]*`)\s*,?/g, "")
          .replace(/\sdata-tsd-source=("[^"]*"|'[^']*')/g, ""),
        map: null,
      };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripSourceTagsFrom3d()],
  },
});
