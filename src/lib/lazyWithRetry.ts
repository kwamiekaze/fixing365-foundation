import { lazy, type ComponentType } from "react";

/**
 * Lazy import that survives stale chunks after a new build: retries once,
 * then reloads the page a single time to fetch the fresh file names.
 */
export function lazyWithRetry<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    const key = "f365-chunk-reload";
    try {
      const mod = await load().catch(async () => {
        await new Promise((r) => setTimeout(r, 400));
        return load();
      });
      sessionStorage.removeItem(key);
      return mod;
    } catch (error) {
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
