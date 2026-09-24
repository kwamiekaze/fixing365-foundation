# Fixing365 Foundation

- [x] Design system, shared navigation, footer, controls
- [x] Service/station/camera configuration and shared types
- [x] 3D house, HQ desk, stations, effects, interaction, fallback
- [x] Homepage content and All Services directory
- [x] Services, How It Works, Providers, About, Get Help pages
- [x] Complete local request flow and request submission stub
- [x] Provider badges and provider interest form
- [x] Metadata, desktop/mobile browser verification, clean preview logs

## Targeted 3D Completion Pass
- [ ] Fix HQ clock, calendar, desk tools, and request-button hover state
- [ ] Complete all eight station object inventories with named objects
- [ ] Confirm object-to-station interaction mapping and regulated-service copy
- [ ] Verify performance, desktop/mobile layouts, focus views, panels, and fallback

## Streaming Neighborhood Pass (GitHub, no Lovable credits)
- [x] Zone streaming: House, Fixing365 HQ, Main Street. Detail chunks load only near the camera (`src/config/world.ts`, `src/three/world/ZoneSlot.tsx`)
- [x] 26 tappable problem spots mapped to service categories, each with Show the Fix
- [x] X-Ray mode for pipes, sewer line, wiring and ductwork
- [x] Lighting follows the visitor's local time (`?time=HH` to preview)
- [x] Static mesh batching (`StaticBatch`), `?lite` low tier, `?debug` draw-call readout
- [x] Request flow prefilled from the selected problem
- [ ] Replace procedural rooms with optimized GLBs (Meshopt + KTX2) one room at a time
- [ ] Baked lightmaps for the house shell
- [ ] More zones (duplex, second street) using the same ZoneSlot pattern
