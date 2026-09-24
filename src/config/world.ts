/**
 * Fixing365 world configuration.
 *
 * The world is a street of streamable zones. Each zone has a low-detail
 * massing that is always drawn and a detailed chunk that only loads when the
 * camera is near it. Each zone contains "spots": a real, visible problem
 * (burst pipe, tripped breaker, off-track garage door) mapped to a service
 * category from services.ts. Add a spot here and its hotspot, chip, panel
 * copy and request prefill all follow automatically.
 */

export type Vec3 = [number, number, number];
export type ZoneId = "hq" | "house" | "block";
export interface CameraView {
  position: Vec3;
  target: Vec3;
}

export interface ZoneConfig {
  id: ZoneId;
  name: string;
  short: string;
  blurb: string;
  center: Vec3;
  /** Camera target distance under which the detailed chunk mounts. */
  loadRadius: number;
  view: CameraView;
}

export interface SpotConfig {
  id: string;
  zone: ZoneId;
  area: string;
  /** Service category id from services.ts. */
  service: string;
  chip: string;
  title: string;
  problem: string;
  fix: string;
  related: string[];
  /** World position of the floating marker above the problem. */
  marker: Vec3;
  view: CameraView;
  /** Only shown while X-Ray mode is on. */
  xray?: boolean;
}

export const homeView: CameraView = { position: [13.5, 15, 24], target: [1.2, 0.2, -1.8] };

export const zones: ZoneConfig[] = [
  {
    id: "house",
    name: "The House",
    short: "House",
    blurb: "Kitchen, living room, bath, utility room, garage and yard.",
    center: [1, 0, -1.5],
    loadRadius: 22,
    view: homeView,
  },
];

const v = (position: Vec3, target: Vec3): CameraView => ({ position, target });

export const spots: SpotConfig[] = [
  // Welcome: the first thing every visitor sees, same pattern as the KleanupCrew office.
  {
    id: "welcome",
    zone: "house",
    area: "Welcome",
    service: "",
    chip: "Welcome",
    title: "If it’s broken, start here.",
    problem:
      "Fixing365 connects you with the right provider for almost anything in a home or property that needs diagnosing, repairing, installing or replacing.",
    fix: "Tell us what’s broken, add a photo, and we match you with qualified providers so you can compare quotes or book a visit.",
    related: [
      "Handyman & installations",
      "Electrical & lighting",
      "Plumbing & water",
      "Heating & air",
      "Appliance repair",
      "Interior repairs",
      "Exterior & structural",
      "Smart home",
    ],
    marker: [0, 0, 0],
    view: homeView,
  },
  // Kitchen
  {
    id: "kitchen-pipe",
    zone: "house",
    area: "Kitchen",
    service: "plumbing",
    chip: "Burst pipe",
    title: "Burst pipe under the kitchen sink",
    problem:
      "The supply line under the sink split. Water is spraying into the cabinet and pooling on the floor.",
    fix: "A qualified plumber shuts off the water, replaces the failed section, checks the shutoff valve and dries the cabinet base.",
    related: [
      "Emergency leak repair",
      "Shutoff valve replacement",
      "Faucet & sink repair",
      "Leak detection",
    ],
    marker: [-7.0, 1.6, -4.9],
    view: v([-4.9, 2.8, -1.4], [-7.0, 0.5, -5.3]),
  },
  {
    id: "fridge",
    zone: "house",
    area: "Kitchen",
    service: "appliances",
    chip: "Fridge not cooling",
    title: "Refrigerator not cooling",
    problem: "The display reads 52°F with an error code and frost is building on the back panel.",
    fix: "An appliance tech diagnoses the fan, defrost system or sealed system and restores safe food temperatures.",
    related: ["Refrigerator repair", "Ice maker repair", "Appliance installation"],
    marker: [-8.2, 2.5, -1.8],
    view: v([-4.4, 2.8, 2.4], [-8.3, 1.3, -1.8]),
  },
  // Living room
  {
    id: "tv-mount",
    zone: "house",
    area: "Living room",
    service: "handyman",
    chip: "TV mounting",
    title: "TV waiting to be mounted",
    problem:
      "A 65-inch TV is leaning against the wall with the bracket, anchors and cables still in the box.",
    fix: "A handyman finds the studs, levels the bracket, mounts the TV and hides the cables.",
    related: [
      "TV mounting",
      "Shelf & mirror mounting",
      "Cable concealment",
      "Soundbar installation",
    ],
    marker: [-0.2, 2.35, -5.4],
    view: v([0.4, 2.2, -1.3], [-0.1, 1.2, -5.5]),
  },
  {
    id: "ceiling-fan",
    zone: "house",
    area: "Living room",
    service: "electrical",
    chip: "Fan & flickering light",
    title: "Wobbling ceiling fan and flickering light",
    problem:
      "The fan wobbles on high and the light kit flickers, which often points to a loose mount or connection.",
    fix: "A licensed electrician secures the fan box, rebalances the blades and repairs the wiring connection.",
    related: [
      "Ceiling fan installation",
      "Lighting repair",
      "Switches & dimmers",
      "Electrical troubleshooting",
    ],
    marker: [-1, 3.8, -2.8],
    view: v([-3.2, 2.2, 1.4], [-1, 2.8, -2.8]),
  },
  {
    id: "drywall-hole",
    zone: "house",
    area: "Living room",
    service: "interior",
    chip: "Hole in drywall",
    title: "Doorknob hole in the drywall",
    problem: "A door swung too far and punched a fist-sized hole in the wall next to the hallway.",
    fix: "A pro patches the hole, feathers the compound, textures and paints so it disappears. A door stop finishes the job.",
    related: ["Drywall repair", "Interior painting", "Door stops & hardware"],
    marker: [1.6, 1.7, -2.62],
    view: v([-1.4, 1.9, -0.4], [1.9, 0.95, -2.62]),
  },
  {
    id: "flat-pack",
    zone: "house",
    area: "Living room",
    service: "handyman",
    chip: "Furniture assembly",
    title: "Half-built bookshelf",
    problem:
      "The flat-pack bookshelf is half assembled with leftover screws and the instructions on the floor.",
    fix: "A handyman finishes the build, anchors it to the wall and hauls the packaging to your bin.",
    related: ["Furniture assembly", "Furniture anchoring", "Shelving installation"],
    marker: [-0.4, 1.7, 0.0],
    view: v([-2.5, 3.1, 3.4], [-0.3, 0.4, -0.1]),
  },
  {
    id: "thermostat",
    zone: "house",
    area: "Living room",
    service: "hvac",
    chip: "Thermostat at 84°",
    title: "Thermostat reading 84°F",
    problem:
      "The thermostat is set to 72° but the house is at 84° and the vents are barely moving air.",
    fix: "A licensed HVAC tech checks the thermostat, filter, refrigerant and blower to get cooling back.",
    related: [
      "AC repair",
      "Thermostat installation",
      "Airflow & duct problems",
      "Seasonal tune-ups",
    ],
    marker: [1.75, 2.2, -5.4],
    view: v([-0.8, 2.1, -2.4], [1.9, 1.55, -5.4]),
  },
  // Bath
  {
    id: "shower-leak",
    zone: "house",
    area: "Bathroom",
    service: "plumbing",
    chip: "Leaky shower",
    title: "Leaky shower and slow drain",
    problem:
      "The shower head drips constantly and water sits in the tub because the drain is slow.",
    fix: "A plumber replaces the cartridge, clears the drain line and checks for hidden leaks behind the wall.",
    related: ["Shower & tub repair", "Drain clearing", "Water-pressure problems"],
    marker: [5.0, 2.6, -5.3],
    view: v([3.4, 4.8, -1.4], [4.9, 0.9, -5.2]),
  },
  // Utility room
  {
    id: "breaker-panel",
    zone: "house",
    area: "Utility room",
    service: "electrical",
    chip: "Tripped breaker",
    title: "Breaker keeps tripping",
    problem: "One circuit keeps tripping and the breaker is warm to the touch.",
    fix: "A licensed electrician traces the overloaded circuit, replaces the breaker if needed and balances the load.",
    related: [
      "Panel upgrades",
      "Circuit repair",
      "Whole-home surge protection",
      "Generator hookups",
    ],
    marker: [5.6, 2.3, -0.4],
    view: v([2.6, 2.1, 2.6], [5.9, 1.5, -0.4]),
  },
  {
    id: "water-heater",
    zone: "house",
    area: "Utility room",
    service: "plumbing",
    chip: "Water heater leak",
    title: "Leaking water heater",
    problem:
      "The tank base is rusted and there is a puddle under the water heater. Showers are running cold.",
    fix: "A licensed plumber checks the tank and relief valve and repairs or replaces the heater to code.",
    related: ["Water heater repair", "Water heater replacement", "Tankless conversion"],
    marker: [3.0, 2.3, -2.3],
    view: v([4.6, 2.5, 2.6], [3.1, 1.0, -2.1]),
  },
  {
    id: "washer-e21",
    zone: "house",
    area: "Utility room",
    service: "appliances",
    chip: "Washer error E21",
    title: "Washer stuck on error E21",
    problem:
      "The washer will not drain and shows E21. Soapy water is creeping out of the door seal.",
    fix: "An appliance tech clears the drain pump, checks the hose and tests a full cycle.",
    related: ["Washer repair", "Dryer repair", "Dryer vent service", "Appliance installation"],
    marker: [2.6, 1.5, 0.5],
    view: v([5.8, 2.0, 3.2], [2.5, 0.6, 0.4]),
  },
  {
    id: "smoke-detector",
    zone: "house",
    area: "Utility room",
    service: "smart",
    chip: "Chirping detector",
    title: "Smoke detector chirping",
    problem: "The hallway smoke detector chirps every minute. It is past its replacement date.",
    fix: "A pro replaces smoke and CO detectors, interconnects them and tests every alarm.",
    related: ["Smoke & CO detectors", "Leak sensors", "Smart home setup"],
    marker: [4.8, 3.5, -2.5],
    view: v([3.0, 2.5, 1.6], [4.7, 2.8, -2.7]),
  },
  // Exterior
  {
    id: "front-door",
    zone: "house",
    area: "Exterior",
    service: "smart",
    chip: "Doorbell & smart lock",
    title: "Video doorbell and smart lock",
    problem: "The doorbell camera is offline and the new smart lock is still in its box.",
    fix: "A pro installs the lock, wires or mounts the doorbell and connects both to your Wi-Fi and phone.",
    related: ["Video doorbells", "Smart locks", "Security cameras", "Lock rekeying"],
    marker: [1.1, 2.9, 2.4],
    view: v([3.8, 2.3, 7.6], [1.2, 1.3, 2.1]),
  },
  {
    id: "garage-door",
    zone: "house",
    area: "Exterior",
    service: "exterior",
    chip: "Garage door off track",
    title: "Garage door off its track",
    problem: "One side of the garage door jumped the track and the door is hanging crooked.",
    fix: "A garage door specialist resets the track, replaces worn rollers and checks the springs and opener.",
    related: ["Garage door repair", "Spring replacement", "Opener installation"],
    marker: [8.75, 3.2, 2.6],
    view: v([11.6, 2.7, 10.5], [8.75, 1.3, 2.2]),
  },
  {
    id: "roof-gutter",
    zone: "house",
    area: "Exterior",
    service: "exterior",
    chip: "Roof & gutters",
    title: "Missing shingles and overflowing gutter",
    problem:
      "Wind lifted a patch of shingles on the garage roof and the gutter is overflowing at the corner.",
    fix: "A roofer replaces the shingles and underlayment, then the gutter is cleared, resloped and resealed.",
    related: ["Roof repair", "Gutter repair", "Soffit & fascia", "Siding repair"],
    marker: [9.2, 4.9, 0.4],
    view: v([14, 8.8, 8.6], [9.2, 3.8, 0.2]),
  },
  {
    id: "fence-gate",
    zone: "house",
    area: "Exterior",
    service: "exterior",
    chip: "Leaning fence",
    title: "Leaning fence and sagging gate",
    problem:
      "A post rotted at the base, so a fence panel is leaning and the gate drags on the ground.",
    fix: "A fence pro sets a new post in concrete, rehangs the panel and adjusts the gate hinges and latch.",
    related: ["Fence repair", "Gate repair", "Deck & porch repair"],
    marker: [-11.4, 2.3, 1.4],
    view: v([-5.2, 3.2, 8.2], [-11.3, 0.9, 1.0]),
  },
  {
    id: "condenser",
    zone: "house",
    area: "Exterior",
    service: "hvac",
    chip: "AC unit not running",
    title: "Outdoor AC unit not running",
    problem: "The condenser fan is stopped even though the thermostat is calling for cooling.",
    fix: "A licensed HVAC tech tests the capacitor, contactor and fan motor and restores cooling.",
    related: ["AC repair", "Heat pumps & mini-splits", "Seasonal tune-ups"],
    marker: [-10.25, 1.9, -4.2],
    view: v([-10.0, 2.05, 0.4], [-10.25, 0.55, -4.2]),
  },
  {
    id: "ev-charger",
    zone: "house",
    area: "Exterior",
    service: "electrical",
    chip: "EV charger install",
    title: "EV charger ready for install",
    problem: "A new Level 2 charger is on the garage wall but it has no dedicated circuit yet.",
    fix: "A licensed electrician runs a dedicated 240V circuit, pulls the permit and commissions the charger.",
    related: ["EV charger installation", "Panel upgrades", "Outdoor outlets"],
    marker: [11.7, 2.2, 0.6],
    view: v([15, 2.6, 5.4], [11.6, 1.3, 0.6]),
  },
  // X-Ray systems
  {
    id: "xray-plumbing",
    zone: "house",
    area: "Inside the walls",
    service: "plumbing",
    chip: "Hidden pipes",
    title: "Pipes inside the walls and sewer line",
    problem:
      "Supply lines, drains and the sewer lateral run where you cannot see them. Slow leaks here cause mold and rot.",
    fix: "Specialists use leak detection, camera inspection and pressure testing to find problems before they spread.",
    related: ["Leak detection", "Sewer line specialists", "Septic specialists", "Repiping"],
    marker: [-2, 0.8, 3.4],
    view: v([6, 12, 16], [-1, 0, -1]),
    xray: true,
  },
  {
    id: "xray-wiring",
    zone: "house",
    area: "Inside the walls",
    service: "electrical",
    chip: "Hidden wiring",
    title: "Wiring behind the drywall",
    problem:
      "Every outlet, switch and fixture traces back to the panel. Loose or overloaded runs are a fire risk.",
    fix: "A licensed electrician inspects, tests and repairs circuits, and adds outlets or dedicated lines to code.",
    related: ["Electrical inspection", "New circuits", "Outlets & switches", "Rewiring"],
    marker: [2.1, 3.6, -5.7],
    view: v([4, 10, 14], [0, 1.5, -3]),
    xray: true,
  },
  {
    id: "xray-ducts",
    zone: "house",
    area: "Inside the walls",
    service: "hvac",
    chip: "Hidden ductwork",
    title: "Ductwork above the ceiling",
    problem: "Leaky or crushed ducts waste energy and leave some rooms hot while others are cold.",
    fix: "An HVAC pro tests airflow, seals and repairs ducts, and adds indoor air-quality equipment if needed.",
    related: ["Duct repair & sealing", "Airflow balancing", "Indoor air quality"],
    marker: [-3.2, 4.4, -3.6],
    view: v([3, 11, 12], [-1, 3, -3]),
    xray: true,
  },
];

export const getZone = (id?: string | null) => zones.find((z) => z.id === id);
export const getSpot = (id?: string | null) => spots.find((s) => s.id === id);
export const spotsForZone = (zone: ZoneId, xray = false) =>
  spots.filter((s) => s.zone === zone && Boolean(s.xray) === xray);
/** Best spot to open when a user picks a whole service category. */
export const heroSpotForService = (service: string) =>
  spots.find((s) => s.service === service && !s.xray);

/**
 * Idle cinematic tour. After a stretch with no taps, the camera cranes
 * around the house on its own: establishing shot, room by room through
 * the house, then out to the yard.
 * Travel time between stops is worked out from the distance flown.
 */
export interface TourStop {
  caption: string;
  view: CameraView;
  /** Seconds to hold on the framing, drifting in slowly. */
  hold: number;
  /** Indoor close-up: widen the lens on phones instead of pulling back through walls. */
  close?: boolean;
}
const spotStop = (id: string, hold = 3.2): TourStop => {
  const s = getSpot(id)!;
  return {
    caption: s.title,
    view: s.view,
    hold,
    close: s.zone === "house" && s.area !== "Exterior",
  };
};
export const tour: TourStop[] = [
  { caption: "If it’s broken, start here.", view: homeView, hold: 3.5 },
  spotStop("kitchen-pipe"),
  spotStop("fridge", 2.6),
  {
    caption: "The living room",
    view: v([1.2, 2.9, 1.2], [-1.6, 1.0, -3.6]),
    hold: 2.4,
    close: true,
  },
  spotStop("tv-mount", 2.8),
  spotStop("ceiling-fan", 2.6),
  spotStop("thermostat", 2.6),
  spotStop("breaker-panel", 2.8),
  spotStop("washer-e21", 2.6),
  spotStop("front-door", 2.8),
  spotStop("garage-door", 2.8),
  spotStop("roof-gutter", 3),
  spotStop("ev-charger", 2.4),
  spotStop("condenser", 2.6),
  spotStop("fence-gate", 2.6),
];
