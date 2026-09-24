import { useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { DOMAIN, PHONE, SLOGAN } from "@/config/brand";
import type { Vec3 } from "@/config/world";
import { badge, ServiceVanDetailed } from "./ServiceVan";

/**
 * Fixing365 service van from a Meshy generated model (public/f365/models).
 * The model is a plain white high roof van: Meshy never draws the lettering,
 * because AI texturing warps text. All branding is painted here from the
 * site's own brand assets (badge, wordmark, slogan, phone, domain) and
 * projected onto the body with DecalGeometry so it follows the panels.
 *
 * The procedural ServiceVanDetailed stays as the loading fallback and as the
 * fallback if the model ever fails to load. ?oldvan forces it for comparison.
 */

const NAVY = "#14213a";
const ORANGE = "#ff7a1a";
const CHARCOAL = "#2b2f36";
const FONT = '"Space Grotesk", "Arial Black", Arial, sans-serif';

const small =
  typeof window !== "undefined" &&
  (window.innerWidth < 768 || new URLSearchParams(window.location.search).has("lite"));
const URL_ = small ? "/f365/models/service-van-512.glb" : "/f365/models/service-van.glb";

/** Model units to scene metres, and the lift that puts the tyres on y = 0. */
const SCALE = 3.1005;
const LIFT = 1.1726;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** "Fixing" in navy, "365" in orange, on a light background. */
function wordmarkDark(g: CanvasRenderingContext2D, x: number, y: number, size: number) {
  g.textBaseline = "alphabetic";
  g.font = `800 ${size}px ${FONT}`;
  g.fillStyle = NAVY;
  g.fillText("Fixing", x, y);
  const w = g.measureText("Fixing").width;
  g.fillStyle = ORANGE;
  g.fillText("365", x + w, y);
  return w + g.measureText("365").width;
}

/**
 * Cargo side, x from rear to the B pillar, y from above the wheel arches to
 * the roof. Drawn in a "nose at right" frame; panels mirror for the other
 * side, text never does.
 */
function sideCanvas(noseRight: boolean) {
  const W = 2560;
  const H = 864;
  const [c, g] = canvas(W, H);
  const X = (x: number) => (noseRight ? x * W : (1 - x) * W);
  const shape = (pts: [number, number][], fill: string) => {
    g.fillStyle = fill;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), y * H) : g.moveTo(X(x), y * H)));
    g.closePath();
    g.fill();
  };
  // Navy rear sweep with a raked leading edge.
  shape(
    [
      [0, 0],
      [0.3, 0],
      [0.19, 1],
      [0, 1],
    ],
    NAVY,
  );
  // Orange arrow swoosh rising toward the rear.
  g.fillStyle = ORANGE;
  g.beginPath();
  g.moveTo(X(0.66), H * 1.0);
  g.quadraticCurveTo(X(0.4), H * 0.92, X(0.3), H * 0.3);
  g.lineTo(X(0.27), H * 0.3);
  g.lineTo(X(0.335), H * 0.06);
  g.lineTo(X(0.395), H * 0.3);
  g.lineTo(X(0.36), H * 0.3);
  g.quadraticCurveTo(X(0.45), H * 0.84, X(0.74), H * 1.0);
  g.closePath();
  g.fill();
  // Charcoal lower sweep along the rocker.
  g.fillStyle = CHARCOAL;
  g.beginPath();
  g.moveTo(X(0.2), H);
  g.quadraticCurveTo(X(0.55), H * 0.8, X(1), H * 0.9);
  g.lineTo(X(1), H);
  g.closePath();
  g.fill();

  // Logo lockup on the white panel ahead of the arrow, never over it.
  const bs = H * 0.26;
  g.font = `800 ${H * 0.2}px ${FONT}`;
  const wordW = g.measureText("Fixing365").width;
  const lockW = bs * 1.15 + wordW;
  const zoneL = noseRight ? 0.44 * W : 0.06 * W;
  const zoneW = 0.5 * W;
  const k = Math.min(1, zoneW / lockW);
  g.save();
  g.translate(zoneL + (zoneW - lockW * k) / 2, 0);
  g.scale(k, k);
  badge(g, 0, (H * 0.16) / k, bs);
  const ww = wordmarkDark(g, bs * 1.15, (H * 0.36) / k, H * 0.2);
  g.font = `600 ${H * 0.085}px ${FONT}`;
  g.fillStyle = NAVY;
  g.fillText(SLOGAN.replace(/\.$/, ""), bs * 1.17 + ww * 0.18, (H * 0.5) / k);
  // Contact line under the lockup.
  g.font = `800 ${H * 0.09}px ${FONT}`;
  const phoneW = g.measureText(PHONE).width;
  g.font = `600 ${H * 0.065}px ${FONT}`;
  const domW = g.measureText(DOMAIN).width;
  const gap = H * 0.08;
  const tx = lockW / 2 - (phoneW + gap + domW) / 2;
  g.font = `800 ${H * 0.09}px ${FONT}`;
  g.fillStyle = NAVY;
  g.fillText(PHONE, tx, (H * 0.7) / k);
  g.fillStyle = ORANGE;
  g.fillRect(tx + phoneW + gap / 2 - 3, (H * 0.63) / k, 6, H * 0.08);
  g.font = `600 ${H * 0.065}px ${FONT}`;
  g.fillStyle = "#3b4a63";
  g.fillText(DOMAIN, tx + phoneW + gap, (H * 0.695) / k);
  g.restore();
  return tex(c);
}

/** Front door panel under the window: phone and domain. */
function doorCanvas() {
  const [c, g] = canvas(1024, 512);
  g.font = `800 150px ${FONT}`;
  g.fillStyle = NAVY;
  g.textAlign = "center";
  g.fillText(PHONE, 512, 250);
  g.font = `600 100px ${FONT}`;
  g.fillStyle = ORANGE;
  g.fillText(DOMAIN, 512, 400);
  return tex(c);
}

/** Split rear doors: opaque white base, navy footer, full lockup and contact. */
function rearCanvas() {
  const [c, g] = canvas(1024, 1024);
  g.fillStyle = "#f7f8fa";
  g.fillRect(0, 0, 1024, 1024);
  const bs = 170;
  badge(g, 512 - bs / 2, 110, bs);
  g.textAlign = "left";
  g.font = `800 118px ${FONT}`;
  const w = g.measureText("Fixing365").width;
  wordmarkDark(g, 512 - w / 2, 420, 118);
  g.textAlign = "center";
  g.font = `600 64px ${FONT}`;
  g.fillStyle = NAVY;
  g.fillText(SLOGAN.replace(/\.$/, ""), 512, 530);
  g.fillStyle = ORANGE;
  g.beginPath();
  g.moveTo(0, 700);
  g.lineTo(1024, 610);
  g.lineTo(1024, 660);
  g.lineTo(0, 750);
  g.fill();
  g.fillStyle = NAVY;
  g.beginPath();
  g.moveTo(0, 750);
  g.lineTo(1024, 660);
  g.lineTo(1024, 1024);
  g.lineTo(0, 1024);
  g.fill();
  g.font = `800 84px ${FONT}`;
  g.fillStyle = "#ffffff";
  g.fillText(PHONE, 512, 860);
  g.font = `600 58px ${FONT}`;
  g.fillStyle = ORANGE;
  g.fillText(DOMAIN, 512, 950);
  // Seam between the two doors.
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.fillRect(510, 0, 4, 1024);
  return tex(c);
}

function hoodCanvas() {
  const [c, g] = canvas(1024, 384);
  const bs = 200;
  g.font = `800 150px ${FONT}`;
  const w = g.measureText("Fixing365").width;
  const x0 = 512 - (bs * 1.12 + w) / 2;
  badge(g, x0, 92, bs);
  wordmarkDark(g, x0 + bs * 1.12, 245, 150);
  return tex(c);
}

type DecalSpec = {
  key: string;
  map: () => THREE.Texture;
  pos: [number, number, number];
  x: [number, number, number];
  y: [number, number, number];
  size: [number, number, number];
  opaque?: boolean;
};

const DECALS: DecalSpec[] = [
  // Nose at +x. The +z side reads nose right, the -z side nose left.
  {
    key: "side-pz",
    map: () => sideCanvas(true),
    pos: [-0.78, 1.55, 0.88],
    x: [1, 0, 0],
    y: [0, 1, 0],
    size: [4.05, 1.4, 0.56],
  },
  {
    key: "side-nz",
    map: () => sideCanvas(false),
    pos: [-0.78, 1.55, -0.88],
    x: [-1, 0, 0],
    y: [0, 1, 0],
    size: [4.05, 1.4, 0.56],
  },
  {
    key: "door-pz",
    map: doorCanvas,
    pos: [1.7, 1.1, 0.9],
    x: [1, 0, 0],
    y: [0, 1, 0],
    size: [0.78, 0.36, 0.6],
  },
  {
    key: "door-nz",
    map: doorCanvas,
    pos: [1.7, 1.1, -0.9],
    x: [-1, 0, 0],
    y: [0, 1, 0],
    size: [0.78, 0.36, 0.6],
  },
  {
    key: "rear",
    map: rearCanvas,
    pos: [-2.84, 1.33, 0],
    x: [0, 0, 1],
    y: [0, 1, 0],
    size: [1.5, 1.45, 0.4],
    opaque: true,
  },
  {
    key: "hood",
    map: hoodCanvas,
    pos: [2.56, 1.2, 0],
    x: [0, 0, -1],
    y: [-0.93, 0.37, 0],
    size: [0.95, 0.36, 0.5],
  },
];

function decalOrientation(xa: [number, number, number], ya: [number, number, number]) {
  const x = new THREE.Vector3(...xa).normalize();
  const y = new THREE.Vector3(...ya).normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  y.crossVectors(z, x);
  return new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function VanModel({ night }: { night: boolean }) {
  const gltf = useGLTF(URL_);
  const built = useMemo(() => {
    // Bake orientation (nose to +x), scale and lift into one standalone mesh
    // so decals can be projected in the van's own metre space.
    let src: THREE.Mesh | null = null;
    gltf.scene.traverse((o) => {
      if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh;
    });
    const mesh = src as unknown as THREE.Mesh;
    // Meshopt quantizes positions and stores the dequantize transform on the node.
    gltf.scene.updateMatrixWorld(true);
    const geo = mesh.geometry.clone();
    // Quantized attributes are normalized integers that would clamp once
    // scaled, so expand position and normal to floats before transforming.
    for (const name of ["position", "normal"] as const) {
      const a = geo.getAttribute(name);
      if (!a || a.array instanceof Float32Array) continue;
      const out = new Float32Array(a.count * 3);
      for (let i = 0; i < a.count; i++) {
        out[i * 3] = a.getX(i);
        out[i * 3 + 1] = a.getY(i);
        out[i * 3 + 2] = a.getZ(i);
      }
      geo.setAttribute(name, new THREE.BufferAttribute(out, 3));
    }
    geo.applyMatrix4(mesh.matrixWorld);
    geo.applyMatrix4(
      new THREE.Matrix4()
        .makeTranslation(0, LIFT, 0)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
        .multiply(new THREE.Matrix4().makeScale(SCALE, SCALE, SCALE)),
    );
    geo.computeBoundingSphere();
    const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
    mat.side = THREE.FrontSide;
    mat.envMapIntensity = 0.9;
    const body = new THREE.Mesh(geo, mat);
    body.castShadow = true;
    body.receiveShadow = true;
    body.updateMatrixWorld(true);

    const decals = DECALS.map((d) => {
      const map = d.map();
      const g = new DecalGeometry(
        body,
        new THREE.Vector3(...d.pos),
        decalOrientation(d.x, d.y),
        new THREE.Vector3(...d.size),
      );
      const m = new THREE.MeshStandardMaterial({
        map,
        transparent: !d.opaque,
        depthWrite: false,
        roughness: 0.38,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -4,
      });
      const dm = new THREE.Mesh(g, m);
      dm.receiveShadow = true;
      dm.name = `livery-${d.key}`;
      return { mesh: dm, spec: d };
    });
    return { body, decals };
  }, [gltf]);

  // Repaint lettering once the brand font is ready, and free GPU memory on unmount.
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      built.decals.forEach(({ mesh, spec }) => {
        const m = mesh.material as THREE.MeshStandardMaterial;
        const fresh = spec.map();
        m.map?.dispose();
        m.map = fresh;
        m.needsUpdate = true;
      });
    });
    return () => {
      alive = false;
      built.body.geometry.dispose();
      (built.body.material as THREE.Material).dispose();
      built.decals.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        const m = mesh.material as THREE.MeshStandardMaterial;
        m.map?.dispose();
        m.dispose();
      });
    };
  }, [built]);

  return (
    <group name="service-van-model">
      <primitive object={built.body} />
      {built.decals.map(({ mesh }) => (
        <primitive key={mesh.name} object={mesh} />
      ))}
      {night && (
        <>
          <pointLight position={[3.3, 0.95, 0.62]} intensity={1.2} distance={4} color="#fff4dc" />
          <pointLight position={[3.3, 0.95, -0.62]} intensity={1.2} distance={4} color="#fff4dc" />
        </>
      )}
    </group>
  );
}

class VanBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function ServiceVan({
  position,
  rotation = 0,
  night = false,
}: {
  position: Vec3;
  rotation?: number;
  night?: boolean;
}) {
  const legacy = <ServiceVanDetailed position={position} rotation={rotation} />;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("oldvan")) {
    return legacy;
  }
  return (
    <VanBoundary fallback={legacy}>
      <Suspense fallback={legacy}>
        <group name="fixing365-service-van" position={position} rotation={[0, rotation, 0]}>
          <VanModel night={night} />
        </group>
      </Suspense>
    </VanBoundary>
  );
}
