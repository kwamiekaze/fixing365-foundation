# Fixing365 Foundation

Build the complete initial foundation for Fixing365.com in ONE pass. Do not ask clarifying questions. Do not stub pages as "coming soon". Build everything below now.

TECH REQUIREMENTS (follow exactly)
* React + TypeScript + Vite + Tailwind + shadcn/ui, plus three, @react-three/fiber, @react-three/drei.
* No backend yet. No Supabase calls. Forms keep local state only, with a clearly marked submitRequest() stub in src/lib/requests.ts ready for Supabase later.
* Build the 3D scene from procedural primitives (boxes, cylinders, planes, rounded boxes via drei) with good PBR materials. Do NOT depend on any external GLB/texture URL. Every station must be wrapped so a GLB can replace it later: each station component accepts an optional `modelUrl` prop; if present it lazy loads via useGLTF inside Suspense, otherwise renders the procedural version.
* Folder structure:
  - src/config/services.ts (all 8 categories, their sub-services, excluded services note pointing to KleanupCrew.com, licensed-provider flag)
  - src/config/stations.ts (id, name, position, rotation, cameraTarget, cameraPosition, accent color, related object ids)
  - src/config/camera.ts (home view: attractive three-quarter angle, orbit limits, focus distance)
  - src/three/Scene.tsx (Canvas, lights, environment, controls, selection state)
  - src/three/House.tsx (single-story open-front house shell, floor, back/side walls, one open exterior wall, window with sunlight)
  - src/three/HQDesk.tsx (central command desk)
  - src/three/stations/*.tsx (one file per station)
  - src/three/effects/* (Steam, Drip, Airflow, FlickerLight, IndicatorLED, CeilingFan)
  - src/three/Sign3D.tsx (readable physical station sign using drei Text)
  - src/three/Selectable.tsx (wrapper: named group, hover highlight, click → select station, pointer cursor, large invisible hit box for mobile taps)
  - src/components/* (Header, ServicePanel, AllServicesDrawer, RequestFlow, ProviderBadge, LoadingScreen, Fallback2D, Footer sections)
  - src/pages/* (Index, Services, HowItWorks, Providers, About, GetHelp, Request)
* Name every interactive group/mesh with a clear `name` (e.g. "station-plumbing", "obj-plumbing-faucet").
* Camera: OrbitControls with tight limits (small azimuth range around the three-quarter angle, clamped polar angle, clamped zoom, no pan). Selecting a station smoothly animates camera position and target to that station's config values over ~1s (use damped lerp in useFrame, respect prefers-reduced-motion by jumping instantly). "Back to full view" button returns to home view. Esc also returns.
* Scroll MUST NOT affect the camera. The canvas is a fixed-height hero section (100svh on mobile, 100vh desktop) with normal page content below. Disable OrbitControls zoom on wheel so page scroll works; on touch, single-finger vertical drag should still allow page scroll outside a small interaction area, or use a clear "Explore" toggle on mobile.
* Performance: dpr clamped [1, 1.75], adaptive (drei PerformanceMonitor → lower dpr and disable shadows on weak devices), shadows only from one directional light with small map, instanced repeated items (tiles, deck boards, shingles), lazy load the whole Scene with React.lazy, drei useProgress loading screen with percentage. WebGL detection: if unavailable or user picks "Simple view", render Fallback2D (illustrated grid of the 8 stations as cards with the same panels).
* Accessibility: every station also reachable via a keyboard/screen-reader list of buttons overlaid on the canvas (visually subtle chips on mobile at the bottom: horizontally scrollable station chips). Tap targets ≥ 44px.

DESIGN
* Premium, cinematic, trustworthy. Dark navy/graphite base (#0B1220 range) with a confident safety-orange accent (#FF7A1A) and clean white type. Each station gets a subtle secondary accent. Warm interior lighting, cool exterior daylight through the window and open wall. Soft contact shadows, mild metallic reflections on tools.
* Typography: a strong geometric display font for headings, clean sans for body (Google Fonts).
* Visually related to an immersive "look inside the building" site, calm not chaotic, lightly worn not damaged.

Everything below is the full product spec. Implement all of it.

---

I want us to create a new interactive 3D website for Fixing365.com, inspired by the structure and presentation of the KleanupCrew.com project. Reference concept: a single inhabited workstation studio you can drag to look around, with named viewpoints (studio, desk, monitor), live typing on the screen and a loading "Preparing the studio" state.

ABOUT FIXING365
Fixing365 is a home and property repair platform that helps customers find the correct provider for virtually anything that needs diagnosing, repairing, installing, maintaining or replacing.

Fixing365 covers: general handyman repairs; TV, shelf, mirror and wall mounting; furniture assembly; doors, windows and locks; drywall, painting and carpentry; cabinets, countertops, tile and flooring; electrical troubleshooting and repairs; outlets, switches, lighting and ceiling fans; breakers, panels, circuits, EV chargers and generators; plumbing leaks, faucets, sinks, toilets and drains; showers, tubs, disposals and water-pressure problems; water heaters, sewer and septic specialists; heating, air conditioning and HVAC; thermostats, furnaces, heat pumps and mini-splits; ductwork, airflow and indoor air-quality equipment; appliance repair and installation; refrigerators, washers, dryers, dishwashers, ovens and microwaves; roofing, siding, soffit, fascia and gutter repair; deck, porch, fence and gate repair; concrete, masonry, garage doors and sheds; smart-home equipment, doorbells, cameras, locks and sensors; accessibility modifications and child-safety installation; leak detection, urgent repairs and preventive maintenance; rental-property, commercial-property and home-inspection repairs.

Licensed electrical, plumbing, HVAC and other regulated services must be described as performed by appropriately qualified or licensed providers.

Fixing365 does NOT provide regular house cleaning, junk removal, lawn mowing, pressure washing, tree care or general property cleanup. Those belong to KleanupCrew.com (show a small tasteful note with a link where relevant, e.g. in All Services and Get Help).

PRIMARY 3D EXPERIENCE
The homepage opens into one continuous interactive 3D environment. NOT a scroll-controlled animation, NOT a camera journey through floors. A single-story, open-front house and repair showroom viewed from one attractive three-quarter camera angle: a real compact home combined with an organized professional repair workshop.

Users can: gently rotate/inspect the scene; tap clearly identified service stations; move the camera a short distance toward a selected station; open a service information panel; return easily to the complete scene; access an All Services directory; start a repair request. Vertical scrolling only reveals normal website content beneath the 3D hero.

CENTRAL FIXING365 HEADQUARTERS (center of scene)
Modern desk; computer monitor displaying "What needs fixing?" (use drei Html or a canvas texture with a blinking cursor and gently cycling typed examples like "Leaking faucet…", "Breaker keeps tripping…"); keyboard and mouse; diagnostic tablet; organized repair tools; coffee cup with subtle rising steam; live analog wall clock showing the visitor's local time (real hour/minute/second hands driven by Date); wall calendar automatically showing the current month and today's date; Fixing365 logo; slogan "If it's broken, start here."; a visible Request Service control (3D button on the desk that opens the request flow). No person at the desk.

3D SERVICE STATIONS (8, arranged around the HQ, each with a readable physical sign)
1. HANDYMAN & INSTALLATIONS: workbench, toolbox, drill, wall-mounted TV, shelf, mirror, curtain rod, blinds, partially assembled furniture, door with a loose hinge, small drywall patch.
2. ELECTRICAL & LIGHTING: residential electrical panel, breaker demonstration, outlet and switch wall, ceiling fan (slowly rotating), pendant light, recessed light, smart switch, electrical tester, EV-charger unit. One light flickers subtly.
3. PLUMBING & WATER: sink, dripping faucet (occasional drip), visible under-sink plumbing, small pipe leak, toilet, shower fixture, garbage disposal, water heater, shutoff valve, plumbing tools.
4. HEATING & AIR: indoor furnace/air handler, thermostat, short duct section, vent, filter, HVAC gauges, mini-split head, outdoor condenser with slowly rotating fan, subtle airflow particles from the vent.
5. APPLIANCE REPAIR: refrigerator, washer, dryer, dishwasher, microwave, range/oven. One appliance (washer) shows a small glowing error code "E21"; the rest clean and organized.
6. INTERIOR REPAIRS: drywall demo panel, paint supplies, cabinet with a damaged hinge, countertop sample, tile and grout section, flooring samples, baseboards, molding, short railing section.
7. EXTERIOR & STRUCTURAL REPAIRS (near the open exterior wall): small roof-and-shingle display with one lifted damaged shingle, gutter and downspout, siding sample, window, exterior door, deck boards, railing, fence-and-gate section, brick, concrete, garage-door mechanism.
8. SMART HOME & SPECIALTY: video doorbell, security camera, smart lock, smart thermostat, smoke detector, CO detector, leak sensor, grab bar, furniture anchor, small solar/home-energy control panel.

INTERACTIONS
Every major object is a separate selectable named group. On tap of an object or station: camera moves gently toward it, selected area brightens (emissive/spotlight boost, others dim slightly), station name shows, a clean ServicePanel opens (bottom sheet on mobile, right side panel on desktop) with description, several related services, licensed-provider note where applicable, Request Service button (pre-fills category), and Back to full view.
Mappings: dripping faucet → Plumbing & Water; thermostat → Heating & Air; electrical panel → Electrical & Lighting; television → Handyman & Installations; refrigerator → Appliance Repair; damaged shingle → Exterior & Structural Repairs; etc.

Ambient activity (subtle, all disabled or minimized under prefers-reduced-motion): coffee steam, live clock, auto calendar, slow ceiling fan, occasional faucet drip, HVAC airflow, small equipment indicator LEDs, gentle sunlight through a window, subtle screen glow, mild tool reflections. Never chaotic or heavily damaged.

NAVIGATION
Header: logo, Services, How It Works, For Providers, About, Get Help. Persistent actions: "Tell Us What's Broken" (primary), All Services, Request Service, Become a Provider. On mobile: compact header with menu sheet and a sticky bottom "Tell Us What's Broken" button.

CONTENT BELOW THE 3D HERO (Index page)
How it works (3 steps: Tell us what's broken → Get matched with a qualified provider → Get it fixed), the 8 categories grid, provider trust section explaining the badges, "Not what you need? Cleaning, junk removal, lawn and pressure washing are handled by KleanupCrew.com", provider recruitment CTA, FAQ, footer.

REQUEST FLOW (/request, multi-step, reusable components, local state only)
Steps: describe the problem (textarea + example chips); select service category (from services.ts, pre-filled when coming from a station); upload photos or video (drag/drop + mobile camera input, previews, no upload yet); property address (fields, no geocoding yet); urgency (Emergency / Within 48 hours / This week / Flexible); request quotes or an appointment (toggle + preferred time windows); review and submit (calls the stub, shows success state). Progress indicator, back/next, validation.

PROVIDER TRUST
Reusable <ProviderBadge type="identity" | "insurance" | "license" | "background" verified={boolean} />: Identity Verified, Insurance Verified, License Verified, Background Checked. Render a badge only when verified is true. Include a Provider type in src/types with a verifications object so badges are always data-driven, never hardcoded on a provider. For Providers page: explain the verification process and a "Become a Provider" interest form (local state).

PROJECT RULES
Clean small reusable components, centralized config, no giant single files, clear names on interactive objects, GitHub-friendly, standard Lovable structure (do not rename or move core Vite/Lovable files). Produce a polished, working foundation in this single pass.

"Walk into the Fixing365 repair house, tap what is broken, and find the right provider."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ec02b1bd-ded1-4d63-844b-9e84bf686395).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
