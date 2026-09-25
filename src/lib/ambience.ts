import { isEvening, localHour } from "@/three/world/kit";

/**
 * Neighborhood soundscape, synthesized live with the Web Audio API so
 * there are no audio files to download.
 *
 * Day: a soft breeze through the trees, songbirds at irregular intervals,
 * an occasional car passing on a nearby street, and the dog barking now
 * and then, with long, uneven gaps (never back to back).
 * Night (7 PM to 7 AM): crickets and the breeze, no dog.
 * The fetch game adds its own cues (throw, bounce, pick-up) timed to the
 * animation, louder when the camera is near the side lawn.
 *
 * Sound is off until the visitor turns it on, which also satisfies the
 * browser rule that audio must start from a tap or click.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let windGain: GainNode | null = null;
let timers: number[] = [];
let running = false;
let lastBark = 0;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const day = () => !isEvening(localHour());

function noiseBuffer(c: AudioContext) {
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    // Slightly brown noise: softer and more natural than white noise.
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3.5;
  }
  return b;
}

function out(pan = 0) {
  const p = ctx!.createStereoPanner();
  p.pan.value = pan;
  p.connect(master!);
  return p;
}

function noiseSource(loop = false) {
  const s = ctx!.createBufferSource();
  s.buffer = noise;
  s.loop = loop;
  return s;
}

/* ---------- ambience ---------- */

function startWind() {
  const src = noiseSource(true);
  const lp = ctx!.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 520;
  windGain = ctx!.createGain();
  windGain.gain.value = 0.05;
  // Slow gusts.
  const lfo = ctx!.createOscillator();
  const depth = ctx!.createGain();
  lfo.frequency.value = 0.07;
  depth.gain.value = 0.03;
  lfo.connect(depth).connect(windGain.gain);
  src.connect(lp).connect(windGain).connect(out(0));
  src.start();
  lfo.start();
}

function chirp(t: number, f0: number, f1: number, dur: number, vol: number, pan: number) {
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out(pan));
  o.start(t);
  o.stop(t + dur + 0.02);
}

function birdSong() {
  const t = ctx!.currentTime + 0.05;
  const pan = rand(-0.8, 0.8);
  const base = rand(2400, 3800);
  const notes = Math.floor(rand(2, 6));
  for (let i = 0; i < notes; i++) {
    const st = t + i * rand(0.09, 0.16);
    chirp(st, base * rand(0.9, 1.1), base * rand(1.15, 1.45), rand(0.05, 0.11), 0.035, pan);
  }
}

function crickets() {
  const t = ctx!.currentTime + 0.05;
  const pan = rand(-0.9, 0.9);
  for (let i = 0; i < 3; i++) {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.frequency.value = rand(4300, 4700);
    const st = t + i * 0.07;
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(0.012, st + 0.01);
    g.gain.linearRampToValueAtTime(0, st + 0.045);
    o.connect(g).connect(out(pan));
    o.start(st);
    o.stop(st + 0.06);
  }
}

function carPass() {
  const t = ctx!.currentTime + 0.05;
  const src = noiseSource(true);
  const lp = ctx!.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 380;
  const g = ctx!.createGain();
  const p = ctx!.createStereoPanner();
  const dir = Math.random() < 0.5 ? -1 : 1;
  p.pan.setValueAtTime(-0.9 * dir, t);
  p.pan.linearRampToValueAtTime(0.9 * dir, t + 5);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.09, t + 2.3);
  g.gain.linearRampToValueAtTime(0, t + 5);
  src.connect(lp).connect(g).connect(p).connect(master!);
  src.start(t);
  src.stop(t + 5.1);
}

/** A medium dog's bark: a falling voiced tone through a mouth-like band filter, plus breath. */
function bark(t: number, vol: number, pan: number) {
  const o = ctx!.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(rand(520, 600), t);
  o.frequency.exponentialRampToValueAtTime(rand(260, 320), t + 0.13);
  const bp = ctx!.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1100;
  bp.Q.value = 1.2;
  const g = ctx!.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(bp).connect(g).connect(out(pan));
  o.start(t);
  o.stop(t + 0.18);
  const n = noiseSource();
  const nf = ctx!.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.value = 1600;
  const ng = ctx!.createGain();
  ng.gain.setValueAtTime(vol * 0.5, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  n.connect(nf).connect(ng).connect(out(pan));
  n.start(t);
  n.stop(t + 0.1);
}

/** One to three barks, never within 25 seconds of the last. */
function maybeBark(vol = 0.22) {
  if (!ctx || !day()) return;
  const now = ctx.currentTime;
  if (now - lastBark < 25) return;
  lastBark = now;
  const count = Math.random() < 0.55 ? 1 : Math.random() < 0.7 ? 2 : 3;
  const pan = -0.45;
  for (let i = 0; i < count; i++) bark(now + 0.05 + i * rand(0.22, 0.34), vol, pan);
}

function loop(fn: () => void, min: number, max: number) {
  const tick = () => {
    if (!running) return;
    fn();
    timers.push(window.setTimeout(tick, rand(min, max) * 1000));
  };
  timers.push(window.setTimeout(tick, rand(min, max) * 1000));
}

/* ---------- fetch cues (called from the fetch animation) ---------- */

export type FetchCue = "throw" | "land" | "pickup";

/** `near` is 0..1: how close the camera is to the side lawn. */
export function fetchCue(cue: FetchCue, near: number) {
  if (!running || !ctx || !day()) return;
  const t = ctx.currentTime + 0.01;
  const vol = 0.05 + near * 0.2;
  const pan = -0.35;
  if (cue === "throw") {
    // Whoosh of the arm and ball.
    const n = noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.9, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    n.connect(bp).connect(g).connect(out(pan));
    n.start(t);
    n.stop(t + 0.35);
  } else if (cue === "land") {
    // Tennis ball bouncing twice on grass.
    [0, 0.28].forEach((dt, i) => {
      const o = ctx!.createOscillator();
      o.frequency.setValueAtTime(170, t + dt);
      o.frequency.exponentialRampToValueAtTime(70, t + dt + 0.09);
      const g = ctx!.createGain();
      g.gain.setValueAtTime(vol * (i ? 0.45 : 0.9), t + dt);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.12);
      o.connect(g).connect(out(pan + 0.2));
      o.start(t + dt);
      o.stop(t + dt + 0.14);
    });
  } else if (cue === "pickup") {
    // Happy bark on some pick-ups only, still respecting the long gap.
    if (Math.random() < 0.35) maybeBark(0.14 + near * 0.18);
  }
}

/* ---------- public controls ---------- */

export async function startAmbience() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    noise = noiseBuffer(ctx);
    startWind();
  }
  await ctx.resume();
  master!.gain.cancelScheduledValues(ctx.currentTime);
  master!.gain.setTargetAtTime(0.8, ctx.currentTime, 0.6);
  if (running) return;
  running = true;
  lastBark = ctx.currentTime - 10; // first bark no sooner than ~15 s in
  loop(() => (day() ? birdSong() : crickets()), 1.2, 7);
  loop(() => day() && Math.random() < 0.6 && birdSong(), 4, 11);
  loop(() => day() && carPass(), 28, 70);
  loop(() => maybeBark(), 30, 75);
}

export function stopAmbience() {
  running = false;
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
  if (ctx && master) {
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    window.setTimeout(() => ctx?.suspend(), 900);
  }
}
