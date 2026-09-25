import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { world } from "./store";
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
const SKIN = [std("#8d5a3b"), std("#c68b62"), std("#e2b48f"), std("#5e3a24")];
const HAIR = [std("#1c1714"), std("#3b2a1e"), std("#6b4a2b"), std("#a0a0a0")];
const SHOE = std("#1f2226", 0.6);

const geo = {
  thigh: (() => {
    const g = new THREE.CapsuleGeometry(0.078, 0.3, 6, 12);
    g.translate(0, -0.2, 0);
    return g;
  })(),
  shin: (() => {
    const g = new THREE.CapsuleGeometry(0.062, 0.3, 6, 12);
    g.translate(0, -0.2, 0);
    return g;
  })(),
  upperArm: (() => {
    const g = new THREE.CapsuleGeometry(0.052, 0.2, 6, 12);
    g.translate(0, -0.14, 0);
    return g;
  })(),
  forearm: (() => {
    const g = new THREE.CapsuleGeometry(0.042, 0.2, 6, 12);
    g.translate(0, -0.14, 0);
    return g;
  })(),
  chest: new THREE.CapsuleGeometry(0.17, 0.2, 8, 16),
  hips: new THREE.CapsuleGeometry(0.15, 0.06, 8, 16),
  neck: new THREE.CylinderGeometry(0.045, 0.05, 0.1, 10),
  head: new THREE.SphereGeometry(0.105, 24, 18),
  hair: new THREE.SphereGeometry(0.112, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
  pony: new THREE.CapsuleGeometry(0.035, 0.12, 4, 8),
  eye: new THREE.SphereGeometry(0.012, 8, 6),
  nose: new THREE.SphereGeometry(0.016, 8, 6),
  ear: new THREE.SphereGeometry(0.022, 8, 6),
  hand: new THREE.SphereGeometry(0.045, 12, 10),
  shoe: (() => {
    const g = new THREE.CapsuleGeometry(0.05, 0.12, 4, 8);
    g.rotateX(Math.PI / 2);
    return g;
  })(),
  sole: new THREE.BoxGeometry(0.1, 0.02, 0.24),
  capBrim: new THREE.CylinderGeometry(0.09, 0.09, 0.012, 16, 1, false, -Math.PI / 2, Math.PI),
};
const EYE = std("#1a1a1a", 0.3);
const SOLE = std("#f2f2ee", 0.7);

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
          ["L", -0.085],
          ["R", 0.085],
        ] as const
      ).map(([k, x]) => (
        <group key={k} ref={set(`leg${k}`)} position={[x, 0.9, 0]}>
          <mesh geometry={geo.thigh} material={pants} castShadow />
          <group ref={set(`knee${k}`)} position={[0, -0.42, 0]}>
            <mesh geometry={geo.shin} material={pants} castShadow />
            <group position={[0, -0.44, 0.04]}>
              <mesh geometry={geo.shoe} material={SHOE} castShadow />
              <mesh geometry={geo.sole} material={SOLE} position={[0, -0.045, 0]} />
            </group>
          </group>
        </group>
      ))}
      <group ref={set("torso")} position={[0, 0.98, 0]}>
        <mesh geometry={geo.hips} material={pants} scale={[1.05, 1, 0.8]} castShadow />
        <mesh
          geometry={geo.chest}
          material={shirt}
          position={[0, 0.3, 0]}
          scale={[1.12, 1, 0.78]}
          castShadow
        />
        <mesh geometry={geo.neck} material={skin} position={[0, 0.56, 0]} />
        {(
          [
            ["L", -0.235],
            ["R", 0.235],
          ] as const
        ).map(([k, x]) => (
          <group key={k} ref={set(`arm${k}`)} position={[x, 0.48, 0]}>
            <mesh geometry={geo.upperArm} material={shirt} castShadow />
            <group ref={set(`elbow${k}`)} position={[0, -0.29, 0]}>
              <mesh geometry={geo.forearm} material={skin} castShadow />
              <mesh
                geometry={geo.hand}
                material={skin}
                position={[0, -0.3, 0]}
                scale={[0.9, 1.1, 0.75]}
              />
            </group>
          </group>
        ))}
        <group ref={set("head")} position={[0, 0.72, 0]}>
          <mesh geometry={geo.head} material={skin} scale={[0.95, 1.08, 1]} castShadow />
          {[-0.037, 0.037].map((ex) => (
            <mesh key={ex} geometry={geo.eye} material={EYE} position={[ex, 0.02, 0.095]} />
          ))}
          <mesh geometry={geo.nose} material={skin} position={[0, -0.01, 0.105]} />
          {[-0.1, 0.1].map((ex) => (
            <mesh
              key={ex}
              geometry={geo.ear}
              material={skin}
              position={[ex, 0, 0]}
              scale={[0.6, 1, 0.8]}
            />
          ))}
          {style === "cap" ? (
            <>
              <mesh
                geometry={geo.hair}
                material={cap}
                position={[0, 0.02, 0]}
                scale={[1.02, 0.95, 1.02]}
              />
              <mesh
                geometry={geo.capBrim}
                material={cap}
                position={[0, 0.03, 0.09]}
                scale={[1, 1, 1.4]}
              />
            </>
          ) : (
            <mesh geometry={geo.hair} material={hair} position={[0, 0.015, -0.006]} />
          )}
          {style === "pony" && (
            <mesh
              geometry={geo.pony}
              material={hair}
              position={[0, -0.02, -0.12]}
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

const DOG = std("#d9a760", 0.9);
const DOG_DARK = std("#b9854a", 0.9);
const NOSE = std("#1b1512", 0.4);
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

  useFrame(({ clock }) => {
    const p = person.current;
    const d = dog.current;
    const b = ball.current;
    if (!p?.root || !d || !b) return;
    const reduced = world.get().reduced;
    const t = reduced ? 5 : clock.elapsedTime % 7;
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
        {/* golden lab: rounded body and chest, neck, head with snout, floppy ears */}
        <mesh material={DOG} position={[0, 0.44, -0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.38, 8, 16]} />
        </mesh>
        <mesh material={DOG} position={[0, 0.46, 0.2]} scale={[1, 1.05, 1]} castShadow>
          <sphereGeometry args={[0.145, 16, 12]} />
        </mesh>
        <mesh material={DOG} position={[0, 0.56, 0.3]} rotation={[-0.7, 0, 0]}>
          <capsuleGeometry args={[0.075, 0.12, 6, 12]} />
        </mesh>
        <mesh material={COLLAR} position={[0, 0.55, 0.3]} rotation={[0.85, 0, 0]}>
          <torusGeometry args={[0.078, 0.014, 8, 20]} />
        </mesh>
        <group position={[0, 0.66, 0.4]}>
          <mesh material={DOG} scale={[0.92, 0.88, 1.05]} castShadow>
            <sphereGeometry args={[0.1, 16, 12]} />
          </mesh>
          <mesh material={DOG} position={[0, -0.035, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.048, 0.07, 6, 12]} />
          </mesh>
          <mesh material={NOSE} position={[0, -0.02, 0.175]}>
            <sphereGeometry args={[0.022, 10, 8]} />
          </mesh>
          {[-0.042, 0.042].map((x) => (
            <mesh key={x} material={NOSE} position={[x, 0.025, 0.085]}>
              <sphereGeometry args={[0.013, 8, 6]} />
            </mesh>
          ))}
          {[-1, 1].map((sd) => (
            <mesh
              key={sd}
              material={DOG_DARK}
              position={[sd * 0.085, -0.02, -0.01]}
              rotation={[0, 0, sd * 0.25]}
              scale={[0.35, 1, 0.75]}
            >
              <sphereGeometry args={[0.07, 12, 10]} />
            </mesh>
          ))}
        </group>
        {[
          [-0.08, 0.2],
          [0.08, 0.2],
          [-0.08, -0.22],
          [0.08, -0.22],
        ].map(([x, z], i) => (
          <group
            key={i}
            position={[x!, 0.38, z!]}
            ref={(g) => {
              if (g) legs.current[i] = g;
            }}
          >
            <mesh material={DOG} position={[0, -0.09, 0]}>
              <capsuleGeometry args={[0.042, 0.12, 6, 10]} />
            </mesh>
            <mesh material={DOG} position={[0, -0.24, 0.01]}>
              <capsuleGeometry args={[0.032, 0.12, 6, 10]} />
            </mesh>
            <mesh material={DOG_DARK} position={[0, -0.33, 0.03]} scale={[1, 0.6, 1.3]}>
              <sphereGeometry args={[0.038, 10, 8]} />
            </mesh>
          </group>
        ))}
        <group ref={tail} position={[0, 0.5, -0.3]}>
          <mesh material={DOG} position={[0, 0.07, -0.1]} rotation={[-0.9, 0, 0]}>
            <capsuleGeometry args={[0.025, 0.22, 6, 10]} />
          </mesh>
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
