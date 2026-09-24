import { StaticBatch } from "../../world/StaticBatch";
import { useMemo } from "react";
import * as THREE from "three";
import { B, C, M, S, Pipe, glow } from "../../world/kit";
import { Blink, Drip } from "../../world/fx";
import { Hotspot } from "../../world/Hotspot";
import { Label } from "../../world/Label";
import { useFixed } from "../../world/store";

const showerGlass = new THREE.MeshStandardMaterial({
  color: "#d6eef2",
  roughness: 0.04,
  metalness: 0.15,
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
  envMapIntensity: 1.6,
});
const glassEdge = new THREE.MeshStandardMaterial({
  color: "#9fd3c7",
  roughness: 0.1,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
});

/** Frameless glass bath screen: fixed panel at the tap end, hinged door swung slightly open. */
function ShowerScreen() {
  const H = 1.74;
  const y = 0.57 + H / 2;
  return (
    <group name="obj-glass-shower-door" position={[5.0, 0, -5.1]}>
      <B p={[0.44, y, -0.01]} s={[0.9, H, 0.01]} m={showerGlass} cast={false} />
      <B p={[0.44, 0.57 + H, -0.01]} s={[0.9, 0.012, 0.014]} m={glassEdge} cast={false} />
      <B p={[-0.005, y, -0.01]} s={[0.012, H, 0.014]} m={glassEdge} cast={false} />
      <B p={[0.88, y, -0.01]} s={[0.03, H, 0.04]} m={M.chrome} name="obj-screen-wall-profile" />
      <B p={[0.44, 0.585, -0.01]} s={[0.9, 0.025, 0.03]} m={M.chrome} />
      <group position={[-0.02, 0, -0.01]} rotation={[0, 0.55, 0]} name="obj-shower-door-leaf">
        <B p={[-0.38, y, 0]} s={[0.76, H, 0.01]} m={showerGlass} cast={false} />
        <B p={[-0.38, 0.57 + H, 0]} s={[0.76, 0.012, 0.014]} m={glassEdge} cast={false} />
        <B p={[-0.755, y, 0]} s={[0.012, H, 0.014]} m={glassEdge} cast={false} />
        {[0.95, 1.95].map((hy) => (
          <B key={hy} p={[0, hy, 0]} s={[0.05, 0.08, 0.035]} m={M.chrome} name="obj-shower-hinge" />
        ))}
        <C p={[-0.66, 1.35, 0.04]} radius={0.012} h={0.36} m={M.chrome} name="obj-shower-handle" />
        <B p={[-0.66, 1.2, 0.02]} s={[0.02, 0.02, 0.04]} m={M.chrome} />
        <B p={[-0.66, 1.5, 0.02]} s={[0.02, 0.02, 0.04]} m={M.chrome} />
      </group>
    </group>
  );
}

function Bath() {
  const fixed = useFixed("shower-leak");
  const mirror = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#cfe3ee", metalness: 1, roughness: 0.05 }),
    [],
  );
  return (
    <group name="room-bath">
      <Hotspot id="shower-leak">
        <group name="obj-tub" position={[5.0, 0, -5.5]}>
          <B p={[0, 0.28, 0]} s={[1.8, 0.56, 0.8]} m={M.porcelain} />
          <B p={[0, 0.5, 0]} s={[1.62, 0.14, 0.62]} m={M.wallBath} cast={false} />
          {!fixed && (
            <B
              name="obj-standing-water"
              p={[0, 0.5, 0]}
              s={[1.6, 0.02, 0.6]}
              m={M.water}
              cast={false}
            />
          )}
          <B p={[0, 1.4, -0.38]} s={[1.8, 1.7, 0.02]} m={M.porcelain} cast={false} />
        </group>
        <ShowerScreen />
        <group name="obj-shower-fixture" position={[5.9, 0, -5.5]}>
          <Pipe a={[0, 1.95, 0]} b={[-0.25, 2.0, 0]} radius={0.018} m={M.chrome} />
          <C p={[-0.28, 1.97, 0]} r={[0, 0, -0.5]} radius={0.07} top={0.04} h={0.06} m={M.chrome} />
          <C
            p={[-0.02, 1.2, 0]}
            r={[0, 0, Math.PI / 2]}
            radius={0.08}
            h={0.03}
            m={M.chrome}
            name="obj-shower-valve"
          />
          <B p={[-0.07, 1.2, 0]} s={[0.1, 0.02, 0.02]} m={M.chrome} />
          {!fixed && <Drip from={[-0.3, 1.92, 0]} fall={1.38} period={0.9} material={M.water} />}
        </group>
      </Hotspot>
      <group name="obj-toilet" position={[5.55, 0, -3.5]} rotation={[0, -Math.PI / 2, 0]}>
        <C p={[0, 0.2, 0.08]} radius={0.17} top={0.2} h={0.4} m={M.porcelain} />
        <S p={[0, 0.42, 0.12]} radius={0.22} s={[0.2, 0.05, 0.26]} m={M.porcelain} />
        <B p={[0, 0.62, -0.18]} s={[0.44, 0.4, 0.18]} m={M.porcelain} />
      </group>
      <group name="obj-vanity" position={[3.0, 0, -5.62]}>
        <B p={[0, 0.42, 0]} s={[1.2, 0.84, 0.52]} m={M.cabinetLight} />
        <B p={[0, 0.86, 0]} s={[1.26, 0.04, 0.56]} m={M.counter} />
        <C p={[0, 0.88, 0.02]} radius={0.18} h={0.02} m={M.porcelain} />
        <C p={[0, 0.98, -0.2]} radius={0.02} h={0.2} m={M.chrome} />
        <B p={[0, 1.65, -0.27]} s={[0.9, 0.8, 0.02]} m={mirror} cast={false} />
      </group>
      <group name="obj-grab-bar" position={[5.92, 0.9, -5.0]}>
        <C r={[Math.PI / 2, 0, 0]} radius={0.018} h={0.6} m={M.chrome} />
      </group>
    </group>
  );
}

function WaterHeater() {
  const fixed = useFixed("water-heater");
  const tank = fixed ? M.white : M.steel;
  return (
    <Hotspot id="water-heater">
      <group name="obj-water-heater" position={[3.0, 0, -2.3]}>
        <C p={[0, 0.78, 0]} radius={0.3} h={1.5} m={tank} seg={24} />
        <C p={[0, 1.55, 0]} radius={0.3} top={0.26} h={0.06} m={tank} seg={24} />
        <Pipe a={[-0.1, 1.58, 0]} b={[-0.1, 3.0, 0]} radius={0.025} m={M.copper} />
        <Pipe a={[0.1, 1.58, 0]} b={[0.1, 3.0, 0]} radius={0.025} m={M.copper} />
        <B p={[0.31, 1.3, 0]} s={[0.06, 0.06, 0.06]} m={M.copper} name="obj-relief-valve" />
        <Pipe a={[0.34, 1.3, 0]} b={[0.34, 0.2, 0]} radius={0.016} m={M.copper} />
        <B p={[0, 0.3, 0.3]} s={[0.14, 0.12, 0.04]} m={M.darkMetal} />
        {!fixed && <C p={[0, 0.06, 0]} radius={0.31} h={0.1} m={M.rust} seg={24} cast={false} />}
      </group>
      {!fixed && (
        <C
          name="obj-heater-puddle"
          p={[3.1, 0.056, -1.6]}
          radius={0.75}
          h={0.006}
          seg={24}
          m={M.puddle}
          cast={false}
        />
      )}
    </Hotspot>
  );
}

function AirHandler() {
  return (
    <group name="obj-air-handler" position={[4.4, 0, -2.38]}>
      <B p={[0, 0.8, 0]} s={[0.8, 1.6, 0.66]} m={M.sidingLight} />
      <B p={[0, 0.8, 0.335]} s={[0.7, 1.4, 0.01]} m={M.steel} cast={false} />
      <B p={[0, 1.4, 0.35]} s={[0.5, 0.04, 0.02]} m={M.darkMetal} cast={false} />
      <B name="obj-air-filter" p={[0.41, 0.35, 0]} s={[0.03, 0.4, 0.6]} m={M.white} />
      <B name="obj-plenum" p={[0, 2.3, 0]} s={[0.8, 1.4, 0.6]} m={M.duct} />
    </group>
  );
}

function BreakerPanel() {
  const fixed = useFixed("breaker-panel");
  const red = useMemo(() => glow("#ff3b2f", 3), []);
  const green = useMemo(() => glow("#3ddc84", 2), []);
  return (
    <Hotspot id="breaker-panel">
      <group
        name="obj-electrical-panel"
        position={[5.9, 1.5, -0.4]}
        rotation={[0, -Math.PI / 2, 0]}
      >
        <B s={[0.55, 0.85, 0.1]} m={M.sidingLight} />
        <B p={[0, 0, 0.051]} s={[0.46, 0.76, 0.005]} m={M.darkMetal} cast={false} />
        <B
          p={[-0.46, 0, 0.2]}
          r={[0, 1.2, 0]}
          s={[0.5, 0.82, 0.02]}
          m={M.sidingLight}
          name="obj-panel-door"
        />
        {Array.from({ length: 16 }, (_, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const tripped = !fixed && i === 5;
          return (
            <B
              key={i}
              p={[col ? 0.1 : -0.1, 0.3 - row * 0.085, tripped ? 0.075 : 0.065]}
              s={[0.16, 0.06, 0.03]}
              m={tripped ? red : M.black}
              cast={false}
            />
          );
        })}
        <B
          p={[0, 0.34, 0.08]}
          s={[0.4, 0.06, 0.02]}
          m={M.black}
          cast={false}
          name="obj-main-breaker"
        />
        {fixed ? (
          <S p={[0.2, -0.36, 0.07]} radius={0.015} m={green} />
        ) : (
          <Blink period={0.8}>
            <Label p={[0, -0.47, 0.06]} size={0.05} color="#ff5a46">
              TRIPPED
            </Label>
          </Blink>
        )}
      </group>
    </Hotspot>
  );
}

function Laundry() {
  const fixed = useFixed("washer-e21");
  return (
    <Hotspot id="washer-e21">
      <group name="obj-washer" position={[2.42, 0, 0.7]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 0.45, 0]} s={[0.68, 0.9, 0.62]} m={M.white} />
        <C
          p={[0, 0.42, 0.31]}
          r={[Math.PI / 2, 0, 0]}
          radius={0.24}
          h={0.02}
          m={M.chrome}
          seg={32}
        />
        <C
          p={[0, 0.42, 0.32]}
          r={[Math.PI / 2, 0, 0]}
          radius={0.2}
          h={0.02}
          m={fixed ? M.glass : M.suds}
          seg={32}
        />
        <B p={[0, 0.82, 0.312]} s={[0.6, 0.12, 0.01]} m={M.screen} cast={false} />
        <group position={[0.12, 0.82, 0.32]}>
          {fixed ? (
            <Label size={0.05} color="#3ddc84">
              Ready
            </Label>
          ) : (
            <Blink period={0.7}>
              <Label size={0.06} color="#ff5a46">
                E21
              </Label>
            </Blink>
          )}
        </group>
        <C p={[-0.2, 0.82, 0.32]} r={[Math.PI / 2, 0, 0]} radius={0.04} h={0.02} m={M.darkMetal} />
      </group>
      <group name="obj-dryer" position={[2.42, 0, -0.1]} rotation={[0, Math.PI / 2, 0]}>
        <B p={[0, 0.45, 0]} s={[0.68, 0.9, 0.62]} m={M.white} />
        <C
          p={[0, 0.42, 0.31]}
          r={[Math.PI / 2, 0, 0]}
          radius={0.24}
          h={0.02}
          m={M.darkMetal}
          seg={32}
        />
        <B p={[0, 0.82, 0.312]} s={[0.6, 0.12, 0.01]} m={M.screen} cast={false} />
      </group>
      <Pipe
        a={[2.1, 0.9, -0.1]}
        b={[2.1, 2.4, -0.1]}
        radius={0.05}
        m={M.duct}
        name="obj-dryer-vent"
      />
      {!fixed && (
        <group name="obj-suds-puddle">
          <C p={[3.0, 0.056, 0.75]} radius={0.55} h={0.006} seg={20} m={M.puddle} cast={false} />
          {(
            [
              [2.82, 0.9],
              [2.9, 0.6],
              [3.1, 0.8],
            ] as [number, number][]
          ).map(([x, z], i) => (
            <S key={i} p={[x, 0.07, z]} radius={0.06} m={M.suds} />
          ))}
        </group>
      )}
    </Hotspot>
  );
}

function Detectors() {
  const fixed = useFixed("smoke-detector");
  const red = useMemo(() => glow("#ff3b2f", 3), []);
  const green = useMemo(() => glow("#3ddc84", 2), []);
  return (
    <Hotspot id="smoke-detector">
      <group name="obj-smoke-detector" position={[4.8, 2.9, -2.7]}>
        <C
          r={[Math.PI / 2, 0, 0]}
          radius={0.1}
          h={0.05}
          m={fixed ? M.white : M.wallUtility}
          seg={24}
        />
        {fixed ? (
          <S p={[0.05, 0, 0.03]} radius={0.012} m={green} />
        ) : (
          <Blink period={1.2} duty={0.15}>
            <S p={[0.05, 0, 0.03]} radius={0.016} m={red} />
          </Blink>
        )}
      </group>
      {fixed && (
        <group name="obj-co-detector" position={[4.3, 2.9, -2.7]}>
          <B s={[0.12, 0.16, 0.04]} m={M.white} />
          <S p={[0, 0.04, 0.025]} radius={0.01} m={green} />
        </group>
      )}
    </Hotspot>
  );
}

export function BathUtility() {
  const shop = useMemo(() => glow("#f3f7ff", 1.6), []);
  return (
    <group name="room-bath-utility">
      <Bath />
      <WaterHeater />
      <BreakerPanel />
      <Laundry />
      <Detectors />
      <StaticBatch name="utility-static">
        <AirHandler />
        <B name="obj-shop-light" p={[4, 3.0, -0.4]} s={[1.2, 0.05, 0.14]} m={shop} cast={false} />
        <group name="obj-utility-shelf" position={[5.6, 0, 1.2]}>
          <B p={[0, 0.9, 0]} s={[0.5, 1.8, 0.7]} m={M.darkMetal} />
          <B p={[0.02, 1.2, 0]} s={[0.4, 0.2, 0.3]} m={M.orange} />
          <B p={[0.02, 0.6, 0.1]} s={[0.4, 0.3, 0.3]} m={M.cardboard} />
        </group>
      </StaticBatch>
    </group>
  );
}
