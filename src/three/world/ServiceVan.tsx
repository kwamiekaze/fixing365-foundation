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
  [4, 489],
  [2, 432],
  [10, 330],
  [40, 290],
  [100, 252],
  [150, 222],
  [178, 196],
  [300, 104],
  [440, 18],
  [470, 13],
  [1175, 13],
  [1196, 22],
  [1214, 60],
  [1218, 489],
  [1206, 490],
];

const toX = (col: number) => (col - 1245 / 2) * PX;
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
  const z = WIDTH / 2 + 0.004;
  // Windshield runs from the hood line up to the roof on the side profile.
  const ws0 = new THREE.Vector2(toX(178), toY(196));
  const ws1 = new THREE.Vector2(toX(440), toY(18));
  const wsMid = ws0.clone().add(ws1).multiplyScalar(0.5);
  const wsLen = ws0.distanceTo(ws1);
  const wsAng = Math.atan2(ws1.y - ws0.y, ws1.x - ws0.x);
  // Hood logo lies on the hood slope, lettering reading from the front.
  const h0 = new THREE.Vector2(toX(10), toY(330));
  const h1 = new THREE.Vector2(toX(178), toY(196));
  const hd = h1.clone().sub(h0).normalize();
  const hoodP = h0
    .clone()
    .add(h1)
    .multiplyScalar(0.5)
    .add(new THREE.Vector2(-hd.y, hd.x).multiplyScalar(0.09));
  const hoodQ = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(hd.x, hd.y, 0),
      new THREE.Vector3(-hd.y, hd.x, 0),
    ),
  );

  return (
    <group>
      <mesh geometry={body} material={M.paint} castShadow receiveShadow />
      {/* photo skins: near side, far side, rear doors, front end */}
      <mesh material={skins.side} position={[0, SKIN_H / 2, z]}>
        <planeGeometry args={[SKIN_W, SKIN_H]} />
      </mesh>
      <mesh material={skins.far} position={[0, SKIN_H / 2, -z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SKIN_W, SKIN_H]} />
      </mesh>
      <mesh
        material={skins.back}
        position={[toX(1218) + 0.03, 0.27 + 2.31 / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[2.1, 2.31]} />
      </mesh>
      <mesh
        material={skins.front}
        position={[toX(2) - 0.03, 0.29 + 0.85 / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <planeGeometry args={[2.0, 0.85]} />
      </mesh>
      <mesh material={skins.hood} quaternion={hoodQ} position={[hoodP.x, hoodP.y, 0]}>
        <planeGeometry args={[1.03, 0.56]} />
      </mesh>
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
