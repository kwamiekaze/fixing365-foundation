# Fixing365 Initial Foundation

## Build
- Establish a cinematic navy, graphite, orange, and warm-neutral design system with geometric display typography, responsive navigation, footer, and reusable controls.
- Add centralized service, station, camera, and provider types/configuration covering all eight categories, licensed-service guidance, object mappings, and the KleanupCrew exclusion note.
- Build the full procedural open-front repair house: HQ desk, live monitor, clock/calendar, eight signed service stations, named selectable objects, ambient effects, PBR materials, instanced repeated details, and GLB-ready station wrappers.
- Add accessible scene controls: bounded orbiting, smooth focus/reset camera movement, Escape reset, mobile Explore mode, keyboard/screen-reader station chips, All Services drawer, responsive service panel, loading progress, adaptive quality, WebGL detection, and Simple view fallback.
- Build the complete homepage content plus Services, How It Works, Providers, About, Get Help, and Request pages with unique metadata and working navigation.
- Build the validated local-only multi-step request flow with media previews, urgency, scheduling, review, success state, and a clearly marked future database submission stub.
- Build the provider verification explanation, data-driven verified badges, and local provider interest form.

## Technical approach
- Keep the 3D route client-only and lazy-load the scene; use React Three Fiber, drei, and Three.js with no external models or textures.
- Split stations, effects, layouts, and forms into focused files; station components accept optional `modelUrl` and render a Suspense-loaded model only when supplied.
- Use semantic Tailwind v4 tokens and existing shadcn controls throughout; use local React state only.
- Validate the generated route tree, preview logs, desktop/mobile layouts, fallback mode, camera selection/reset, drawers, forms, and the request completion path in-browser.

## Assumptions
- “Fixing365” will use a custom text mark rather than an external logo asset.
- KleanupCrew links will target `https://kleanupcrew.com`.
- Service requests and provider applications show an honest local success state but are not transmitted anywhere yet.
