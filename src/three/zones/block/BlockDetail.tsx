import { StaticBatch } from "../../world/StaticBatch";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { B, C, M, S, glow } from "../../world/kit";
import { Blink, Spin, useFlicker } from "../../world/fx";
import { Hotspot } from "../../world/Hotspot";
import { Label } from "../../world/Label";
import { useFixed } from "../../world/store";
import { useDaylight } from "../../world/Environment";

const X1 = 19;
const X2 = 31;
const CX = 25;
const FRONT = 1;
const BACK = -6;
const F1 = 4;
const TOP = 7.5;

function Facade() {
  const day = useDaylight();
  const lit = useMemo(() => (day > 0.55 ? M.screen : glow("#ffd59a", 1.8)), [day]);
  return (
    <group name="block-facade">
      {/* side and back walls */}
      <B p={[X1, TOP / 2, (FRONT + BACK) / 2]} s={[0.2, TOP, FRONT - BACK]} m={M.brick} />
      <B p={[X2, TOP / 2, (FRONT + BACK) / 2]} s={[0.2, TOP, FRONT - BACK]} m={M.brick} />
      <B p={[CX, TOP / 2, BACK]} s={[X2 - X1, TOP, 0.2]} m={M.brick} />
      <B
        p={[CX, TOP + 0.1, (FRONT + BACK) / 2]}
        s={[X2 - X1 + 0.3, 0.2, FRONT - BACK + 0.3]}
        m={M.darkMetal}
      />
      <B p={[CX, F1, (FRONT + BACK) / 2]} s={[X2 - X1, 0.2, FRONT - BACK]} m={M.floorWoodDark} />
      {/* ground floor storefront frame */}
      <B p={[X1 + 0.4, F1 / 2, FRONT]} s={[0.8, F1, 0.3]} m={M.brick} />
      <B p={[X2 - 0.4, F1 / 2, FRONT]} s={[0.8, F1, 0.3]} m={M.brick} />
      <B p={[CX, 3.55, FRONT]} s={[X2 - X1, 0.9, 0.3]} m={M.navy} />
      <B p={[CX, 0.2, FRONT]} s={[X2 - X1, 0.4, 0.3]} m={M.brick} />
      <B
        name="block-shop-glass"
        p={[CX, 1.75, FRONT]}
        s={[X2 - X1 - 1.6, 2.7, 0.04]}
        m={M.glass}
        cast={false}
      />
      {[21.5, 24, 26.5, 29].map((x) => (
        <B key={x} p={[x, 1.75, FRONT]} s={[0.08, 2.7, 0.1]} m={M.darkMetal} />
      ))}
      {/* striped awning */}
      {Array.from({ length: 12 }, (_, i) => (
        <B
          key={i}
          p={[X1 + 1 + i * 0.84 + 0.42, 3.0, FRONT + 0.55]}
          r={[0.45, 0, 0]}
          s={[0.84, 0.04, 1.2]}
          m={i % 2 ? M.orange : M.white}
        />
      ))}
      {/* upper floor */}
      <B p={[CX, (F1 + TOP) / 2, FRONT]} s={[X2 - X1, TOP - F1, 0.3]} m={M.brick} />
      {[21.5, 25, 28.5].map((x) => (
        <group key={x} position={[x, 5.7, FRONT + 0.16]}>
          <B s={[1.5, 1.8, 0.02]} m={lit} cast={false} />
          <B p={[0, -0.95, 0.06]} s={[1.7, 0.1, 0.16]} m={M.trim} />
          <B p={[0, 0, 0.02]} s={[0.06, 1.8, 0.04]} m={M.trim} />
        </group>
      ))}
      <B p={[CX, TOP - 0.2, FRONT + 0.2]} s={[X2 - X1 + 0.2, 0.3, 0.2]} m={M.trim} />
    </group>
  );
}

function Cafe() {
  const pend = useMemo(() => glow("#ffcf8a", 2.4), []);
  return (
    <group name="block-cafe-interior">
      <B p={[CX, 0.03, -2.5]} s={[X2 - X1 - 0.4, 0.06, 6.6]} m={M.floorWood} cast={false} />
      <B name="obj-cafe-counter" p={[CX + 2, 0.55, -4.2]} s={[5, 1.1, 0.8]} m={M.navy} />
      <B p={[CX + 2, 1.12, -4.2]} s={[5.1, 0.06, 0.9]} m={M.counter} />
      <B name="obj-espresso-machine" p={[CX + 3, 1.4, -4.3]} s={[0.8, 0.5, 0.5]} m={M.chrome} />
      {(
        [
          [21, -1.2],
          [23, -1.2],
          [21, -3],
          [23, -3],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <C p={[0, 0.74, 0]} radius={0.4} h={0.04} m={M.woodLight} />
          <C p={[0, 0.37, 0]} radius={0.04} h={0.74} m={M.darkMetal} seg={8} />
          <C p={[0.55, 0.45, 0]} radius={0.18} h={0.06} m={M.darkMetal} />
          <C p={[-0.55, 0.45, 0]} radius={0.18} h={0.06} m={M.darkMetal} />
        </group>
      ))}
      {[21, 23, 26, 28].map((x) => (
        <group key={x}>
          <C p={[x, 3.3, -2]} radius={0.01} h={1.0} m={M.black} seg={6} cast={false} />
          <C p={[x, 2.72, -2]} radius={0.2} top={0.06} h={0.2} m={M.black} />
          <S p={[x, 2.6, -2]} radius={0.06} m={pend} />
        </group>
      ))}
      <pointLight position={[CX, 3, -2]} intensity={7} distance={11} color="#ffcf8a" decay={1.4} />
    </group>
  );
}

function ShopSign() {
  const fixed = useFixed("storefront-lights");
  const neon = useMemo(() => glow("#ffb347", 2.6) as THREE.MeshStandardMaterial, []);
  const light = useRef<THREE.PointLight>(null);
  useFlicker(neon, 2.6, !fixed, light, 5);
  return (
    <Hotspot id="storefront-lights">
      <group name="obj-shop-sign" position={[CX, 3.55, FRONT + 0.17]}>
        <B s={[5.2, 0.62, 0.05]} m={M.black} />
        <B p={[0, -0.26, 0.03]} s={[4.9, 0.03, 0.02]} m={neon} cast={false} />
        <B p={[0, 0.26, 0.03]} s={[4.9, 0.03, 0.02]} m={neon} cast={false} />
        <Label p={[0, 0, 0.04]} size={0.32} color="#ffc56b">
          CORNER CAFÉ
        </Label>
      </group>
      {[21, 29].map((x) => (
        <group key={x} name="obj-storefront-light" position={[x, 3.1, FRONT + 0.3]}>
          <B s={[0.3, 0.12, 0.3]} m={M.black} />
          <B p={[0, -0.07, 0]} s={[0.24, 0.02, 0.24]} m={neon} cast={false} />
        </group>
      ))}
      <pointLight
        ref={light}
        position={[CX, 3.0, FRONT + 1.2]}
        intensity={5}
        distance={7}
        color="#ffcf8a"
      />
    </Hotspot>
  );
}

function RooftopUnit() {
  const fixed = useFixed("rooftop-hvac");
  const red = useMemo(() => glow("#ff3b2f", 3), []);
  const green = useMemo(() => glow("#3ddc84", 2), []);
  return (
    <Hotspot id="rooftop-hvac">
      <group name="obj-rooftop-unit" position={[27, TOP + 0.2, -3]}>
        <B p={[0, 0.6, 0]} s={[2.6, 1.2, 1.7]} m={M.sidingLight} />
        {[-0.8, -0.3, 0.2, 0.7].map((x) => (
          <B key={x} p={[x, 0.6, 0.86]} s={[0.3, 0.9, 0.01]} m={M.darkMetal} cast={false} />
        ))}
        {[-0.6, 0.6].map((x) => (
          <group key={x} position={[x, 1.21, 0]}>
            <C radius={0.42} h={0.03} m={M.darkMetal} />
            <Spin speed={fixed ? 12 : 0}>
              {[0, 1, 2].map((i) => (
                <B
                  key={i}
                  r={[0, (i * Math.PI * 2) / 3, 0.2]}
                  s={[0.72, 0.012, 0.12]}
                  m={M.black}
                />
              ))}
            </Spin>
          </group>
        ))}
        <B p={[0, -0.05, -1.2]} s={[0.6, 0.4, 0.8]} m={M.duct} />
        <S p={[1.2, 1.0, 0.87]} radius={0.04} m={fixed ? green : red} />
        {!fixed && (
          <Blink period={1.6}>
            <Label p={[0, 1.8, 0]} size={0.22} color="#ff9340" outline="#1b1208">
              Unit down
            </Label>
          </Blink>
        )}
      </group>
    </Hotspot>
  );
}

function RentalStairs() {
  const fixed = useFixed("apartment-lock");
  const door = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6b2d2d", roughness: 0.5 }),
    [],
  );
  const steps = 16;
  return (
    <group name="block-rental-stairs">
      {Array.from({ length: steps }, (_, i) => (
        <B
          key={i}
          p={[31.7, (i + 1) * (F1 / steps) - 0.06, 1.5 - i * 0.25]}
          s={[1.0, 0.08, 0.28]}
          m={M.darkMetal}
        />
      ))}
      <B p={[31.7, F1 - 0.05, -3]} s={[1.2, 0.1, 1.2]} m={M.darkMetal} />
      <B
        p={[32.25, F1 / 2 + 0.5, -0.5]}
        r={[Math.atan2(F1, 4), 0, 0]}
        s={[0.05, 0.05, 5.6]}
        m={M.darkMetal}
      />
      <C p={[32.25, F1 / 2, 1.5]} radius={0.04} h={F1} m={M.darkMetal} seg={6} />
      <C p={[32.25, F1 / 2, -3.5]} radius={0.04} h={F1} m={M.darkMetal} seg={6} />
      <Hotspot id="apartment-lock">
        <group
          name="obj-rental-door"
          position={[31.12, F1 + 1.1, -3]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <B s={[0.95, 2.2, 0.06]} m={door} />
          <B p={[0, 0, -0.02]} s={[1.1, 2.35, 0.04]} m={M.trim} />
          <S p={[0.35, -0.1, 0.05]} radius={0.04} m={M.chrome} />
          {fixed ? (
            <B name="obj-new-deadbolt" p={[0.35, 0.12, 0.05]} s={[0.08, 0.08, 0.03]} m={M.chrome} />
          ) : (
            <group name="obj-broken-deadbolt">
              <B p={[0.38, 0.05, 0.07]} r={[0, 0, 0.6]} s={[0.08, 0.08, 0.03]} m={M.chrome} />
              <Blink period={1.8}>
                <Label p={[0, 0.7, 0.06]} size={0.09} color="#ff9340">
                  Won’t latch
                </Label>
              </Blink>
            </group>
          )}
        </group>
      </Hotspot>
    </group>
  );
}

/** Detailed chunk for the Main Street block: café, upstairs rental, rooftop unit. */
export default function BlockDetail() {
  return (
    <group name="block-detail">
      <StaticBatch name="block-static">
        <Facade />
        <Cafe />
      </StaticBatch>
      <ShopSign />
      <RooftopUnit />
      <RentalStairs />
    </group>
  );
}
