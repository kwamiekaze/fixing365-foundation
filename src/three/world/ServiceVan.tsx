import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { WRENCH_PATH } from "@/components/Brand";
import { DOMAIN, PHONE, SLOGAN } from "@/config/brand";
import type { Vec3 } from "@/config/world";

/**
 * Fixing365 service van, Transit-style high roof, in the fleet livery:
 * white body, navy rear panel, orange swoosh and rocker band, the badge,
 * wordmark and slogan, phone number and domain on both sides and the rear
 * doors. The body is one extruded side profile with rounded edges; the
 * livery is painted onto canvases at load, so there are no image downloads.
 */

const NAVY = "#14213a";
const ORANGE = "#ff7a1a";
const L = 5.9; // length
const W = 2.04; // width
const FONT = '"Space Grotesk", "Arial Black", Arial, sans-serif';

export function badge(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const r = s * 0.24;
  const grad = g.createLinearGradient(0, y, 0, y + s);
  grad.addColorStop(0, "#ffa24d");
  grad.addColorStop(1, "#f26a0d");
  g.fillStyle = grad;
  g.beginPath();
  g.roundRect(x, y, s, s, r);
  g.fill();
  g.save();
  g.translate(x + s * 0.2, y + s * 0.2);
  g.scale((s * 0.6) / 24, (s * 0.6) / 24);
  g.strokeStyle = "#fff";
  g.lineWidth = 2.3;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke(new Path2D(WRENCH_PATH));
  g.restore();
}

function wordmark(g: CanvasRenderingContext2D, x: number, y: number, size: number, slogan = true) {
  g.textBaseline = "alphabetic";
  g.font = `800 ${size}px ${FONT}`;
  g.fillStyle = "#ffffff";
  g.fillText("Fixing", x, y);
  const w = g.measureText("Fixing").width;
  g.fillStyle = ORANGE;
  g.fillText("365", x + w, y);
  if (slogan) {
    g.font = `italic 700 ${size * 0.42}px ${FONT}`;
    g.fillStyle = "#ffffff";
    g.fillText(SLOGAN.replace(/\.$/, ""), x + w * 0.62, y + size * 0.62);
  }
}

/** Side livery. `front` is the canvas x where the van's nose is (0 or width). */
function sideCanvas(noseRight: boolean, px: number) {
  const c = document.createElement("canvas");
  c.width = px;
  c.height = px / 2;
  const g = c.getContext("2d")!;
  const W2 = c.width;
  const H2 = c.height;
  // Work in a "nose at right" frame and mirror the panels (not the text) for the other side.
  const X = (x: number) => (noseRight ? x : W2 - x);
  const poly = (pts: [number, number][], fill: string) => {
    g.fillStyle = fill;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(X(x * W2), y * H2) : g.moveTo(X(x * W2), y * H2)));
    g.closePath();
    g.fill();
  };
  // navy rear panel with a raked front edge
  poly(
    [
      [0, 0.05],
      [0.66, 0.05],
      [0.56, 0.78],
      [0, 0.78],
    ],
    NAVY,
  );
  // orange swoosh rising toward the rear, and the rocker band
  poly(
    [
      [0, 0.5],
      [0.82, 0.74],
      [0.82, 0.8],
      [0, 0.6],
    ],
    ORANGE,
  );
  poly(
    [
      [0, 0.8],
      [1, 0.8],
      [1, 0.9],
      [0, 0.9],
    ],
    NAVY,
  );
  poly(
    [
      [0.03, 0.83],
      [0.97, 0.83],
      [0.97, 0.86],
      [0.03, 0.86],
    ],
    ORANGE,
  );
  // sliding door and panel seams
  g.strokeStyle = "rgba(0,0,0,0.28)";
  g.lineWidth = 3;
  [0.44, 0.7].forEach((sx) => {
    g.beginPath();
    g.moveTo(X(sx * W2), 0.06 * H2);
    g.lineTo(X(sx * W2), 0.8 * H2);
    g.stroke();
  });
  // logo lockup on the navy panel
  const s = H2 * 0.2;
  const lx = noseRight ? W2 * 0.05 : W2 * 0.4;
  badge(g, lx, H2 * 0.12, s);
  wordmark(g, lx + s * 1.15, H2 * 0.27, H2 * 0.15);
  g.font = `600 ${H2 * 0.06}px ${FONT}`;
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fillText(DOMAIN, lx + s * 1.18, H2 * 0.46);
  // phone number on the white cab door area
  g.font = `800 ${H2 * 0.075}px ${FONT}`;
  g.fillStyle = NAVY;
  const phoneX = noseRight ? W2 * 0.72 : W2 * 0.04;
  g.fillText(PHONE, phoneX, H2 * 0.58);
  g.font = `600 ${H2 * 0.05}px ${FONT}`;
  g.fillStyle = "#3b4a63";
  g.fillText(DOMAIN, phoneX, H2 * 0.65);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function rearCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 768;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 768, 768);
  g.fillStyle = NAVY;
  g.beginPath();
  g.roundRect(60, 70, 648, 300, 40);
  g.fill();
  badge(g, 100, 110, 110);
  wordmark(g, 230, 185, 86, false);
  g.font = `800 64px ${FONT}`;
  g.fillStyle = "#fff";
  g.fillText(PHONE, 150, 300);
  g.font = `600 40px ${FONT}`;
  g.fillStyle = ORANGE;
  g.fillText(DOMAIN, 250, 350);
  g.fillStyle = ORANGE;
  g.beginPath();
  g.moveTo(0, 560);
  g.lineTo(768, 470);
  g.lineTo(768, 520);
  g.lineTo(0, 610);
  g.fill();
  g.fillStyle = NAVY;
  g.fillRect(0, 610, 768, 158);
  g.strokeStyle = "rgba(0,0,0,0.35)";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(384, 20);
  g.lineTo(384, 768);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hoodCanvas() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 256);
  badge(g, 70, 70, 110);
  g.font = `800 64px ${FONT}`;
  g.fillStyle = NAVY;
  g.fillText("Fixing", 195, 150);
  const w = g.measureText("Fixing").width;
  g.fillStyle = ORANGE;
  g.fillText("365", 195 + w, 150);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Side silhouette: rear, roof, raked windshield, short hood, nose. */
function bodyGeometry() {
  const s = new THREE.Shape();
  const x0 = -L / 2;
  s.moveTo(x0, 0.45);
  s.lineTo(x0, 2.42);
  s.quadraticCurveTo(x0, 2.5, x0 + 0.1, 2.5);
  s.lineTo(1.35, 2.5);
  s.quadraticCurveTo(1.5, 2.5, 1.58, 2.4);
  s.lineTo(2.3, 1.64);
  s.quadraticCurveTo(2.36, 1.57, 2.46, 1.54);
  s.lineTo(2.86, 1.36);
  s.quadraticCurveTo(2.95, 1.3, 2.95, 1.18);
  s.lineTo(2.95, 0.5);
  s.lineTo(2.85, 0.45);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: W - 0.12,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.translate(0, 0, -(W - 0.12) / 2);
  return g;
}

export function ServiceVanDetailed({
  position,
  rotation = 0,
}: {
  position: Vec3;
  rotation?: number;
}) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  const tex = useMemo(() => {
    const px = mobile ? 1536 : 2048;
    return {
      left: sideCanvas(false, px),
      right: sideCanvas(true, px),
      rear: rearCanvas(),
      hood: hoodCanvas(),
    };
  }, [mobile]);
  // Repaint once the brand font has loaded so the lettering matches the site.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      const px = mobile ? 1536 : 2048;
      const fresh = [sideCanvas(false, px), sideCanvas(true, px), rearCanvas(), hoodCanvas()];
      [tex.left, tex.right, tex.rear, tex.hood].forEach((t, i) => {
        t.image = fresh[i]!.image;
        t.needsUpdate = true;
      });
    });
    return () => {
      alive = false;
    };
  }, [tex, mobile]);

  const m = useMemo(
    () => ({
      paint: new THREE.MeshStandardMaterial({
        color: "#f7f8fa",
        roughness: 0.28,
        metalness: 0.15,
        envMapIntensity: 1.2,
        side: THREE.DoubleSide,
      }),
      decalL: new THREE.MeshStandardMaterial({
        map: tex.left,
        transparent: true,
        depthWrite: false,
        roughness: 0.3,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      decalR: new THREE.MeshStandardMaterial({
        map: tex.right,
        transparent: true,
        depthWrite: false,
        roughness: 0.3,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      rear: new THREE.MeshStandardMaterial({
        map: tex.rear,
        roughness: 0.3,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      hood: new THREE.MeshStandardMaterial({
        map: tex.hood,
        roughness: 0.3,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: "#0e151d",
        roughness: 0.08,
        metalness: 0.25,
        envMapIntensity: 0.7,
      }),
      trim: new THREE.MeshStandardMaterial({ color: "#1d2024", roughness: 0.55 }),
      tire: new THREE.MeshStandardMaterial({ color: "#161718", roughness: 0.9 }),
      rim: new THREE.MeshStandardMaterial({ color: "#c9ced4", roughness: 0.25, metalness: 0.9 }),
      alu: new THREE.MeshStandardMaterial({ color: "#b8bdc3", roughness: 0.35, metalness: 0.85 }),
      head: new THREE.MeshStandardMaterial({
        color: "#f2f6ff",
        emissive: "#dfe8ff",
        emissiveIntensity: 0.6,
        roughness: 0.1,
      }),
      tail: new THREE.MeshStandardMaterial({
        color: "#b3121b",
        emissive: "#7a0a10",
        emissiveIntensity: 0.5,
        roughness: 0.2,
      }),
      amber: new THREE.MeshStandardMaterial({
        color: "#ff9d2e",
        emissive: "#aa5a00",
        emissiveIntensity: 0.4,
      }),
      plate: new THREE.MeshStandardMaterial({ color: "#f3f3ee", roughness: 0.5 }),
    }),
    [tex],
  );
  const body = useMemo(bodyGeometry, []);
  const z = W / 2 + 0.002;

  const Wheel = ({ x, side }: { x: number; side: 1 | -1 }) => (
    <group position={[x, 0.39, side * 0.9]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={m.tire} castShadow>
        <cylinderGeometry args={[0.39, 0.39, 0.27, 28]} />
      </mesh>
      <mesh material={m.rim} position={[0, side * 0.137, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      </mesh>
      <mesh material={m.trim} position={[0, side * 0.14, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.012, 16]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          material={m.trim}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 0.17,
            side * 0.142,
            Math.sin((i / 8) * Math.PI * 2) * 0.17,
          ]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.01, 8]} />
        </mesh>
      ))}
    </group>
  );

  return (
    <group name="fixing365-service-van" position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={body} material={m.paint} castShadow receiveShadow />
      {/* livery on both sides, the rear doors and the hood */}
      <mesh material={m.decalR} position={[-0.65, 1.45, z]}>
        <planeGeometry args={[4.5, 2.25]} />
      </mesh>
      <mesh material={m.decalL} position={[-0.65, 1.45, -z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[4.5, 2.25]} />
      </mesh>
      <mesh material={m.rear} position={[-L / 2 - 0.006, 1.47, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.86, 1.86]} />
      </mesh>
      {/* glass: windshield and cab side windows */}
      <mesh material={m.glass} position={[1.965, 2.04, 0]} rotation={[0, 0, 0.76]}>
        <boxGeometry args={[0.02, 1.02, 1.86]} />
      </mesh>
      {[1, -1].map((sd) => (
        <group key={sd}>
          <mesh
            material={m.glass}
            position={[1.72, 2.02, sd * (W / 2 + 0.004)]}
            rotation={[0, sd > 0 ? 0 : Math.PI, 0]}
          >
            <shapeGeometry
              args={[
                (() => {
                  const sh = new THREE.Shape();
                  sh.moveTo(-0.45, -0.3);
                  sh.lineTo(0.45, -0.3);
                  sh.lineTo(-0.15, 0.35);
                  sh.lineTo(-0.45, 0.35);
                  sh.closePath();
                  return sh;
                })(),
              ]}
            />
          </mesh>
          {/* mirror on its arm */}
          <mesh material={m.trim} position={[2.18, 1.8, sd * (W / 2 + 0.12)]}>
            <boxGeometry args={[0.08, 0.05, 0.22]} />
          </mesh>
          <mesh material={m.trim} position={[2.2, 1.78, sd * (W / 2 + 0.26)]}>
            <boxGeometry args={[0.1, 0.34, 0.08]} />
          </mesh>
          {/* door handles, side markers and rocker */}
          {[1.5, 0.6].map((hx) => (
            <mesh key={hx} material={m.trim} position={[hx, 1.28, sd * (W / 2 + 0.01)]}>
              <boxGeometry args={[0.2, 0.04, 0.03]} />
            </mesh>
          ))}
          <mesh material={m.amber} position={[2.55, 0.9, sd * (W / 2 - 0.01)]}>
            <boxGeometry args={[0.1, 0.05, 0.03]} />
          </mesh>
          <mesh material={m.trim} position={[0, 0.5, sd * (W / 2 - 0.02)]}>
            <boxGeometry args={[L - 0.2, 0.12, 0.05]} />
          </mesh>
          <Wheel x={-1.95} side={sd as 1 | -1} />
          <Wheel x={1.95} side={sd as 1 | -1} />
          {/* tail light stack and headlight */}
          <mesh material={m.tail} position={[-L / 2 - 0.05, 1.35, sd * 0.93]}>
            <boxGeometry args={[0.06, 0.62, 0.14]} />
          </mesh>
          <mesh material={m.head} position={[2.9, 1.1, sd * 0.72]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.12, 0.16, 0.38]} />
          </mesh>
        </group>
      ))}
      {/* grille, bumpers, plates */}
      <RoundedBox
        args={[0.12, 0.36, 1.1]}
        radius={0.04}
        position={[2.97, 0.88, 0]}
        material={m.trim}
      />
      {[-0.3, -0.18, -0.06, 0.06, 0.18, 0.3].map((gz) => (
        <mesh key={gz} material={m.alu} position={[3.035, 0.88, gz * 1.4]}>
          <boxGeometry args={[0.01, 0.3, 0.02]} />
        </mesh>
      ))}
      <RoundedBox
        args={[0.2, 0.3, W + 0.04]}
        radius={0.06}
        position={[3.0, 0.52, 0]}
        material={m.trim}
      />
      <RoundedBox
        args={[0.2, 0.26, W + 0.04]}
        radius={0.06}
        position={[-L / 2 - 0.02, 0.55, 0]}
        material={m.trim}
      />
      <mesh material={m.plate} position={[3.11, 0.54, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.52, 0.12]} />
      </mesh>
      <mesh material={m.plate} position={[-L / 2 - 0.13, 0.58, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.52, 0.12]} />
      </mesh>
      {/* roof ladder rack with a ladder, a tradesman's detail */}
      {[-2.3, -0.8, 0.7].map((rx) => (
        <mesh key={rx} material={m.alu} position={[rx, 2.62, 0]}>
          <boxGeometry args={[0.06, 0.06, W - 0.1]} />
        </mesh>
      ))}
      {[-0.55, 0.55].map((lz) => (
        <mesh key={lz} material={m.alu} position={[-0.8, 2.7, lz]}>
          <boxGeometry args={[3.4, 0.05, 0.06]} />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} material={m.alu} position={[-2.3 + i * 0.33, 2.7, 0]}>
          <boxGeometry args={[0.03, 0.03, 1.1]} />
        </mesh>
      ))}
    </group>
  );
}
