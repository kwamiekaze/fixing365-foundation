import { StaticBatch } from "../../world/StaticBatch";
import { useMemo } from "react";
import { B, C, M, S, Pipe, glow } from "../../world/kit";
import { Blink, Stream, Drip } from "../../world/fx";
import { Hotspot } from "../../world/Hotspot";
import { PottedPlant } from "../../world/Plants";
import { Label } from "../../world/Label";
import { useFixed } from "../../world/store";

const CAB_Z = -5.6;

function BaseCabinets() {
  return (
    <group name="kitchen-base-cabinets">
      {/* left run, sink bay, right run with dishwasher and range */}
      <B p={[-8.35, 0.45, CAB_Z]} s={[1.1, 0.9, 0.62]} m={M.cabinet} />
      <B p={[-6.3, 0.45, CAB_Z]} s={[0.62, 0.9, 0.62]} m={M.steel} name="obj-dishwasher" />
      <B p={[-6.3, 0.82, CAB_Z + 0.32]} s={[0.5, 0.04, 0.02]} m={M.darkMetal} />
      <B p={[-4.55, 0.45, CAB_Z]} s={[0.9, 0.9, 0.62]} m={M.cabinet} />
      {[-8.62, -8.08, -4.78, -4.32].map((x) => (
        <B key={x} p={[x, 0.72, CAB_Z + 0.32]} s={[0.18, 0.025, 0.03]} m={M.steel} />
      ))}
      {/* countertop with sink cutout faked by separate pieces */}
      <B p={[-8.3, 0.93, CAB_Z + 0.02]} s={[1.2, 0.05, 0.68]} m={M.counter} />
      {/* right run split around the range so the cooktop is never buried in the counter */}
      <B p={[-5.84, 0.93, CAB_Z + 0.02]} s={[0.32, 0.05, 0.68]} m={M.counter} />
      <B p={[-4.51, 0.93, CAB_Z + 0.02]} s={[0.82, 0.05, 0.68]} m={M.counter} />
      <B p={[-7.2, 0.93, CAB_Z - 0.26]} s={[0.9, 0.05, 0.16]} m={M.counter} />
      <B p={[-7.2, 0.93, CAB_Z + 0.3]} s={[0.9, 0.05, 0.08]} m={M.counter} />
      {/* backsplash */}
      <B p={[-6.5, 1.2, -5.9]} s={[4.8, 0.5, 0.02]} m={M.porcelain} cast={false} />
      {/* range */}
      <group name="obj-range" position={[-5.3, 0, CAB_Z]}>
        <B p={[0, 0.45, 0]} s={[0.76, 0.9, 0.64]} m={M.steel} />
        <B p={[0, 0.93, 0]} s={[0.74, 0.03, 0.6]} m={M.black} />
        <B p={[0, 0.5, 0.325]} s={[0.56, 0.36, 0.01]} m={M.screen} />
        {(
          [
            [-0.18, -0.13],
            [0.18, -0.13],
            [-0.18, 0.14],
            [0.18, 0.14],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <C key={i} p={[x, 0.951, z]} radius={0.09} h={0.008} m={M.darkMetal} />
        ))}
      </group>
      {/* upper cabinets and hood */}
      <B p={[-8.42, 2.2, -5.75]} s={[1.0, 0.8, 0.36]} m={M.cabinetLight} />
      <B p={[-6.0, 2.2, -5.75]} s={[1.0, 0.8, 0.36]} m={M.cabinetLight} />
      <B p={[-4.45, 2.2, -5.75]} s={[0.7, 0.8, 0.36]} m={M.cabinetLight} />
      <B p={[-5.3, 1.95, -5.7]} s={[0.8, 0.3, 0.46]} m={M.steel} name="obj-range-hood" />
      <B p={[-5.3, 2.45, -5.8]} s={[0.3, 0.7, 0.26]} m={M.steel} />
    </group>
  );
}

function SinkLeak() {
  const fixed = useFixed("kitchen-pipe");
  return (
    <Hotspot id="kitchen-pipe">
      <group name="obj-kitchen-sink" position={[-7.2, 0, CAB_Z]}>
        {/* open sink cabinet */}
        <B p={[0, 0.45, -0.28]} s={[0.9, 0.9, 0.04]} m={M.cabinetLight} />
        <B p={[-0.44, 0.45, 0]} s={[0.03, 0.9, 0.6]} m={M.cabinet} />
        <B p={[0.44, 0.45, 0]} s={[0.03, 0.9, 0.6]} m={M.cabinet} />
        <B p={[0, 0.06, 0]} s={[0.86, 0.04, 0.58]} m={fixed ? M.cabinetLight : M.woodRaw} />
        <B p={[-0.62, 0.45, 0.55]} r={[0, -1.25, 0]} s={[0.44, 0.84, 0.03]} m={M.cabinet} />
        <B p={[0.62, 0.45, 0.55]} r={[0, 1.25, 0]} s={[0.44, 0.84, 0.03]} m={M.cabinet} />
        {/* basin and faucet */}
        <B p={[0, 0.84, 0.02]} s={[0.72, 0.18, 0.46]} m={M.steel} />
        <B p={[0, 0.915, 0.02]} s={[0.66, 0.02, 0.4]} m={M.darkMetal} />
        {/* Pull-down gooseneck faucet: deck plate, column, arched neck, spray head, side lever */}
        <group name="obj-faucet" position={[0, 0.955, -0.21]}>
          <C p={[0, 0.006, 0]} radius={0.04} h={0.012} m={M.chrome} />
          <C p={[0, 0.14, 0]} radius={0.017} top={0.015} h={0.27} m={M.chrome} />
          <mesh
            material={M.chrome}
            position={[0, 0.275, 0.085]}
            rotation={[0, Math.PI / 2, 0]}
            castShadow
          >
            <torusGeometry args={[0.085, 0.015, 12, 28, Math.PI]} />
          </mesh>
          <C p={[0, 0.235, 0.17]} radius={0.019} top={0.017} h={0.08} m={M.chrome} />
          <C p={[0, 0.193, 0.17]} radius={0.014} h={0.006} m={M.darkMetal} />
          <group position={[0.028, 0.1, 0]} rotation={[0, 0, -0.35]}>
            <C p={[0.035, 0, 0]} r={[0, 0, Math.PI / 2]} radius={0.007} h={0.07} m={M.chrome} />
            <C radius={0.013} h={0.03} m={M.chrome} />
          </group>
        </group>
        <C name="obj-soap-pump" p={[0.2, 0.99, -0.22]} radius={0.016} h={0.07} m={M.chrome} />
        {/* drain and P-trap */}
        <C p={[0, 0.66, 0.02]} radius={0.035} h={0.2} m={M.pvc} />
        <Pipe a={[0, 0.56, 0.02]} b={[0, 0.46, 0.08]} radius={0.035} m={M.pvc} />
        <Pipe a={[0, 0.46, 0.08]} b={[0, 0.46, -0.24]} radius={0.035} m={M.pvc} />
        {/* supply lines with shutoff valves */}
        <Pipe a={[-0.25, 0.3, -0.26]} b={[-0.25, 0.3, -0.14]} radius={0.018} m={M.copper} />
        <B p={[-0.25, 0.3, -0.12]} s={[0.07, 0.07, 0.05]} m={M.chrome} name="obj-shutoff-valve" />
        <Pipe a={[-0.25, 0.3, -0.1]} b={[-0.2, 0.74, -0.05]} radius={0.012} m={M.chrome} />
        <Pipe a={[0.25, 0.3, -0.26]} b={[0.25, 0.3, -0.14]} radius={0.018} m={M.copper} />
        <B p={[0.25, 0.3, -0.12]} s={[0.07, 0.07, 0.05]} m={M.chrome} />
        <Pipe
          a={[0.25, 0.3, -0.1]}
          b={[0.2, 0.74, -0.05]}
          radius={0.012}
          m={fixed ? M.chrome : M.darkMetal}
        />
        {fixed ? (
          <C
            p={[0.22, 0.52, -0.075]}
            radius={0.022}
            h={0.1}
            r={[0.1, 0, -0.1]}
            m={M.chrome}
            name="obj-new-coupling"
          />
        ) : (
          <group name="obj-burst-supply-line">
            <S p={[0.22, 0.5, -0.07]} radius={0.028} m={M.rust} />
            <Stream
              origin={[0.22, 0.5, -0.05]}
              dir={[0.25, 0.9, 1.9]}
              spread={0.9}
              count={46}
              life={0.55}
              material={M.water}
            />
            <Drip from={[0.1, 0.9, 0.26]} fall={0.8} period={1.1} material={M.water} />
          </group>
        )}
      </group>
      {!fixed && (
        <group name="obj-kitchen-puddle">
          <C p={[-7.05, 0.056, -4.55]} radius={0.95} h={0.006} seg={28} m={M.puddle} cast={false} />
          <C p={[-6.4, 0.056, -4.1]} radius={0.45} h={0.006} seg={20} m={M.puddle} cast={false} />
        </group>
      )}
    </Hotspot>
  );
}

function Fridge() {
  const fixed = useFixed("fridge");
  const red = useMemo(() => glow("#ff4d3d", 2.2), []);
  const blue = useMemo(() => glow("#6fd3ff", 2), []);
  return (
    <Hotspot id="fridge">
      <group name="obj-refrigerator" position={[-8.55, 0, -1.8]}>
        <B p={[0, 0.96, 0]} s={[0.8, 1.92, 0.96]} m={M.steel} />
        <B p={[0.41, 1.35, 0]} s={[0.01, 1.1, 0.94]} m={M.chrome} />
        <B p={[0.41, 0.42, 0]} s={[0.01, 0.7, 0.94]} m={M.chrome} />
        <B p={[0.44, 1.35, -0.05]} s={[0.04, 0.5, 0.03]} m={M.darkMetal} />
        <B p={[0.44, 0.55, -0.05]} s={[0.04, 0.3, 0.03]} m={M.darkMetal} />
        <B p={[0.42, 1.5, 0.28]} s={[0.01, 0.2, 0.24]} m={M.screen} />
        <group rotation={[0, Math.PI / 2, 0]} position={[0.43, 1.5, 0.28]}>
          {fixed ? (
            <Label size={0.07} color="#6fd3ff">
              37°F
            </Label>
          ) : (
            <>
              <Label size={0.07} color="#ff5a46">
                52°F
              </Label>
              <Blink period={0.9}>
                <Label p={[0, -0.06, 0]} size={0.035} color="#ff5a46">
                  ERR
                </Label>
              </Blink>
            </>
          )}
        </group>
        <B p={[0.425, 1.62, 0.28]} s={[0.005, 0.02, 0.2]} m={fixed ? blue : red} cast={false} />
        {!fixed && (
          <B
            name="obj-fridge-frost"
            p={[0.42, 1.8, -0.3]}
            s={[0.012, 0.18, 0.26]}
            m={M.suds}
            cast={false}
          />
        )}
      </group>
    </Hotspot>
  );
}

function Island() {
  const pendant = useMemo(() => glow("#ffd9a0", 2.5), []);
  return (
    <group name="kitchen-island" position={[-6.3, 0, -2.4]}>
      <B p={[0, 0.45, 0]} s={[1.9, 0.9, 0.9]} m={M.cabinet} />
      <B p={[0, 0.93, 0]} s={[2.1, 0.05, 1.05]} m={M.counter} />
      {[-0.55, 0.55].map((x) => (
        <group key={x}>
          <C p={[x, 0.35, 0.8]} radius={0.03} h={0.7} m={M.darkMetal} seg={8} />
          <C p={[x, 0.72, 0.8]} radius={0.2} h={0.05} m={M.woodLight} />
          <C p={[x, 2.4, 0]} radius={0.008} h={1.4} m={M.black} seg={6} cast={false} />
          <C p={[x, 1.65, 0]} radius={0.16} top={0.05} h={0.18} m={M.black} />
          <S p={[x, 1.55, 0]} radius={0.05} m={pendant} />
        </group>
      ))}
      <S p={[0.2, 1.0, -0.1]} radius={0.12} m={M.orange} s={[0.18, 0.06, 0.18]} />
      <S p={[0.15, 1.05, -0.08]} radius={0.05} m={M.plant} />
      <S p={[0.27, 1.04, -0.12]} radius={0.045} m={M.orange} />
    </group>
  );
}

export function Kitchen() {
  return (
    <group name="room-kitchen">
      <StaticBatch name="kitchen-static">
        <BaseCabinets />
      </StaticBatch>
      <SinkLeak />
      <Fridge />
      <Island />
      <PottedPlant p={[-7.62, 1.3, -5.86]} kind="herb" pot="terracotta" scale={1.25} seed={3} />
    </group>
  );
}
