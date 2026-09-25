import { useTexture } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import type { Vec3 } from "@/config/world";

/**
 * Fixing365 service van built from the three reference photos (side,
 * front, rear). The body is an extruded side silhouette traced from the
 * side photo, so the painted skins line up with the real outline. The
 * skins are cut out of the photos with the studio background removed:
 * the near side uses the side photo, the far side a mirrored copy with the
 * logo, slogan and phone laid back on the right way round, and the rear
 * doors and front end use their own photos with the manufacturer badge
 * painted out. Real 3D wheels, dark wheel wells and windshield glass sit on top; mirrors come from the photos.
 * All five skins together weigh about 210 KB, so it loads fast on phones.
 */

const LENGTH = 5.9;
const PX = LENGTH / 1245; // metres per pixel of the side photo crop
const GROUND_ROW = 567;
const SKIN_W = 1245 * PX;
const SKIN_H = 567 * PX;
const WIDTH = 2.02;

/** Side silhouette in photo pixels (column, row), nose at column 0. */
const PROFILE: [number, number][] = [
  // Traced just inside the side photo's outline so no body paint ever
  // shows past the livery, especially around the nose and front bumper.
  [62, 484],
  [62, 300],
  [75, 268],
  [100, 257],
  [125, 248],
  [150, 227],
  [178, 201],
  [300, 106],
  [440, 22],
  [470, 17],
  [1172, 17],
  [1194, 26],
  [1210, 60],
  [1212, 460],
  [1200, 474],
  [1180, 484],
];

const toX = (col: number) => (col - 1245 / 2) * PX;

/**
 * The nose wraps: the front 60 px of each side photo (headlight and bumper
 * corner) turns inward on a hinge so the sides meet the front photo at a
 * chamfered corner instead of two flat sheets crossing at a right angle.
 */
const HINGE = 60;
const NOSE_START = 16; // first column where the photo nose is a clean vertical edge
const NOSE_L = (HINGE - NOSE_START) * PX;
const NOSE_ANG = 0.7;
const NOSE_IN = NOSE_L * Math.sin(NOSE_ANG);
const NOSE_X = toX(HINGE) - NOSE_L * Math.cos(NOSE_ANG);

/** Plane that shows only the u0..u1 slice of its texture. */
function slicePlane(w: number, h: number, u0: number, u1: number) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes["uv"]!;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  uv.needsUpdate = true;
  return g;
}
const toY = (row: number) => (GROUND_ROW - row) * PX;

function bodyGeometry() {
  const s = new THREE.Shape();
  PROFILE.forEach(([c, r], i) => (i ? s.lineTo(toX(c), toY(r)) : s.moveTo(toX(c), toY(r))));
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: WIDTH - 0.08,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  g.translate(0, 0, -(WIDTH - 0.08) / 2);
  return g;
}

function Wheel({ x, z }: { x: number; z: number }) {
  const side = Math.sign(z);
  return (
    <group position={[x, 0.42, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh material={M.tire} castShadow>
        <cylinderGeometry args={[0.42, 0.42, 0.25, 32]} />
      </mesh>
      <mesh material={M.tireWall} position={[0, side * 0.126, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.004, 32]} />
      </mesh>
      <mesh material={M.rim} position={[0, side * 0.128, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.01, 28]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          material={M.slot}
          position={[
            Math.cos((i / 10) * Math.PI * 2) * 0.17,
            side * 0.134,
            Math.sin((i / 10) * Math.PI * 2) * 0.17,
          ]}
        >
          <cylinderGeometry args={[0.028, 0.028, 0.004, 10]} />
        </mesh>
      ))}
      <mesh material={M.hub} position={[0, side * 0.136, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.02, 20]} />
      </mesh>
    </group>
  );
}

const M = {
  paint: new THREE.MeshStandardMaterial({ color: "#f2f3f4", roughness: 0.3, metalness: 0.1 }),
  tire: new THREE.MeshStandardMaterial({ color: "#141516", roughness: 0.92 }),
  tireWall: new THREE.MeshStandardMaterial({ color: "#1c1d1f", roughness: 0.85 }),
  rim: new THREE.MeshStandardMaterial({ color: "#c7ccd1", roughness: 0.28, metalness: 0.85 }),
  slot: new THREE.MeshStandardMaterial({ color: "#2a2d31", roughness: 0.6 }),
  hub: new THREE.MeshStandardMaterial({ color: "#9aa1a8", roughness: 0.3, metalness: 0.9 }),
  glass: new THREE.MeshStandardMaterial({
    color: "#10171e",
    roughness: 0.06,
    metalness: 0.3,
    envMapIntensity: 0.8,
  }),
  trim: new THREE.MeshStandardMaterial({ color: "#1b1d20", roughness: 0.55 }),
  well: new THREE.MeshStandardMaterial({
    color: "#0c0d0e",
    roughness: 1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  }),
};

/**
 * Front end, cut from the straight-on photo of the wrapped Sprinter. The
 * fascia photo (headlights, grille, fog lights, bumper, badge painted out)
 * stands on the nose from the bumper line up to the hood's front edge; the
 * hood photo (wiper cowl, vents, logo and slogan, livery swooshes) is laid
 * on a trapezoid running from that edge up to the base of the windshield,
 * narrow at the chamfered nose and full width at the glass, so the two
 * meet in one continuous image with no ledge between them.
 */
const FRONT_Y = 0.29;
const FRONT_H = 0.82;
const HOOD_BACK = new THREE.Vector2(toX(178), toY(196));

const HOOD_KNEE = new THREE.Vector2(toX(80), toY(258));

/**
 * Two panels: a steep nose panel from the fascia up to the hood's knee,
 * then the shallower hood to the glass, so the sheet stays clear of the
 * body's rounded nose. The photo is a straight-on view, so each point
 * takes its photo row from its height.
 */
function hoodGeometry(frontW: number) {
  const y0 = FRONT_Y + FRONT_H;
  const lift = 0.018;
  const pts = [new THREE.Vector2(NOSE_X, y0), HOOD_KNEE, HOOD_BACK];
  // Lift each point clear of the body along the sheet's outward normal.
  const lifted = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)]!;
    const b = pts[Math.min(pts.length - 1, i + 1)]!;
    const d = b.clone().sub(a).normalize();
    return p.clone().add(new THREE.Vector2(-d.y, d.x).multiplyScalar(lift));
  });
  const fw = frontW / 2;
  const bw = (WIDTH - 0.06) / 2;
  const span = HOOD_BACK.y - y0;
  const t = pts.map((p) => (p.y - y0) / span); // 0 at the fascia, 1 at the glass
  const half = t.map((k) => fw + (bw - fw) * k);
  // Photo columns 127..1127: the fascia edge spans 145..1110, the glass 212..1042.
  const uL = t.map((k) => (145 + (212 - 145) * k - 127) / 1000);
  const uR = t.map((k) => (1110 + (1042 - 1110) * k - 127) / 1000);
  const P: number[] = [];
  const UV: number[] = [];
  lifted.forEach((p, i) => {
    P.push(p.x, p.y, -half[i]!, p.x, p.y, half[i]!);
    UV.push(uL[i]!, t[i]!, uR[i]!, t[i]!);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(UV, 2));
  // rows: 0/1 fascia edge, 2/3 knee, 4/5 glass (even = -z, odd = +z)
  g.setIndex([0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4]);
  g.computeVertexNormals();
  return g;
}

function VanBody() {
  const [side, far, back, front, hood] = useTexture([
    "/van/side.webp",
    "/van/side-far.webp",
    "/van/back.webp",
    "/van/front.webp",
    "/van/hood.webp",
  ]);
  const skins = useMemo(() => {
    const make = (map: THREE.Texture) => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      return new THREE.MeshStandardMaterial({
        map,
        alphaTest: 0.5,
        roughness: 0.32,
        metalness: 0.08,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
    };
    return {
      side: make(side!),
      far: make(far!),
      back: make(back!),
      front: make(front!),
      hood: make(hood!),
    };
  }, [side, far, back, front, hood]);
  const body = useMemo(bodyGeometry, []);
  const geo = useMemo(() => {
    const u = HINGE / 1245;
    const frontW = WIDTH - 2 * NOSE_IN + 0.01;
    return {
      main: slicePlane((1245 - HINGE) * PX, SKIN_H, u, 1),
      noseNear: slicePlane(NOSE_L, SKIN_H, NOSE_START / 1245, u),
      mainFar: slicePlane((1245 - HINGE) * PX, SKIN_H, 0, 1 - u),
      noseFar: slicePlane(NOSE_L, SKIN_H, 1 - u, 1 - NOSE_START / 1245),
      front: new THREE.PlaneGeometry(frontW, FRONT_H),
      hood: hoodGeometry(frontW),
    };
  }, []);
  const z = WIDTH / 2 + 0.004;
  // Windshield runs from the hood line up to the roof on the side profile.
  const ws0 = new THREE.Vector2(toX(178), toY(196));
  const ws1 = new THREE.Vector2(toX(440), toY(18));
  const wsMid = ws0.clone().add(ws1).multiplyScalar(0.5);
  const wsLen = ws0.distanceTo(ws1);
  const wsAng = Math.atan2(ws1.y - ws0.y, ws1.x - ws0.x);
  return (
    <group>
      <mesh geometry={body} material={M.paint} castShadow receiveShadow />
      {/* photo skins: near side, far side, rear doors, front end */}
      <mesh
        material={skins.side}
        geometry={geo.main}
        position={[toX((HINGE + 1245) / 2), SKIN_H / 2, z]}
      />
      <group position={[toX(HINGE), SKIN_H / 2, z]} rotation={[0, -NOSE_ANG, 0]}>
        <mesh material={skins.side} geometry={geo.noseNear} position={[-NOSE_L / 2, 0, 0]} />
      </group>
      <mesh
        material={skins.far}
        geometry={geo.mainFar}
        position={[toX((HINGE + 1245) / 2), SKIN_H / 2, -z]}
        rotation={[0, Math.PI, 0]}
      />
      <group position={[toX(HINGE), SKIN_H / 2, -z]} rotation={[0, Math.PI + NOSE_ANG, 0]}>
        <mesh material={skins.far} geometry={geo.noseFar} position={[NOSE_L / 2, 0, 0]} />
      </group>
      <mesh
        material={skins.back}
        position={[toX(1212) + 0.045, 0.27 + 2.31 / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[2.1, 2.31]} />
      </mesh>
      {/* Sprinter front end: headlights, grille and bumper on the fascia, the
          lettered hood sloping from the fascia's top edge up to the windshield */}
      <mesh
        material={skins.front}
        geometry={geo.front}
        position={[NOSE_X - 0.004, FRONT_Y + FRONT_H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <mesh material={skins.hood} geometry={geo.hood} />
      {/* dark wheel wells behind the tires */}
      {[toX(165 - 5), toX(1000 - 5)].flatMap((wx) =>
        [1, -1].map((sd) => (
          <mesh
            key={`${wx}-${sd}`}
            material={M.well}
            position={[wx, 0.42, sd * (WIDTH / 2 + 0.008)]}
            rotation={[0, sd > 0 ? 0 : Math.PI, 0]}
          >
            <circleGeometry args={[0.49, 48]} />
          </mesh>
        )),
      )}
      {/* windshield glass laid along the profile */}
      <mesh
        material={M.glass}
        position={[wsMid.x - 0.02, wsMid.y + 0.02, 0]}
        rotation={[0, 0, wsAng - Math.PI / 2]}
      >
        <boxGeometry args={[0.015, wsLen, WIDTH - 0.16]} />
      </mesh>
      {/* underbody and a roof antenna */}
      <mesh material={M.trim} position={[0, 0.28, 0]}>
        <boxGeometry args={[LENGTH - 0.5, 0.18, WIDTH - 0.2]} />
      </mesh>
      <mesh material={M.trim} position={[toX(365), toY(13) + 0.14, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.008, 0.012, 0.3, 6]} />
      </mesh>
      {[toX(160), toX(995)].map((wx) => (
        <group key={wx}>
          <Wheel x={wx} z={WIDTH / 2 - 0.1} />
          <Wheel x={wx} z={-(WIDTH / 2 - 0.1)} />
        </group>
      ))}
    </group>
  );
}

/** Parked van. Nose points toward local -x; the lettered near side faces +z. */
export function ServiceVanDetailed({
  position,
  rotation = 0,
}: {
  position: Vec3;
  rotation?: number;
}) {
  return (
    <group name="fixing365-service-van" position={position} rotation={[0, rotation, 0]}>
      <Suspense fallback={null}>
        <VanBody />
      </Suspense>
    </group>
  );
}
