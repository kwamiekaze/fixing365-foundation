import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { rigState, world } from "./store";
import { fetchCue } from "@/lib/ambience";
import { isEvening, useClockHour } from "./kit";

/**
 * Neighbors that make the street feel lived in: someone walking the
 * sidewalk, a jogger, two neighbors chatting on a driveway, and an owner
 * playing fetch with their dog on the side lawn. Each figure is a dozen
 * simple parts with procedural walk, run and gesture cycles. Phones get the
 * walker and the fetch scene only.
 */

const std = (color: string, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness });
const SKIN = [
  std("#8d5a3b", 0.55),
  std("#c68b62", 0.55),
  std("#e2b48f", 0.55),
  std("#5e3a24", 0.55),
];
const HAIR = [std("#1c1714", 0.7), std("#3b2a1e", 0.7), std("#6b4a2b", 0.7), std("#a0a0a0", 0.7)];
const SHOE = std("#2a2d33", 0.55);
const SOLE = std("#3b3e44", 0.85);
const EYE_WHITE = std("#f1ede6", 0.35);
const IRIS = std("#2a1d14", 0.25);
const LIP = std("#8a4b3c", 0.6);
const BELT = std("#2b2420", 0.5);

/**
 * Rounded, tapered limb as one lathe: radius r1 at the joint (y = 0),
 * narrowing to r2 at the far end (y = -len), with domed ends. Reads like a
 * real arm or leg instead of two joined tubes, for a few hundred triangles.
 */
function limb(r1: number, r2: number, len: number, seg = 12) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 4; i++) {
    const a = -Math.PI / 2 + (i / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * r2 + 1e-4, -len + Math.sin(a) * r2));
  }
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.cos(a) * r1 + 1e-4, Math.sin(a) * r1));
  }
  return new THREE.LatheGeometry(pts, seg);
}
const lathe = (pts: [number, number][], seg = 18) =>
  new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(r + 1e-4, y)),
    seg,
  );

const geo = {
  thigh: limb(0.086, 0.062, 0.37),
  shin: limb(0.06, 0.046, 0.37),
  sleeve: limb(0.064, 0.058, 0.11),
  upperArm: limb(0.05, 0.043, 0.25),
  forearm: limb(0.043, 0.033, 0.25),
  // Shirt from the hem up over the chest and shoulders to the collar.
  shirt: lathe([
    [0, 0.03],
    [0.152, 0.03],
    [0.158, 0.12],
    [0.163, 0.24],
    [0.182, 0.36],
    [0.198, 0.45],
    [0.196, 0.51],
    [0.16, 0.565],
    [0.075, 0.595],
    [0, 0.6],
  ]),
  // Seat and hips of the trousers, up under the shirt hem.
  pelvis: lathe([
    [0, -0.14],
    [0.11, -0.14],
    [0.152, -0.07],
    [0.158, 0.0],
    [0.155, 0.06],
    [0, 0.06],
  ]),
  shoulder: new THREE.SphereGeometry(0.066, 14, 10),
  neck: limb(0.05, 0.046, 0.1, 10),
  skull: new THREE.SphereGeometry(0.1, 24, 18),
  jaw: new THREE.SphereGeometry(0.072, 18, 12),
  hair: new THREE.SphereGeometry(0.108, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
  pony: limb(0.035, 0.02, 0.14, 8),
  eyeWhite: new THREE.SphereGeometry(0.015, 10, 8),
  iris: new THREE.SphereGeometry(0.0085, 8, 6),
  brow: new THREE.CapsuleGeometry(0.006, 0.028, 2, 6),
  nose: limb(0.012, 0.018, 0.035, 8),
  mouth: new THREE.CapsuleGeometry(0.0055, 0.03, 2, 6),
  ear: new THREE.SphereGeometry(0.022, 10, 8),
  palm: new THREE.SphereGeometry(0.04, 12, 10),
  thumb: limb(0.013, 0.011, 0.04, 8),
  belt: new THREE.TorusGeometry(0.155, 0.012, 6, 24),
  shoe: new THREE.SphereGeometry(0.058, 16, 10),
  sole: (() => {
    // Rounded rubber sole, a touch wider than the upper.
    const sh = new THREE.Shape();
    sh.absellipse(0, 0, 0.056, 0.135, 0, Math.PI * 2, false, 0);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: 0.022,
      bevelEnabled: false,
      curveSegments: 16,
    });
    g.rotateX(Math.PI / 2);
    g.translate(0, 0.011, 0);
    return g;
  })(),
  capBrim: (() => {
    const sh = new THREE.Shape();
    sh.absellipse(0, 0, 0.085, 0.07, 0, Math.PI, false, 0);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: 0.008,
      bevelEnabled: false,
      curveSegments: 12,
    });
    g.rotateX(Math.PI / 2);
    return g;
  })(),
  capButton: new THREE.SphereGeometry(0.012, 8, 6),
};

interface Look {
  shirt: string;
  pants: string;
  skin: number;
  hair: number;
  style?: "short" | "pony" | "cap";
  cap?: string;
}

interface Rig {
  root: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  kneeL: THREE.Group;
  kneeR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  elbowL: THREE.Group;
  elbowR: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
}

/**
 * One person with jointed limbs (hip, knee, shoulder, elbow), neck, face,
 * hands, sneakers and a hairstyle. Proportions are about 1.72 m tall.
 */
const Person = forwardRef<
  Rig | null,
  { look: Look; position?: [number, number, number]; rotation?: number }
>(function Person({ look, position = [0, 0, 0], rotation = 0 }, ref) {
  const shirt = useMemo(() => std(look.shirt, 0.9), [look.shirt]);
  const pants = useMemo(() => std(look.pants, 0.85), [look.pants]);
  const cap = useMemo(() => std(look.cap ?? "#c0392b", 0.7), [look.cap]);
  const skin = SKIN[look.skin % SKIN.length]!;
  const hair = HAIR[look.hair % HAIR.length]!;
  const rig = useRef<Partial<Rig>>({});
  const set = (k: keyof Rig) => (o: THREE.Group | null) => {
    if (o) (rig.current as Record<string, unknown>)[k] = o;
    if (typeof ref === "function") ref(rig.current as Rig);
    else if (ref) ref.current = rig.current as Rig;
  };
  const style = look.style ?? "short";
  return (
    <group ref={set("root")} position={position} rotation={[0, rotation, 0]} name="npc-person">
      {(
        [
          ["L", -0.088],
          ["R", 0.088],
        ] as const
      ).map(([k, x]) => (
        <group key={k} ref={set(`leg${k}`)} position={[x, 0.9, 0]}>
          <mesh geometry={geo.thigh} material={pants} castShadow />
          <group ref={set(`knee${k}`)} position={[0, -0.42, 0]}>
            <mesh geometry={geo.shin} material={pants} castShadow />
            {/* sneaker: rounded upper on a dark rubber sole */}
            <group position={[0, -0.44, 0.045]}>
              <mesh
                geometry={geo.shoe}
                material={SHOE}
                position={[0, 0.005, 0.01]}
                scale={[0.92, 0.62, 2.05]}
                castShadow
              />
              <mesh geometry={geo.sole} material={SOLE} position={[0, -0.045, 0.01]} />
            </group>
          </group>
        </group>
      ))}
      <group ref={set("torso")} position={[0, 0.98, 0]}>
        <mesh geometry={geo.pelvis} material={pants} scale={[1.02, 1, 0.66]} castShadow />
        <mesh
          geometry={geo.belt}
          material={BELT}
          position={[0, 0.045, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1.02, 0.66, 1]}
        />
        <mesh geometry={geo.shirt} material={shirt} scale={[1.08, 1, 0.64]} castShadow />
        <mesh geometry={geo.neck} material={skin} position={[0, 0.66, 0.005]} />
        {(
          [
            ["L", -0.228],
            ["R", 0.228],
          ] as const
        ).map(([k, x]) => (
          <group key={k} ref={set(`arm${k}`)} position={[x, 0.49, 0]}>
            <mesh geometry={geo.shoulder} material={shirt} scale={[0.95, 0.9, 0.95]} castShadow />
            <mesh geometry={geo.sleeve} material={shirt} castShadow />
            <mesh geometry={geo.upperArm} material={skin} position={[0, -0.04, 0]} castShadow />
            <group ref={set(`elbow${k}`)} position={[0, -0.29, 0]}>
              <mesh geometry={geo.forearm} material={skin} castShadow />
              <group position={[0, -0.29, 0]}>
                <mesh geometry={geo.palm} material={skin} scale={[0.72, 1.15, 0.5]} />
                <mesh
                  geometry={geo.thumb}
                  material={skin}
                  position={[x < 0 ? 0.018 : -0.018, 0.015, 0.018]}
                  rotation={[0.5, 0, x < 0 ? -0.5 : 0.5]}
                />
              </group>
            </group>
          </group>
        ))}
        <group ref={set("head")} position={[0, 0.74, 0]}>
          <mesh geometry={geo.skull} material={skin} scale={[0.9, 1.06, 1]} castShadow />
          <mesh
            geometry={geo.jaw}
            material={skin}
            position={[0, -0.055, 0.022]}
            scale={[1, 0.85, 1]}
          />
          {[-0.036, 0.036].map((ex) => (
            <group key={ex} position={[ex, 0.018, 0.084]}>
              <mesh geometry={geo.eyeWhite} material={EYE_WHITE} scale={[1.15, 0.8, 0.6]} />
              <mesh geometry={geo.iris} material={IRIS} position={[0, 0, 0.007]} />
              <mesh
                geometry={geo.brow}
                material={hair}
                position={[0, 0.03, 0.006]}
                rotation={[0, 0, Math.PI / 2 + (ex < 0 ? 0.12 : -0.12)]}
              />
            </group>
          ))}
          <mesh
            geometry={geo.nose}
            material={skin}
            position={[0, 0.012, 0.094]}
            rotation={[-0.35, 0, 0]}
          />
          <mesh
            geometry={geo.mouth}
            material={LIP}
            position={[0, -0.052, 0.087]}
            rotation={[0, 0, Math.PI / 2]}
          />
          {[-0.092, 0.092].map((ex) => (
            <mesh
              key={ex}
              geometry={geo.ear}
              material={skin}
              position={[ex, 0.005, -0.005]}
              scale={[0.45, 1, 0.75]}
            />
          ))}
          {style === "cap" ? (
            <>
              <mesh
                geometry={geo.hair}
                material={cap}
                position={[0, 0.03, -0.005]}
                scale={[0.98, 0.92, 1.02]}
              />
              <mesh geometry={geo.capButton} material={cap} position={[0, 0.128, -0.005]} />
              <mesh
                geometry={geo.capBrim}
                material={cap}
                position={[0, 0.05, 0.085]}
                rotation={[-0.12, 0, 0]}
                scale={[1, 1, 1.25]}
              />
              {/* hair showing at the sides and back under the cap */}
              <mesh
                geometry={geo.hair}
                material={hair}
                position={[0, 0.0, -0.012]}
                rotation={[-0.45, 0, 0]}
                scale={[0.97, 0.8, 0.97]}
              />
            </>
          ) : (
            <mesh
              geometry={geo.hair}
              material={hair}
              position={[0, 0.02, -0.008]}
              rotation={[-0.12, 0, 0]}
              scale={[0.97, 1, 1.02]}
            />
          )}
          {style === "pony" && (
            <mesh
              geometry={geo.pony}
              material={hair}
              position={[0, 0.03, -0.1]}
              rotation={[0.5, 0, 0]}
            />
          )}
        </group>
      </group>
    </group>
  );
});

function stride(r: Rig, phase: number, amount: number) {
  const s = Math.sin(phase) * amount;
  r.legL.rotation.x = s;
  r.legR.rotation.x = -s;
  r.kneeL.rotation.x = Math.max(0, -Math.sin(phase + 0.6)) * amount * 1.4;
  r.kneeR.rotation.x = Math.max(0, Math.sin(phase + 0.6)) * amount * 1.4;
  r.armL.rotation.x = -s * 0.8;
  r.armR.rotation.x = s * 0.8;
  r.elbowL.rotation.x = -0.3;
  r.elbowR.rotation.x = -0.3;
}

/** Relaxed standing pose with a slow breath and weight shift. */
function idle(r: Rig, t: number, seed: number) {
  r.torso.position.y = 0.98 + Math.sin(t * 1.6 + seed) * 0.006;
  r.torso.rotation.z = Math.sin(t * 0.4 + seed) * 0.02;
  r.head.rotation.y = Math.sin(t * 0.3 + seed * 2) * 0.25;
  r.elbowL.rotation.x = -0.15;
}

/** Two neighbors chatting: weight shifts, nods and the odd hand gesture. */
function Chatters({ at }: { at: [number, number] }) {
  const a = useRef<Rig | null>(null);
  const b = useRef<Rig | null>(null);
  useFrame(({ clock }) => {
    if (world.get().reduced) return;
    const t = clock.elapsedTime;
    [a.current, b.current].forEach((rig, i) => {
      if (!rig?.root) return;
      const talk = Math.sin(t * 0.5 + i * Math.PI) > 0.2;
      rig.armR.rotation.x = talk ? -0.6 + Math.sin(t * 3 + i) * 0.35 : -0.05;
      rig.armR.rotation.z = talk ? 0.25 : 0.05;
      idle(rig, t, i * 2);
      rig.elbowR.rotation.x = talk ? -1.1 + Math.sin(t * 4 + i) * 0.25 : -0.15;
      rig.head.rotation.x = talk ? Math.sin(t * 2.2) * 0.06 : 0;
    });
  });
  return (
    <group position={[at[0], 0, at[1]]}>
      <Person
        ref={a}
        look={{
          shirt: "#c0503a",
          pants: "#2f3a4d",
          skin: 1,
          hair: 0,
          style: "cap",
          cap: "#1f3b63",
        }}
        position={[-0.55, 0, 0]}
        rotation={Math.PI / 2}
      />
      <Person
        ref={b}
        look={{ shirt: "#e8d9a8", pants: "#5a4a3a", skin: 3, hair: 1, style: "pony" }}
        position={[0.55, 0, 0.1]}
        rotation={-Math.PI / 2}
      />
    </group>
  );
}

const DOG = std("#d4a05b", 0.88);
const DOG_LIGHT = std("#ebca95", 0.9);
const DOG_DARK = std("#b27a42", 0.88);
const NOSE = std("#1b1512", 0.35);
const DOG_EYE = std("#1e140d", 0.15);
const PAD = std("#3a2a22", 0.8);

/**
 * Golden lab built from smooth lathed forms: a barrel body deep at the
 * chest and tucked at the waist, a lighter chest and belly, a tapered neck,
 * a broad skull with a stop and square muzzle, soft drop ears, jointed legs
 * with a real hock on the back legs, and a thick otter tail.
 */
const dogGeo = {
  body: (() => {
    const g = lathe(
      [
        [0, -0.35],
        [0.07, -0.34],
        [0.112, -0.29],
        [0.126, -0.2],
        [0.118, -0.07],
        [0.13, 0.06],
        [0.148, 0.17],
        [0.146, 0.26],
        [0.1, 0.33],
        [0, 0.35],
      ],
      20,
    );
    g.rotateX(Math.PI / 2);
    return g;
  })(),
  chest: new THREE.SphereGeometry(0.12, 16, 12),
  neck: limb(0.078, 0.095, 0.2, 14),
  skull: new THREE.SphereGeometry(0.095, 20, 14),
  muzzle: (() => {
    const g = limb(0.056, 0.046, 0.1, 14);
    g.rotateX(-Math.PI / 2);
    return g;
  })(),
  nose: new THREE.SphereGeometry(0.024, 12, 8),
  eye: new THREE.SphereGeometry(0.014, 10, 8),
  ear: new THREE.SphereGeometry(0.07, 14, 10),
  upperFront: limb(0.046, 0.035, 0.19, 10),
  lowerFront: limb(0.033, 0.028, 0.16, 10),
  thigh: limb(0.066, 0.042, 0.16, 12),
  hock: limb(0.033, 0.028, 0.17, 10),
  paw: new THREE.SphereGeometry(0.04, 12, 8),
  tail: limb(0.03, 0.012, 0.28, 10),
};
const COLLAR = std("#ff7a1a", 0.5);
const BALL = new THREE.MeshStandardMaterial({ color: "#d8f03a", roughness: 0.5 });

/** Owner throws, the dog sprints out, grabs the ball and trots it back. */
function Fetch({ owner, target }: { owner: [number, number]; target: [number, number] }) {
  const person = useRef<Rig | null>(null);
  const dog = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group[]>([]);
  const tail = useRef<THREE.Group>(null);
  const ball = useRef<THREE.Mesh>(null);
  const O = useMemo(() => new THREE.Vector3(owner[0], 0, owner[1]), [owner]);
  const T = useMemo(() => new THREE.Vector3(target[0], 0, target[1]), [target]);
  const side = useMemo(() => O.clone().add(new THREE.Vector3(0.9, 0, 0.5)), [O]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const lastT = useRef(0);

  useFrame(({ clock }) => {
    const p = person.current;
    const d = dog.current;
    const b = ball.current;
    if (!p?.root || !d || !b) return;
    const reduced = world.get().reduced;
    const t = reduced ? 5 : clock.elapsedTime % 7;
    // Sound cues, fired once as the animation crosses each moment.
    const prevT = lastT.current;
    lastT.current = t;
    if (world.get().sound && !reduced) {
      const near = Math.max(0, 1 - rigState.target.distanceTo(O) / 30);
      const crossed = (m: number) => (prevT < m && t >= m) || (prevT > t && t >= m && m < 0.2);
      if (crossed(0.55)) fetchCue("throw", near);
      if (crossed(1.8)) fetchCue("land", near);
      if (crossed(2.45)) fetchCue("pickup", near);
    }
    p.root.lookAt(T.x, 0, T.z);
    idle(p, clock.elapsedTime, 1);
    p.elbowR.rotation.x = t < 0.5 ? -1.2 : t < 0.8 ? -1.2 + (t - 0.5) * 3.5 : -0.25;
    p.torso.rotation.y =
      t < 0.5 ? 0.35 * (t / 0.5) : t < 0.9 ? 0.35 - (t - 0.5) * 1.3 : Math.max(-0.17, -0.17);
    // Crouch and pat the dog when it brings the ball back.
    const pat = t > 4.8 && t < 6.2;
    p.armL.rotation.x = pat ? -0.9 : 0;
    p.elbowL.rotation.x = pat ? -0.4 + Math.sin(t * 9) * 0.2 : -0.15;
    // Owner's throwing arm: wind up, release, follow through.
    p.armR.rotation.x =
      t < 0.5
        ? -2.6 * (t / 0.5)
        : t < 0.8
          ? -2.6 + (t - 0.5) * 8
          : Math.max(-0.05, -0.2 + (t - 0.8) * -0.1);
    let running = false;
    let from = side;
    let to = side;
    let k = 0;
    if (t >= 0.6 && t < 2.4) {
      from = side;
      to = T;
      k = (t - 0.6) / 1.8;
      running = true;
    } else if (t >= 2.4 && t < 2.8) {
      from = to = T;
    } else if (t >= 2.8 && t < 4.8) {
      from = T;
      to = side;
      k = (t - 2.8) / 2;
      running = true;
    }
    tmp.lerpVectors(from, to, k < 1 ? k * k * (3 - 2 * k) : 1);
    d.position.set(tmp.x, running ? Math.abs(Math.sin(t * 16)) * 0.06 : 0, tmp.z);
    if (running) d.lookAt(to.x, 0, to.z);
    else d.lookAt(O.x, 0, O.z);
    legs.current.forEach((leg, i) => {
      leg.rotation.x = running
        ? Math.sin(t * 16 + (i % 2 ? Math.PI : 0) + (i > 1 ? 0.8 : 0)) * 0.7
        : 0;
    });
    if (tail.current) tail.current.rotation.y = Math.sin(t * (running ? 10 : 14)) * 0.6;
    // Ball: in hand, in flight, on the lawn, then in the dog's mouth.
    if (t < 0.6) b.position.set(O.x + 0.25, 1.75, O.z);
    else if (t < 1.8) {
      const f = (t - 0.6) / 1.2;
      b.position.set(
        O.x + (T.x - O.x) * f,
        1.9 * (1 - f) + Math.sin(f * Math.PI) * 2.4 + 0.07,
        O.z + (T.z - O.z) * f,
      );
    } else if (t < 2.4) b.position.set(T.x, 0.07, T.z);
    else {
      const mouth = new THREE.Vector3(0, 0.6, 0.6).applyMatrix4(d.matrixWorld);
      b.position.copy(mouth);
      if (t > 5.2) b.position.set(O.x + 0.2, 1.1, O.z);
    }
  });

  return (
    <group name="npc-fetch">
      <Person
        ref={person}
        look={{
          shirt: "#2e6f9e",
          pants: "#46505e",
          skin: 2,
          hair: 1,
          style: "cap",
          cap: "#ff7a1a",
        }}
        position={[owner[0], 0, owner[1]]}
      />
      <group ref={dog} name="npc-dog">
        <mesh
          geometry={dogGeo.body}
          material={DOG}
          position={[0, 0.45, -0.02]}
          scale={[0.86, 1.08, 1]}
          castShadow
        />
        {/* lighter chest and belly */}
        <mesh
          geometry={dogGeo.chest}
          material={DOG_LIGHT}
          position={[0, 0.4, 0.2]}
          scale={[0.9, 0.95, 0.9]}
        />
        <mesh
          geometry={dogGeo.neck}
          material={DOG}
          position={[0, 0.66, 0.36]}
          rotation={[0.75, 0, 0]}
          castShadow
        />
        <mesh material={COLLAR} position={[0, 0.575, 0.3]} rotation={[0.75, 0, 0]}>
          <torusGeometry args={[0.083, 0.013, 8, 24]} />
        </mesh>
        <group position={[0, 0.69, 0.42]}>
          <mesh geometry={dogGeo.skull} material={DOG} scale={[0.95, 0.86, 1.05]} castShadow />
          <mesh
            geometry={dogGeo.muzzle}
            material={DOG_LIGHT}
            position={[0, -0.035, 0.07]}
            scale={[1, 0.85, 1]}
          />
          <mesh
            geometry={dogGeo.nose}
            material={NOSE}
            position={[0, -0.022, 0.21]}
            scale={[1.2, 0.8, 0.8]}
          />
          {[-1, 1].map((sd) => (
            <group key={sd}>
              <mesh
                geometry={dogGeo.eye}
                material={DOG_EYE}
                position={[sd * 0.042, 0.022, 0.078]}
              />
              <mesh
                geometry={dogGeo.ear}
                material={DOG_DARK}
                position={[sd * 0.083, -0.03, -0.005]}
                rotation={[0.15, 0, sd * 0.22]}
                scale={[0.22, 1, 0.62]}
                castShadow
              />
            </group>
          ))}
        </group>
        {(
          [
            [-0.078, 0.4, 0.2, false],
            [0.078, 0.4, 0.2, false],
            [-0.082, 0.355, -0.24, true],
            [0.082, 0.355, -0.24, true],
          ] as [number, number, number, boolean][]
        ).map(([x, y, z, rear], i) => (
          <group
            key={i}
            position={[x, y, z]}
            ref={(g) => {
              if (g) legs.current[i] = g;
            }}
          >
            {rear ? (
              <>
                <mesh geometry={dogGeo.thigh} material={DOG} rotation={[-0.3, 0, 0]} castShadow />
                <group position={[0, -0.153, 0.047]} rotation={[0.38, 0, 0]}>
                  <mesh geometry={dogGeo.hock} material={DOG} castShadow />
                  <mesh
                    geometry={dogGeo.paw}
                    material={DOG}
                    position={[0, -0.19, 0.02]}
                    rotation={[-0.08, 0, 0]}
                    scale={[1, 0.55, 1.3]}
                  />
                </group>
              </>
            ) : (
              <>
                <mesh geometry={dogGeo.upperFront} material={DOG} castShadow />
                <mesh
                  geometry={dogGeo.lowerFront}
                  material={DOG}
                  position={[0, -0.2, 0]}
                  castShadow
                />
                <mesh
                  geometry={dogGeo.paw}
                  material={DOG}
                  position={[0, -0.372, 0.022]}
                  scale={[1, 0.55, 1.3]}
                />
                <mesh
                  geometry={dogGeo.paw}
                  material={PAD}
                  position={[0, -0.385, 0.018]}
                  scale={[0.75, 0.2, 1]}
                />
              </>
            )}
          </group>
        ))}
        <group ref={tail} position={[0, 0.52, -0.34]}>
          <mesh geometry={dogGeo.tail} material={DOG} rotation={[2.3, 0, 0]} castShadow />
        </group>
      </group>
      <mesh ref={ball} material={BALL} castShadow>
        <sphereGeometry args={[0.065, 12, 10]} />
      </mesh>
    </group>
  );
}

export function Neighbors() {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  // The owner and dog head inside at 7 PM and come back out in the morning.
  const outside = !isEvening(useClockHour());
  return (
    <group name="neighbors">
      {outside && <Fetch owner={[-18.2, 2.6]} target={[-13.8, -2.4]} />}
      {!mobile && <Chatters at={[31.8, 3.3]} />}
    </group>
  );
}
