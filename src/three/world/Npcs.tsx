import { useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { world } from "./store";

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
  limb: (() => {
    const g = new THREE.CapsuleGeometry(0.055, 0.34, 4, 8);
    g.translate(0, -0.22, 0);
    return g;
  })(),
  arm: (() => {
    const g = new THREE.CapsuleGeometry(0.042, 0.3, 4, 8);
    g.translate(0, -0.19, 0);
    return g;
  })(),
  torso: new THREE.CapsuleGeometry(0.15, 0.32, 4, 10),
  head: new THREE.SphereGeometry(0.11, 16, 12),
  hair: new THREE.SphereGeometry(0.115, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
  shoe: new THREE.BoxGeometry(0.09, 0.06, 0.18),
};

interface Look {
  shirt: string;
  pants: string;
  skin: number;
  hair: number;
}

interface Rig {
  root: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  torso: THREE.Mesh;
}

/** One person. Limbs are pivot groups so any cycle can drive them. */
const Person = forwardRef<
  Rig | null,
  { look: Look; position?: [number, number, number]; rotation?: number }
>(function Person({ look, position = [0, 0, 0], rotation = 0 }, ref) {
  const shirt = useMemo(() => std(look.shirt), [look.shirt]);
  const pants = useMemo(() => std(look.pants), [look.pants]);
  const skin = SKIN[look.skin % SKIN.length]!;
  const hair = HAIR[look.hair % HAIR.length]!;
  const rig = useRef<Partial<Rig>>({});
  const set = (k: keyof Rig) => (o: THREE.Group | THREE.Mesh | null) => {
    if (o) (rig.current as Record<string, unknown>)[k] = o;
    if (typeof ref === "function") ref(rig.current as Rig);
    else if (ref) ref.current = rig.current as Rig;
  };
  return (
    <group ref={set("root")} position={position} rotation={[0, rotation, 0]} name="npc-person">
      {(
        [
          ["legL", -0.08],
          ["legR", 0.08],
        ] as const
      ).map(([k, x]) => (
        <group key={k} ref={set(k)} position={[x, 0.86, 0]}>
          <mesh geometry={geo.limb} material={pants} castShadow />
          <mesh geometry={geo.shoe} material={SHOE} position={[0, -0.83, 0.04]} castShadow />
        </group>
      ))}
      <mesh
        ref={set("torso")}
        geometry={geo.torso}
        material={shirt}
        position={[0, 1.18, 0]}
        castShadow
      />
      {(
        [
          ["armL", -0.2],
          ["armR", 0.2],
        ] as const
      ).map(([k, x]) => (
        <group key={k} ref={set(k)} position={[x, 1.38, 0]}>
          <mesh geometry={geo.arm} material={shirt} castShadow />
          <mesh geometry={geo.head} material={skin} position={[0, -0.44, 0]} scale={0.38} />
        </group>
      ))}
      <mesh geometry={geo.head} material={skin} position={[0, 1.66, 0]} castShadow />
      <mesh geometry={geo.hair} material={hair} position={[0, 1.685, -0.005]} />
    </group>
  );
});

function stride(r: Rig, phase: number, amount: number) {
  const s = Math.sin(phase) * amount;
  r.legL.rotation.x = s;
  r.legR.rotation.x = -s;
  r.armL.rotation.x = -s * 0.8;
  r.armR.rotation.x = s * 0.8;
  r.torso.position.y = 1.18 + Math.abs(Math.cos(phase)) * 0.025 * (amount / 0.5);
}

/** Walks back and forth along a straight line, turning smoothly at each end. */
function Walker({
  look,
  from,
  to,
  speed,
  run = false,
}: {
  look: Look;
  from: [number, number];
  to: [number, number];
  speed: number;
  run?: boolean;
}) {
  const r = useRef<Rig | null>(null);
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const heading = Math.atan2(to[0] - from[0], to[1] - from[1]);
  useFrame(({ clock }) => {
    const rig = r.current;
    if (!rig?.root || world.get().reduced) return;
    const t = clock.elapsedTime * speed + len * 0.37;
    const k = (t % (len * 2)) / len;
    const back = k > 1;
    const u = back ? 2 - k : k;
    rig.root.position.set(
      from[0] + (to[0] - from[0]) * u,
      run ? Math.abs(Math.sin(t * 5)) * 0.05 : 0,
      from[1] + (to[1] - from[1]) * u,
    );
    const target = heading + (back ? Math.PI : 0);
    rig.root.rotation.y +=
      Math.atan2(Math.sin(target - rig.root.rotation.y), Math.cos(target - rig.root.rotation.y)) *
      0.15;
    stride(rig, t * (run ? 5.2 : 3.6), run ? 0.85 : 0.5);
    if (run) {
      rig.armL.rotation.z = -0.3;
      rig.armR.rotation.z = 0.3;
    }
  });
  return <Person ref={r} look={look} />;
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
      rig.torso.rotation.z = Math.sin(t * 0.7 + i) * 0.03;
    });
  });
  return (
    <group position={[at[0], 0, at[1]]}>
      <Person
        ref={a}
        look={{ shirt: "#c0503a", pants: "#2f3a4d", skin: 1, hair: 0 }}
        position={[-0.55, 0, 0]}
        rotation={Math.PI / 2}
      />
      <Person
        ref={b}
        look={{ shirt: "#e8d9a8", pants: "#5a4a3a", skin: 3, hair: 3 }}
        position={[0.55, 0, 0.1]}
        rotation={-Math.PI / 2}
      />
    </group>
  );
}

const DOG = std("#b07a45");
const DOG_DARK = std("#6b4526");
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
    if (t < 0.6) b.position.set(O.x + 0.2, 1.9, O.z);
    else if (t < 1.8) {
      const f = (t - 0.6) / 1.2;
      b.position.set(
        O.x + (T.x - O.x) * f,
        1.9 * (1 - f) + Math.sin(f * Math.PI) * 2.4 + 0.07,
        O.z + (T.z - O.z) * f,
      );
    } else if (t < 2.4) b.position.set(T.x, 0.07, T.z);
    else {
      const mouth = new THREE.Vector3(0, 0.38, 0.42).applyMatrix4(d.matrixWorld);
      b.position.copy(mouth);
      if (t > 5.2) b.position.set(O.x + 0.2, 1.1, O.z);
    }
  });

  return (
    <group name="npc-fetch">
      <Person
        ref={person}
        look={{ shirt: "#2e6f9e", pants: "#3c3f45", skin: 2, hair: 1 }}
        position={[owner[0], 0, owner[1]]}
      />
      <group ref={dog} name="npc-dog">
        <mesh material={DOG} position={[0, 0.34, 0]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.52]} />
        </mesh>
        <mesh material={DOG} position={[0, 0.48, 0.3]} castShadow>
          <boxGeometry args={[0.17, 0.17, 0.18]} />
        </mesh>
        <mesh material={DOG_DARK} position={[0, 0.44, 0.42]}>
          <boxGeometry args={[0.1, 0.08, 0.1]} />
        </mesh>
        {[-0.06, 0.06].map((x) => (
          <mesh
            key={x}
            material={DOG_DARK}
            position={[x, 0.59, 0.27]}
            rotation={[0.3, 0, x > 0 ? -0.3 : 0.3]}
          >
            <boxGeometry args={[0.05, 0.1, 0.03]} />
          </mesh>
        ))}
        {[
          [-0.07, 0.19],
          [0.07, 0.19],
          [-0.07, -0.19],
          [0.07, -0.19],
        ].map(([x, z], i) => (
          <group
            key={i}
            position={[x!, 0.26, z!]}
            ref={(g) => {
              if (g) legs.current[i] = g;
            }}
          >
            <mesh material={DOG} position={[0, -0.13, 0]}>
              <boxGeometry args={[0.06, 0.26, 0.06]} />
            </mesh>
          </group>
        ))}
        <group ref={tail} position={[0, 0.42, -0.26]}>
          <mesh material={DOG_DARK} position={[0, 0.06, -0.08]} rotation={[0.8, 0, 0]}>
            <boxGeometry args={[0.035, 0.035, 0.2]} />
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
  return (
    <group name="neighbors">
      <Walker
        look={{ shirt: "#7a4fa0", pants: "#2b2f36", skin: 0, hair: 0 }}
        from={[-30, 5.1]}
        to={[26, 5.1]}
        speed={1.25}
      />
      <Fetch owner={[-18.2, 2.6]} target={[-13.8, -2.4]} />
      {!mobile && (
        <>
          <Walker
            look={{ shirt: "#e07a2f", pants: "#1e2a38", skin: 2, hair: 2 }}
            from={[-44, 12.9]}
            to={[44, 12.9]}
            speed={2.8}
            run
          />
          <Chatters at={[31.8, 3.3]} />
        </>
      )}
    </group>
  );
}
