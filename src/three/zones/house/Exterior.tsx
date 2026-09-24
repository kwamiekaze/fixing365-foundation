import { StaticBatch } from "../../world/StaticBatch";
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
      <B p={[GCX, 1.5, -6]} s={[GW, 3, 0.16]} m={M.siding} />
      <B p={[GX2, 1.5, -2]} s={[0.16, 3, 8]} m={M.siding} />
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
        {!fixed && (
          <B
            name="obj-loose-roller"
            p={[1.9, 0.08, 0.5]}
            r={[Math.PI / 2, 0, 0.4]}
            s={[0.12, 0.05, 0.12]}
            m={M.darkMetal}
          />
        )}
      </group>
      <B
        name="driveway"
        p={[GCX, 0.03, 3.1]}
        s={[GW, 0.06, 2.2]}
        m={M.floorConcrete}
        cast={false}
      />
      <B
        name="obj-driveway-crack"
        p={[8.2, 0.065, 3.1]}
        r={[0, 0.5, 0]}
        s={[1.4, 0.005, 0.03]}
        m={M.black}
        cast={false}
      />
    </Hotspot>
  );
}

function EvCharger() {
  const fixed = useFixed("ev-charger");
  const ring = useMemo(() => glow("#3ddc84", 2.4), []);
  const off = useMemo(() => glow("#ff9340", 1.2), []);
  return (
    <Hotspot id="ev-charger">
      <group name="obj-ev-charger" position={[GX2 + 0.1, 1.3, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <B s={[0.36, 0.52, 0.12]} m={M.white} />
        <mesh position={[0, 0.08, 0.062]} material={fixed ? ring : off}>
          <ringGeometry args={[0.07, 0.09, 32]} />
        </mesh>
        <B p={[0.26, -0.1, 0.06]} s={[0.1, 0.16, 0.12]} m={M.black} name="obj-charger-holster" />
        <mesh position={[0.28, -0.42, 0.14]} rotation={[Math.PI / 2, 0, 0]} material={M.black}>
          <torusGeometry args={[0.16, 0.02, 6, 20]} />
        </mesh>
        {fixed ? (
          <Pipe
            a={[0, -0.26, 0]}
            b={[0, -1.2, 0]}
            radius={0.025}
            m={M.steel}
            name="obj-conduit-run"
          />
        ) : (
          <Blink period={1.6}>
            <Label p={[0, -0.36, 0.08]} size={0.05} color="#ff9340">
              No circuit
            </Label>
          </Blink>
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
      {[-2.2, -3.6, -5.0, -6.4, -7.8, 3.2, 4.4, 5.4].map((x, i) => (
        <S
          key={x}
          p={[x, 0.35, 2.55]}
          radius={0.4}
          s={[0.42 + (i % 2) * 0.1, 0.36, 0.36]}
          m={i % 3 ? M.plant : M.grass}
        />
      ))}
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

function Condenser() {
  const fixed = useFixed("condenser");
  return (
    <Hotspot id="condenser">
      <group name="obj-ac-condenser" position={[-10.25, 0, -4.2]}>
        <B p={[0, 0.05, 0]} s={[1.1, 0.1, 1.1]} m={M.floorConcrete} />
        <B p={[0, 0.5, 0]} s={[0.86, 0.8, 0.86]} m={M.sidingLight} />
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
            <B p={[0, 0.48, 0.435]} s={[0.76, 0.62, 0.01]} m={M.darkMetal} cast={false} />
          </group>
        ))}
        <C p={[0, 0.91, 0]} radius={0.36} h={0.02} m={M.darkMetal} />
        <Spin speed={fixed ? 14 : 0} position={[0, 0.93, 0]}>
          {[0, 1, 2].map((i) => (
            <B
              key={i}
              r={[0, (i * Math.PI * 2) / 3, 0.25]}
              p={[0, 0, 0]}
              s={[0.62, 0.012, 0.12]}
              m={M.black}
            />
          ))}
        </Spin>
        <C p={[0, 0.94, 0]} radius={0.06} h={0.04} m={M.steel} />
        <Pipe a={[0.43, 0.3, -0.2]} b={[1.1, 0.3, -0.2]} radius={0.03} m={M.black} />
        <Pipe a={[0.43, 0.22, -0.3]} b={[1.1, 0.22, -0.3]} radius={0.018} m={M.copper} />
        <B name="obj-ac-disconnect" p={[1.08, 1.1, 0.3]} s={[0.06, 0.3, 0.22]} m={M.sidingLight} />
        {!fixed && (
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
