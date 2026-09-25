import { StaticBatch } from "../../world/StaticBatch";
import { RoundedBox } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { B, C, M, S, Pipe, glow } from "../../world/kit";
import { Blink, Spin, Stream } from "../../world/fx";
import { Hotspot } from "../../world/Hotspot";
import { Label } from "../../world/Label";
import { useFixed } from "../../world/store";

/* ---------- Garage geometry constants ---------- */
const GX1 = 6;
const GX2 = 11.5;
const GW = GX2 - GX1;
const GCX = (GX1 + GX2) / 2;
const EAVE_Y = 2.95;
const EAVE_Z = 2.35;
const RIDGE_Y = 4.8;
const RIDGE_Z = -2;
const RUN = EAVE_Z - RIDGE_Z;
const RISE = RIDGE_Y - EAVE_Y;
const PITCH = Math.atan2(RISE, RUN);
const SLOPE = Math.hypot(RISE, RUN);

function Gable({ x }: { x: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-RUN, 0);
    s.lineTo(RUN, 0);
    s.lineTo(0, RISE);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);
  return (
    <mesh
      name="garage-gable"
      geometry={geo}
      material={M.siding}
      position={[x, EAVE_Y, RIDGE_Z]}
      rotation={[0, Math.PI / 2, 0]}
    />
  );
}

function Roof() {
  const fixed = useFixed("roof-gutter");
  const rows = 14;
  const gap = { x1: 8.4, x2: 9.9, r1: 6, r2: 9 };
  return (
    <group name="garage-roof">
      {/* front slope, built in slope space: local -z runs up the roof */}
      <group position={[GCX, EAVE_Y, EAVE_Z]} rotation={[PITCH, 0, 0]}>
        <B p={[0, 0, -SLOPE / 2]} s={[GW + 0.5, 0.1, SLOPE]} m={M.underlay} />
        {Array.from({ length: rows }, (_, i) => {
          const d = 0.18 + i * (SLOPE / rows);
          const m = i % 2 ? M.shingle : M.shingleDark;
          const missing = !fixed && i >= gap.r1 && i <= gap.r2;
          if (!missing)
            return (
              <B
                key={i}
                p={[0, 0.07 + (i % 2) * 0.004, -d]}
                r={[-0.05, 0, 0]}
                s={[GW + 0.5, 0.035, SLOPE / rows + 0.08]}
                m={m}
              />
            );
          const left = gap.x1 - (GX1 - 0.25);
          const right = GX2 + 0.25 - gap.x2;
          return (
            <group key={i}>
              <B
                p={[-(GW + 0.5) / 2 + left / 2, 0.07, -d]}
                r={[-0.05, 0, 0]}
                s={[left, 0.035, SLOPE / rows + 0.08]}
                m={m}
              />
              <B
                p={[(GW + 0.5) / 2 - right / 2, 0.07, -d]}
                r={[-0.05, 0, 0]}
                s={[right, 0.035, SLOPE / rows + 0.08]}
                m={m}
              />
            </group>
          );
        })}
        {!fixed && (
          <group name="obj-lifted-shingles">
            <B
              p={[gap.x1 - GCX + 0.3, 0.16, -2.2]}
              r={[-0.45, 0.3, 0.1]}
              s={[0.6, 0.03, 0.32]}
              m={M.shingle}
            />
            <B
              p={[gap.x2 - GCX - 0.4, 0.12, -1.6]}
              r={[-0.3, -0.5, 0]}
              s={[0.55, 0.03, 0.3]}
              m={M.shingleDark}
            />
          </group>
        )}
      </group>
      {/* back slope */}
      <group position={[GCX, RIDGE_Y, RIDGE_Z]} rotation={[-PITCH, 0, 0]}>
        <B p={[0, 0.05, -SLOPE / 2 - 0.1]} s={[GW + 0.5, 0.14, SLOPE + 0.3]} m={M.shingleDark} />
      </group>
      <B
        name="roof-ridge-cap"
        p={[GCX, RIDGE_Y + 0.12, RIDGE_Z]}
        s={[GW + 0.55, 0.12, 0.3]}
        m={M.shingle}
      />
      <Gable x={GX2 + 0.01} />
      <B
        name="garage-fascia"
        p={[GCX, EAVE_Y - 0.08, EAVE_Z + 0.04]}
        s={[GW + 0.55, 0.22, 0.06]}
        m={M.trim}
      />
    </group>
  );
}

function Gutter() {
  const fixed = useFixed("roof-gutter");
  const leaves = useMemo(() => glow("#6b5a2c", 0), []);
  return (
    <group name="obj-gutter">
      <B p={[GCX, EAVE_Y - 0.12, EAVE_Z + 0.17]} s={[GW + 0.6, 0.14, 0.2]} m={M.gutter} />
      <B
        p={[GCX, EAVE_Y - 0.08, EAVE_Z + 0.17]}
        s={[GW + 0.5, 0.1, 0.14]}
        m={M.darkMetal}
        cast={false}
      />
      <B
        name="obj-downspout"
        p={[GX2 + 0.18, 1.45, EAVE_Z + 0.17]}
        s={[0.1, 2.9, 0.1]}
        m={M.gutter}
      />
      <B p={[GX2 + 0.28, 0.08, EAVE_Z + 0.17]} s={[0.3, 0.08, 0.14]} m={M.gutter} />
      {!fixed && (
        <group name="obj-gutter-overflow">
          {[10.4, 10.7, 11.0].map((x) => (
            <S key={x} p={[x, EAVE_Y - 0.02, EAVE_Z + 0.17]} radius={0.09} m={leaves} />
          ))}
          <Stream
            origin={[10.9, EAVE_Y - 0.04, EAVE_Z + 0.28]}
            dir={[0, 0.2, 0.35]}
            spread={0.12}
            count={36}
            life={0.78}
            material={M.water}
          />
          <C p={[10.9, 0.056, EAVE_Z + 0.6]} radius={0.5} h={0.006} m={M.puddle} cast={false} />
        </group>
      )}
    </group>
  );
}

function GarageBody() {
  const coach = useMemo(() => glow("#ffd9a0", 2), []);
  return (
    <group name="garage-body">
      <B p={[GCX, 1.49, -6]} s={[GW - 0.2, 2.98, 0.16]} m={M.siding} />
      <B p={[GX2, 1.505, -2]} s={[0.16, 3.01, 8.1]} m={M.siding} />
      <B p={[GX1 + 0.27, 1.5, 2]} s={[0.55, 3, 0.16]} m={M.sidingLight} />
      <B p={[GX2 - 0.27, 1.5, 2]} s={[0.55, 3, 0.16]} m={M.sidingLight} />
      <B p={[GCX, 2.7, 2]} s={[GW, 0.6, 0.16]} m={M.sidingLight} />
      <B p={[GCX, 0.02, -2]} s={[GW, 0.06, 8]} m={M.floorConcrete} cast={false} />
      {[GX1 + 0.27, GX2 - 0.27].map((x) => (
        <group key={x} position={[x, 2.05, 2.12]}>
          <B s={[0.14, 0.24, 0.1]} m={M.black} />
          <B p={[0, 0, 0.03]} s={[0.1, 0.18, 0.05]} m={coach} cast={false} />
        </group>
      ))}
    </group>
  );
}

function GarageDoor() {
  const fixed = useFixed("garage-door");
  const panels = [0, 1, 2, 3];
  return (
    <Hotspot id="garage-door">
      <group name="obj-garage-door" position={[GCX, 0, 2.02]}>
        {[-2.2, 2.2].map((x) => (
          <B
            key={x}
            p={[x, 1.2, -0.05]}
            s={[0.06, 2.4, 0.08]}
            m={M.darkMetal}
            name="obj-door-track"
          />
        ))}
        <group
          position={[0, fixed ? 0 : 0.18, 0]}
          rotation={[fixed ? 0 : -0.08, 0, fixed ? 0 : 0.1]}
        >
          {panels.map((i) => (
            <group key={i} position={[fixed ? 0 : (i - 1.5) * 0.02, 0.3 + i * 0.6, 0]}>
              <B s={[4.36, 0.58, 0.06]} m={M.white} />
              {[-1.6, -0.55, 0.55, 1.6].map((x) => (
                <B key={x} p={[x, 0, 0.035]} s={[0.9, 0.36, 0.01]} m={M.trim} cast={false} />
              ))}
            </group>
          ))}
        </group>
      </group>
      <B
        name="driveway"
        p={[GCX, 0.03, 3.1]}
        s={[GW, 0.06, 2.2]}
        m={M.floorConcrete}
        cast={false}
      />
    </Hotspot>
  );
}

const evShell = new THREE.MeshStandardMaterial({
  color: "#f3f4f5",
  roughness: 0.28,
  metalness: 0.02,
});
const evBack = new THREE.MeshStandardMaterial({ color: "#1a1c1f", roughness: 0.5 });
const evRubber = new THREE.MeshStandardMaterial({ color: "#16181b", roughness: 0.62 });
const evConduit = new THREE.MeshStandardMaterial({
  color: "#8e959c",
  roughness: 0.45,
  metalness: 0.35,
});

/**
 * Wall-mounted Level 2 charger, modelled on a modern unit: a soft white
 * rounded shell on a slightly larger black back plate with visible screws,
 * a status ring near the top, a holster on the right holding the
 * connector, and its cable coiled round a round hanger below. Broken: no
 * circuit run to it, the knockout at the bottom is capped, the ring glows
 * amber and "No circuit" blinks. Fixed: grey conduit runs from the fitting
 * down the siding to the ground with a strap clamp, and the ring glows teal.
 * Local +z faces out from the garage wall; local +x is the viewer's right.
 */
function EvCharger() {
  const fixed = useFixed("ev-charger");
  const ready = useMemo(() => glow("#3fe3d2", 2.6), []);
  const amber = useMemo(() => glow("#ff9340", 1.6), []);
  return (
    <Hotspot id="ev-charger">
      <group name="obj-ev-charger" position={[GX2 + 0.1, 1.3, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        {/* back plate and screws */}
        <RoundedBox
          args={[0.34, 0.56, 0.03]}
          radius={0.012}
          smoothness={2}
          position={[0, 0, -0.005]}
          material={evBack}
        />
        {[
          [-0.155, 0.22],
          [-0.155, -0.22],
          [0.155, 0.22],
          [0.155, -0.22],
        ].map(([x, y], i) => (
          <C
            key={i}
            p={[x!, y!, 0.012]}
            r={[Math.PI / 2, 0, 0]}
            radius={0.007}
            h={0.006}
            m={M.darkMetal}
          />
        ))}
        {/* white shell */}
        <RoundedBox
          args={[0.3, 0.52, 0.075]}
          radius={0.034}
          smoothness={4}
          position={[-0.012, 0.004, 0.045]}
          material={evShell}
          castShadow
        />
        {/* status ring */}
        <mesh position={[0.004, 0.155, 0.0835]} material={fixed ? ready : amber}>
          <ringGeometry args={[0.047, 0.058, 40]} />
        </mesh>
        {/* conduit fitting at the bottom */}
        <C p={[0, -0.275, 0.035]} radius={0.024} h={0.04} m={evConduit} />
        <C p={[0, -0.3, 0.035]} radius={0.02} h={0.02} m={evConduit} />
        {/* holster with the connector handle hanging in it */}
        <group name="obj-charger-holster" position={[0.2, 0.06, 0.03]}>
          <B p={[0, 0.0, 0]} s={[0.075, 0.13, 0.05]} m={evBack} />
          <B p={[0, 0.05, 0.035]} s={[0.07, 0.03, 0.03]} m={evBack} />
          <group position={[0.012, 0.03, 0.06]} rotation={[0.12, 0, -0.18]}>
            <mesh material={evRubber} position={[0, -0.07, 0]} castShadow>
              <capsuleGeometry args={[0.024, 0.13, 6, 12]} />
            </mesh>
            {/* ridged strain relief where the cable leaves the handle */}
            {[0, 1, 2, 3].map((i) => (
              <mesh
                key={i}
                material={evRubber}
                position={[0, -0.17 - i * 0.018, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <torusGeometry args={[0.017 - i * 0.001, 0.005, 6, 14]} />
              </mesh>
            ))}
          </group>
        </group>
        {/* cable coiled round a round hanger */}
        <mesh material={evRubber} position={[0.215, -0.235, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 28]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            material={evRubber}
            position={[0.215 + i * 0.006, -0.25 - i * 0.012, 0.03 + i * 0.008]}
            scale={[0.82, 1, 1]}
            castShadow
          >
            <torusGeometry args={[0.12, 0.013, 8, 36]} />
          </mesh>
        ))}
        <Pipe a={[0.2, -0.12, 0.09]} b={[0.19, -0.14, 0.07]} radius={0.013} m={evRubber} />
        {fixed ? (
          <group name="obj-conduit-run">
            <Pipe a={[0, -0.31, 0.035]} b={[0, -1.3, 0.035]} radius={0.017} m={evConduit} />
            {/* strap clamp holding the conduit to the siding */}
            <B p={[0, -0.62, 0.035]} s={[0.05, 0.022, 0.045]} m={evConduit} />
            <B p={[0, -0.62, 0.012]} s={[0.1, 0.022, 0.008]} m={evConduit} />
            {[-0.04, 0.04].map((x) => (
              <C
                key={x}
                p={[x, -0.62, 0.018]}
                r={[Math.PI / 2, 0, 0]}
                radius={0.006}
                h={0.006}
                m={M.darkMetal}
              />
            ))}
          </group>
        ) : (
          <>
            {/* knockout capped: nothing wired in yet */}
            <C p={[0, -0.315, 0.035]} radius={0.021} h={0.008} m={evBack} />
            <Blink period={1.6}>
              <Label p={[0, -0.42, 0.08]} size={0.05} color="#ff9340">
                No circuit
              </Label>
            </Blink>
          </>
        )}
      </group>
    </Hotspot>
  );
}

function PorchStatic() {
  const lamp = useMemo(() => glow("#ffd9a0", 2), []);
  return (
    <group name="front-porch-static">
      <B name="porch-deck" p={[1.1, 0.13, 2.75]} s={[3.2, 0.26, 1.3]} m={M.woodRaw} />
      {Array.from({ length: 8 }, (_, i) => (
        <B
          key={i}
          p={[1.1, 0.265, 2.18 + i * 0.16]}
          s={[3.2, 0.01, 0.02]}
          m={M.floorWoodDark}
          cast={false}
        />
      ))}
      <B p={[1.1, 0.08, 3.55]} s={[1.2, 0.16, 0.35]} m={M.woodRaw} />
      <B name="walkway" p={[1.1, 0.03, 4.0]} s={[1.1, 0.06, 0.8]} m={M.sidewalk} cast={false} />
      {[-0.45, 2.65].map((x) => (
        <group key={x} name="porch-rail">
          <C p={[x, 0.75, 3.35]} radius={0.05} h={1.0} m={M.trim} seg={8} />
          <B p={[x, 1.22, 2.75]} s={[0.08, 0.06, 1.3]} m={M.trim} />
          {[2.35, 2.65, 2.95].map((z) => (
            <B key={z} p={[x, 0.75, z]} s={[0.04, 0.9, 0.04]} m={M.trim} />
          ))}
        </group>
      ))}
      <B name="porch-light" p={[0.35, 1.9, 2.1]} s={[0.1, 0.2, 0.1]} m={lamp} cast={false} />
      <group name="obj-mailbox" position={[-1.6, 0, 3.9]}>
        <C p={[0, 0.5, 0]} radius={0.04} h={1} m={M.woodRaw} seg={6} />
        <B p={[0, 1.08, 0]} s={[0.22, 0.24, 0.46]} m={M.navy} />
      </group>
    </group>
  );
}

function Porch() {
  const fixed = useFixed("front-door");
  const red = useMemo(() => glow("#ff3b2f", 3), []);
  const blue = useMemo(() => glow("#58c4ff", 2.4), []);
  const door = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1d3a57", roughness: 0.45 }),
    [],
  );
  return (
    <group name="front-porch">
      <Hotspot id="front-door">
        <group name="obj-front-door" position={[1.1, 1.15, 2.02]}>
          <B s={[0.98, 2.28, 0.06]} m={door} />
          {[-0.2, 0.3].map((y) => (
            <B key={y} p={[0, y, 0.035]} s={[0.7, 0.62, 0.01]} m={door} />
          ))}
          {fixed ? (
            <group name="obj-smart-lock" position={[0.36, 0, 0.05]}>
              <B s={[0.1, 0.24, 0.03]} m={M.black} />
              <B p={[0, 0.03, 0.017]} s={[0.07, 0.11, 0.004]} m={blue} cast={false} />
            </group>
          ) : (
            <S p={[0.36, 0, 0.06]} radius={0.04} m={M.chrome} />
          )}
        </group>
        <group name="obj-video-doorbell" position={[1.82, 1.25, 2.1]}>
          <B s={[0.08, 0.2, 0.04]} m={M.black} />
          <mesh position={[0, -0.05, 0.022]} material={fixed ? blue : M.darkMetal}>
            <ringGeometry args={[0.022, 0.03, 24]} />
          </mesh>
          {!fixed && (
            <Blink period={1.4} duty={0.3}>
              <S p={[0, 0.06, 0.024]} radius={0.01} m={red} />
            </Blink>
          )}
        </group>
        {!fixed && (
          <B
            name="obj-lock-box"
            p={[1.9, 0.33, 2.9]}
            r={[0, 0.4, 0]}
            s={[0.3, 0.14, 0.22]}
            m={M.white}
          />
        )}
        {fixed && (
          <group name="obj-porch-camera" position={[0.3, 2.45, 2.12]}>
            <B s={[0.12, 0.08, 0.12]} m={M.white} />
            <S p={[0, -0.02, 0.07]} radius={0.03} m={M.black} />
          </group>
        )}
      </Hotspot>
    </group>
  );
}

/** Fence section along local +x with instanced pickets. */
function FenceSection({ length, name = "fence-section" }: { length: number; name?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = Math.max(2, Math.round(length / 0.16));
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      o.position.set((i + 0.5) * (length / n), 0.8, 0);
      o.updateMatrix();
      ref.current!.setMatrixAt(i, o.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [n, length]);
  return (
    <group name={name}>
      <instancedMesh ref={ref} args={[undefined, undefined, n]} material={M.fence} castShadow>
        <boxGeometry args={[0.12, 1.6, 0.03]} />
      </instancedMesh>
      <B p={[length / 2, 0.45, -0.04]} s={[length, 0.08, 0.05]} m={M.floorWoodDark} />
      <B p={[length / 2, 1.3, -0.04]} s={[length, 0.08, 0.05]} m={M.floorWoodDark} />
      <B p={[0, 0.9, -0.05]} s={[0.12, 1.8, 0.12]} m={M.floorWoodDark} />
      <B p={[length, 0.9, -0.05]} s={[0.12, 1.8, 0.12]} m={M.floorWoodDark} />
    </group>
  );
}

function FenceStatic() {
  return (
    <group name="yard-fence-static">
      <group position={[-11.5, 0, -7]} rotation={[0, -Math.PI / 2, 0]}>
        <FenceSection length={7} name="fence-left" />
      </group>
      <group position={[-11.5, 0, -7]}>
        <FenceSection length={24} name="fence-back" />
      </group>
      <group position={[12.5, 0, -7]} rotation={[0, -Math.PI / 2, 0]}>
        <FenceSection length={6} name="fence-right" />
      </group>
    </group>
  );
}

function Fence() {
  const fixed = useFixed("fence-gate");
  return (
    <group name="yard-fence">
      <Hotspot id="fence-gate">
        <group position={[-11.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <group rotation={[fixed ? 0 : -0.28, 0, 0]}>
            <FenceSection length={2} name="obj-leaning-panel" />
          </group>
        </group>
        <group
          name="obj-gate"
          position={[-11.5, fixed ? 0.05 : -0.08, 2.05]}
          rotation={[0, -Math.PI / 2 + (fixed ? 0 : 0.12), fixed ? 0 : -0.07]}
        >
          <FenceSection length={1.4} />
          <B p={[1.25, 1.0, 0.05]} s={[0.12, 0.05, 0.05]} m={M.darkMetal} name="obj-gate-latch" />
        </group>
        {!fixed && (
          <B name="obj-rotted-post" p={[-11.55, 0.12, 0.0]} s={[0.16, 0.24, 0.16]} m={M.rust} />
        )}
      </Hotspot>
    </group>
  );
}

const acBody = new THREE.MeshStandardMaterial({
  color: "#c7cbc9",
  roughness: 0.45,
  metalness: 0.35,
});
const acTrim = new THREE.MeshStandardMaterial({ color: "#7d8387", roughness: 0.5, metalness: 0.5 });
const acFins = new THREE.MeshStandardMaterial({ color: "#3a3f45", roughness: 0.6, metalness: 0.6 });
const acShadow = new THREE.MeshStandardMaterial({ color: "#121417", roughness: 1 });
const warmAir = new THREE.MeshBasicMaterial({
  color: "#fff4e0",
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
});
const leafMat = new THREE.MeshStandardMaterial({ color: "#7a5a2a", roughness: 1 });

/** One louvred side of the outdoor unit: dark coil behind horizontal guard slats. */
function AcSide({ rot }: { rot: number }) {
  return (
    <group rotation={[0, rot, 0]}>
      <B p={[0, 0.5, 0.436]} s={[0.76, 0.66, 0.01]} m={acFins} cast={false} />
      {Array.from({ length: 12 }, (_, i) => (
        <B
          key={i}
          p={[0, 0.2 + i * 0.056, 0.452]}
          s={[0.76, 0.014, 0.022]}
          m={acBody}
          cast={false}
        />
      ))}
    </group>
  );
}

/**
 * Outdoor AC condenser in the side yard. Broken: fan stopped, service
 * panel off and leaning on the unit with a swollen capacitor showing.
 * Fixed: panel back on, fan spinning, warm air rising off the top.
 */
function Condenser() {
  const fixed = useFixed("condenser");
  return (
    <Hotspot id="condenser">
      <group name="obj-ac-condenser" position={[-10.25, 0, -4.2]}>
        <B name="obj-ac-pad" p={[0, 0.05, 0]} s={[1.15, 0.1, 1.15]} m={M.floorConcrete} />
        <B p={[0, 0.12, -0.3]} s={[0.92, 0.04, 0.08]} m={acTrim} />
        <B p={[0, 0.12, 0.3]} s={[0.92, 0.04, 0.08]} m={acTrim} />
        {/* cabinet: corner posts, louvred sides, top frame */}
        {[
          [-0.44, -0.44],
          [0.44, -0.44],
          [-0.44, 0.44],
          [0.44, 0.44],
        ].map(([x, z], i) => (
          <B key={i} p={[x!, 0.52, z!]} s={[0.07, 0.8, 0.07]} m={acTrim} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <AcSide key={i} rot={(i * Math.PI) / 2} />
        ))}
        <B p={[0, 0.15, 0]} s={[0.9, 0.06, 0.9]} m={acBody} />
        <B p={[0, 0.915, 0.39]} s={[0.94, 0.035, 0.16]} m={acBody} />
        <B p={[0, 0.915, -0.39]} s={[0.94, 0.035, 0.16]} m={acBody} />
        <B p={[0.39, 0.915, 0]} s={[0.16, 0.035, 0.94]} m={acBody} />
        <B p={[-0.39, 0.915, 0]} s={[0.16, 0.035, 0.94]} m={acBody} />
        <C p={[0, 0.7, 0]} radius={0.36} h={0.02} m={acShadow} cast={false} />
        {/* fan shroud, blades and wire guard */}
        <mesh position={[0, 0.93, 0]} rotation={[Math.PI / 2, 0, 0]} material={acTrim}>
          <torusGeometry args={[0.35, 0.025, 8, 40]} />
        </mesh>
        <Spin speed={fixed ? 16 : 0} position={[0, 0.88, 0]}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
              <B p={[0.17, 0, 0]} r={[0.35, 0, 0]} s={[0.3, 0.01, 0.13]} m={M.black} />
            </group>
          ))}
          <C radius={0.06} h={0.08} m={M.darkMetal} />
        </Spin>
        {[0.12, 0.22, 0.32].map((r) => (
          <mesh
            key={r}
            position={[0, 0.955, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            material={M.darkMetal}
          >
            <torusGeometry args={[r, 0.006, 4, 32]} />
          </mesh>
        ))}
        {[0, 1, 2, 3].map((i) => (
          <B
            key={i}
            p={[0, 0.955, 0]}
            r={[0, (i * Math.PI) / 4, 0]}
            s={[0.7, 0.01, 0.012]}
            m={M.darkMetal}
            cast={false}
          />
        ))}
        <C p={[0, 0.96, 0]} radius={0.05} h={0.03} m={M.steel} />
        {/* nameplate */}
        <B p={[-0.2, 0.84, 0.47]} s={[0.26, 0.07, 0.006]} m={M.white} cast={false} />
        <B p={[-0.2, 0.815, 0.474]} s={[0.26, 0.015, 0.004]} m={M.orange} cast={false} />
        {/* service corner */}
        {fixed ? (
          // Stands proud of the louvres and clear of the corner post so no face is shared.
          <B
            name="obj-ac-service-panel"
            p={[0.28, 0.55, 0.482]}
            s={[0.23, 0.5, 0.018]}
            m={acBody}
          />
        ) : (
          <group name="obj-ac-open-service-bay">
            <B p={[0.3, 0.55, 0.43]} s={[0.24, 0.46, 0.04]} m={acShadow} cast={false} />
            <C
              name="obj-swollen-capacitor"
              p={[0.26, 0.5, 0.43]}
              radius={0.045}
              h={0.16}
              m={M.steel}
            />
            <S p={[0.26, 0.59, 0.43]} radius={0.05} s={[0.05, 0.03, 0.05]} m={M.steel} />
            <B name="obj-contactor" p={[0.36, 0.62, 0.43]} s={[0.07, 0.09, 0.05]} m={M.black} />
            <B
              p={[0.72, 0.28, 0.35]}
              r={[0, 0.5, -0.3]}
              s={[0.26, 0.5, 0.02]}
              m={acBody}
              name="obj-ac-panel-removed"
            />
            {[
              [-0.1, 0.12],
              [0.15, -0.2],
              [-0.25, -0.05],
            ].map(([x, z], i) => (
              <S key={i} p={[x!, 0.965, z!]} radius={0.04} s={[0.06, 0.012, 0.035]} m={leafMat} />
            ))}
          </group>
        )}
        {/* line set into the house, insulated suction line and copper liquid line */}
        <B p={[0.47, 0.32, -0.25]} s={[0.04, 0.1, 0.12]} m={M.copper} name="obj-service-valves" />
        <Pipe a={[0.49, 0.34, -0.22]} b={[0.96, 0.34, -0.22]} radius={0.032} m={M.black} />
        <Pipe a={[0.49, 0.29, -0.3]} b={[0.96, 0.29, -0.3]} radius={0.012} m={M.copper} />
        <B name="obj-lineset-cover" p={[1.02, 0.78, -0.26]} s={[0.1, 1.0, 0.14]} m={M.white} />
        <Pipe a={[0.96, 0.34, -0.22]} b={[1.0, 0.34, -0.22]} radius={0.032} m={M.black} />
        {/* disconnect box and whip */}
        <B name="obj-ac-disconnect" p={[1.05, 1.15, 0.28]} s={[0.06, 0.32, 0.22]} m={acTrim} />
        <Pipe a={[1.02, 1.0, 0.28]} b={[0.8, 0.45, 0.3]} radius={0.016} m={M.darkMetal} />
        <Pipe a={[0.8, 0.45, 0.3]} b={[0.46, 0.45, 0.2]} radius={0.016} m={M.darkMetal} />
        {fixed ? (
          <Stream
            origin={[0, 1.0, 0]}
            dir={[0, 0.5, 0]}
            spread={0.45}
            count={16}
            size={0.05}
            life={2.2}
            gravity={-0.12}
            material={warmAir}
          />
        ) : (
          <Blink period={2}>
            <Label p={[0, 1.35, 0]} size={0.1} color="#ff9340" outline="#1b1208">
              Not running
            </Label>
          </Blink>
        )}
      </group>
    </Hotspot>
  );
}

export function Exterior() {
  return (
    <group name="house-exterior">
      <StaticBatch name="exterior-static">
        <GarageBody />
        <PorchStatic />
        <FenceStatic />
      </StaticBatch>
      <Roof />
      <Gutter />
      <GarageDoor />
      <EvCharger />
      <Porch />
      <Fence />
      <Condenser />
    </group>
  );
}
