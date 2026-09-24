import { StaticBatch } from "../../world/StaticBatch";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { B, C, M, S, glow } from "../../world/kit";
import { Blink, Spin, Stream, useFlicker } from "../../world/fx";
import { Hotspot } from "../../world/Hotspot";
import { Label } from "../../world/Label";
import { useFixed, world } from "../../world/store";

const screenOn = new THREE.MeshStandardMaterial({
  color: "#0b1426",
  emissive: "#1a3358",
  emissiveIntensity: 1.3,
  roughness: 0.15,
  toneMapped: false,
});
const screenOff = new THREE.MeshStandardMaterial({
  color: "#050608",
  roughness: 0.08,
  metalness: 0.6,
});
const backlight = new THREE.MeshBasicMaterial({
  color: "#ff9a4a",
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
  toneMapped: false,
});
const yellow = new THREE.MeshStandardMaterial({ color: "#f2c230", roughness: 0.5 });
const foam = new THREE.MeshStandardMaterial({ color: "#f4f4f0", roughness: 0.95 });
const pencil = new THREE.MeshBasicMaterial({ color: "#3b3b3b" });

/** 65-inch panel: thin bezel, stand-off back, and a screen that is live only once mounted. */
function TvPanel({ on }: { on: boolean }) {
  return (
    <group>
      <B s={[1.46, 0.84, 0.035]} m={M.black} />
      <B p={[0, 0, -0.04]} s={[0.9, 0.5, 0.05]} m={M.darkMetal} />
      <B p={[0, 0, 0.019]} s={[1.42, 0.8, 0.002]} m={on ? screenOn : screenOff} cast={false} />
      <B p={[0, -0.405, 0.02]} s={[0.12, 0.012, 0.004]} m={M.steel} cast={false} />
      {on && (
        <>
          <Label p={[0, 0.07, 0.022]} size={0.13} color="#ff7a1a">
            FIXING365
          </Label>
          <Label p={[0, -0.09, 0.022]} size={0.045} color="#e9eef5">
            If it’s broken, start here.
          </Label>
        </>
      )}
    </group>
  );
}

/** Low-profile wall plate with two hanging arms and slotted holes. */
function WallBracket() {
  return (
    <group name="obj-tv-bracket">
      <B s={[0.62, 0.34, 0.02]} m={M.darkMetal} />
      {[-0.2, 0, 0.2].map((x) => (
        <B key={x} p={[x, 0, 0.011]} s={[0.1, 0.018, 0.004]} m={M.black} cast={false} />
      ))}
      {[-0.2, 0.2].map((x) => (
        <group key={x} position={[x, 0, 0.03]}>
          <B s={[0.04, 0.48, 0.035]} m={M.darkMetal} />
          <B p={[0, 0.22, 0.02]} s={[0.05, 0.03, 0.02]} m={M.steel} />
        </group>
      ))}
    </group>
  );
}

function TvMount() {
  const fixed = useFixed("tv-mount");
  return (
    <Hotspot id="tv-mount">
      <group name="obj-media-console" position={[-1, 0, -5.62]}>
        <B p={[0, 0.27, 0]} s={[2.0, 0.44, 0.42]} m={M.floorWoodDark} />
        <B p={[0, 0.03, 0]} s={[1.9, 0.06, 0.38]} m={M.black} />
        {[-0.5, 0.5].map((x) => (
          <B key={x} p={[x, 0.27, 0.212]} s={[0.96, 0.38, 0.006]} m={M.woodLight} cast={false} />
        ))}
        <B p={[0, 0.27, 0.216]} s={[0.01, 0.38, 0.004]} m={M.black} cast={false} />
        <B p={[0.62, 0.52, 0.02]} s={[0.34, 0.06, 0.24]} m={M.black} name="obj-streaming-box" />
        <B p={[-0.3, 0.53, 0.06]} s={[0.9, 0.08, 0.1]} m={M.darkMetal} name="obj-soundbar" />
      </group>
      {fixed ? (
        <group name="obj-tv-mounted">
          <B p={[-1, 1.62, -5.9]} s={[1.56, 0.94, 0.005]} m={backlight} cast={false} />
          <group position={[-1, 1.62, -5.83]}>
            <TvPanel on />
          </group>
          <B name="obj-cable-raceway" p={[-0.6, 0.83, -5.9]} s={[0.05, 0.64, 0.025]} m={M.wall} />
        </group>
      ) : (
        <group name="obj-tv-unmounted">
          <B p={[0.95, 0.012, -5.55]} s={[1.7, 0.02, 0.6]} m={M.navy} cast={false} />
          <group position={[0.95, 0.46, -5.74]} rotation={[-0.14, 0, 0]}>
            <TvPanel on={false} />
            {[-0.68, 0.68].map((x) => (
              <B key={x} p={[x, -0.38, 0.02]} s={[0.16, 0.14, 0.12]} m={foam} />
            ))}
          </group>
          <group position={[-1, 1.62, -5.9]}>
            <WallBracket />
          </group>
          {[-1.4, -0.6].map((x) => (
            <group key={x} position={[x, 1.95, -5.915]}>
              <B s={[0.06, 0.005, 0.002]} m={pencil} cast={false} />
              <B s={[0.005, 0.06, 0.002]} m={pencil} cast={false} />
            </group>
          ))}
          <B name="obj-level" p={[-1.2, 0.51, -5.5]} s={[0.6, 0.05, 0.03]} m={yellow} />
          <B
            name="obj-stud-finder"
            p={[-1.72, 0.52, -5.52]}
            r={[0, 0.3, 0]}
            s={[0.16, 0.05, 0.08]}
            m={M.orange}
          />
          <group name="obj-drill" position={[-0.4, 0.49, -5.5]} rotation={[0, -0.5, 0]}>
            <B p={[0, 0.06, 0]} s={[0.2, 0.08, 0.07]} m={M.orange} />
            <B p={[-0.04, -0.01, 0]} s={[0.05, 0.12, 0.05]} m={M.black} />
            <B p={[-0.04, -0.07, 0]} s={[0.09, 0.04, 0.08]} m={M.black} />
            <C p={[0.13, 0.06, 0]} r={[0, 0, Math.PI / 2]} radius={0.02} h={0.08} m={M.chrome} />
          </group>
          <B
            name="obj-hardware-bag"
            p={[0.1, 0.5, -5.45]}
            r={[0, 0.2, 0]}
            s={[0.16, 0.02, 0.12]}
            m={M.glass}
          />
          <B
            name="obj-mount-box"
            p={[0.2, 0.13, -4.7]}
            r={[0, 0.35, 0]}
            s={[0.7, 0.24, 0.45]}
            m={M.cardboard}
          />
          <B
            p={[0.2, 0.255, -4.7]}
            r={[0, 0.35, 0]}
            s={[0.5, 0.005, 0.2]}
            m={M.white}
            cast={false}
          />
        </group>
      )}
    </Hotspot>
  );
}

function CeilingFan() {
  const fixed = useFixed("ceiling-fan");
  const bulb = useMemo(() => glow("#ffe6c0", 2.4) as THREE.MeshStandardMaterial, []);
  const light = useRef<THREE.PointLight>(null);
  const wobble = useRef<THREE.Group>(null);
  useFlicker(bulb, 2.4, !fixed, light, 3);
  useFrame(({ clock }) => {
    if (!wobble.current) return;
    const w = fixed || world.get().reduced ? 0 : 0.06;
    const t = clock.elapsedTime * 7;
    wobble.current.rotation.x = Math.sin(t) * w;
    wobble.current.rotation.z = Math.cos(t) * w;
  });
  return (
    <Hotspot id="ceiling-fan">
      <group name="obj-ceiling-fan" position={[-1, 3.13, -2.8]}>
        <group ref={wobble} userData={{ dynamic: true }}>
          <C p={[0, -0.18, 0]} radius={0.02} h={0.36} m={M.darkMetal} />
          <C p={[0, -0.4, 0]} radius={0.16} top={0.12} h={0.16} m={M.darkMetal} />
          <Spin speed={fixed ? 3 : 4.2} position={[0, -0.44, 0]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <group key={i} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
                <B p={[0.55, 0, 0]} r={[0.12, 0, 0]} s={[0.8, 0.018, 0.16]} m={M.woodLight} />
              </group>
            ))}
          </Spin>
          <S p={[0, -0.56, 0]} radius={0.12} s={[0.14, 0.08, 0.14]} m={bulb} />
        </group>
        <pointLight
          ref={light}
          position={[0, -0.8, 0]}
          intensity={3}
          distance={5}
          color="#ffdcae"
        />
      </group>
    </Hotspot>
  );
}

function DrywallHole() {
  const fixed = useFixed("drywall-hole");
  const hole = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2a2019", roughness: 1 }),
    [],
  );
  return (
    <Hotspot id="drywall-hole">
      <group name="obj-hall-door" position={[1.9, 0, -3.4]} rotation={[0, fixed ? -1.2 : -0.9, 0]}>
        <B p={[0, 1.08, 0.43]} s={[0.05, 2.16, 0.86]} m={M.trim} />
        <S p={[-0.05, 0.95, 0.78]} radius={0.035} m={M.chrome} />
        <S p={[0.05, 0.95, 0.78]} radius={0.035} m={M.chrome} />
      </group>
      {fixed ? (
        <group name="obj-door-stop">
          <C p={[1.6, 0.09, -2.7]} radius={0.025} h={0.1} r={[0, 0, Math.PI / 2]} m={M.chrome} />
        </group>
      ) : (
        <group name="obj-drywall-hole">
          <mesh position={[1.915, 0.95, -2.62]} rotation={[0, -Math.PI / 2, 0]} material={hole}>
            <circleGeometry args={[0.13, 9]} />
          </mesh>
          <mesh
            position={[1.914, 0.95, -2.62]}
            rotation={[0, -Math.PI / 2, 0]}
            material={M.wallUtility}
          >
            <ringGeometry args={[0.12, 0.2, 9]} />
          </mesh>
          {(
            [
              [1.7, -2.5],
              [1.55, -2.7],
              [1.75, -2.8],
            ] as [number, number][]
          ).map(([x, z], i) => (
            <B
              key={i}
              p={[x, 0.07, z]}
              r={[0, i, 0]}
              s={[0.08, 0.02, 0.06]}
              m={M.wall}
              cast={false}
            />
          ))}
          <B name="obj-patch-kit" p={[1.35, 0.06, -2.3]} s={[0.26, 0.04, 0.18]} m={M.orange} />
        </group>
      )}
    </Hotspot>
  );
}

const books = ["#c0392b", "#2c3e50", "#e3b34a", "#3e7a44", "#8e44ad", "#d35400", "#1f6f8b"].map(
  (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }),
);
const board = new THREE.MeshStandardMaterial({ color: "#efe9dd", roughness: 0.55 });
const edge = new THREE.MeshStandardMaterial({ color: "#d9d1c1", roughness: 0.6 });
const hardboard = new THREE.MeshStandardMaterial({ color: "#a58a66", roughness: 0.9 });
const dowel = new THREE.MeshStandardMaterial({ color: "#caa46e", roughness: 0.8 });
const BW = 0.84;
const BH = 1.24;
const BD = 0.3;
const BT = 0.022;

/** Bookcase carcass. `shelves` sets how many shelves are fitted, `back` whether the back is on. */
function Bookcase({ shelves, back }: { shelves: number; back: boolean }) {
  const ys = [0.34, 0.64, 0.94];
  return (
    <group>
      <B p={[-BW / 2 + BT / 2, BH / 2, 0]} s={[BT, BH, BD]} m={board} />
      <B p={[BW / 2 - BT / 2, BH / 2, 0]} s={[BT, BH, BD]} m={board} />
      <B p={[0, BH - BT / 2, 0]} s={[BW, BT, BD]} m={board} />
      <B p={[0, 0.05, 0]} s={[BW - 2 * BT, BT, BD]} m={board} />
      <B p={[0, 0.02, 0.13]} s={[BW - 2 * BT, 0.04, BT]} m={edge} />
      {ys.slice(0, shelves).map((y) => (
        <B key={y} p={[0, y, 0]} s={[BW - 2 * BT, BT, BD - 0.02]} m={board} />
      ))}
      {back && <B p={[0, BH / 2, -BD / 2]} s={[BW - 0.01, BH - 0.01, 0.006]} m={hardboard} />}
      {[-1, 1].map((side) =>
        [0.24, 0.44, 0.54, 0.74, 0.84, 1.04].map((y) => (
          <B
            key={`${side}-${y}`}
            p={[side * (BW / 2 - BT - 0.001), y, 0.08]}
            s={[0.002, 0.012, 0.012]}
            m={M.black}
            cast={false}
          />
        )),
      )}
    </group>
  );
}

function FlatPack() {
  const fixed = useFixed("flat-pack");
  return (
    <Hotspot id="flat-pack">
      {fixed ? (
        <group name="obj-bookcase-assembled" position={[-0.5, 0, 0.0]} rotation={[0, 0.25, 0]}>
          <Bookcase shelves={3} back />
          {[0.07, 0.37, 0.67, 0.97].map((y, row) =>
            Array.from({ length: 5 + (row % 2) }, (_, i) => {
              const h = 0.2 + ((i * 7 + row * 3) % 5) * 0.012;
              return (
                <B
                  key={`${row}-${i}`}
                  p={[-0.3 + i * 0.075 + (row % 2) * 0.1, y + 0.02 + h / 2, 0.01]}
                  r={[0, 0, i === 4 ? 0.18 : 0]}
                  s={[0.05, h, 0.2]}
                  m={books[(i + row * 2) % books.length]!}
                />
              );
            }),
          )}
          <C p={[0.26, BH + 0.08, 0]} radius={0.07} top={0.09} h={0.14} m={M.white} />
          <S p={[0.26, BH + 0.24, 0]} radius={0.12} s={[0.13, 0.16, 0.13]} m={M.plant} />
        </group>
      ) : (
        <group name="obj-flatpack-build" position={[-0.4, 0, 0.1]}>
          <group position={[-0.1, 0, -0.1]} rotation={[0, 0.35, 0]}>
            <Bookcase shelves={1} back={false} />
            <B
              p={[0.05, 0.6, -0.3]}
              r={[0.18, 0, 0]}
              s={[BW - 0.02, BH - 0.05, 0.006]}
              m={hardboard}
              name="obj-back-panel"
            />
          </group>
          <group position={[0.75, 0, 0.45]} rotation={[0, -0.2, 0]}>
            <B p={[0, 0.03, 0]} s={[0.95, 0.06, 0.42]} m={M.cardboard} />
            <B p={[0, 0.07, -0.26]} r={[-1.2, 0, 0]} s={[0.95, 0.2, 0.01]} m={M.cardboard} />
            <B p={[0, 0.07, 0.26]} r={[1.2, 0, 0]} s={[0.95, 0.2, 0.01]} m={M.cardboard} />
            <B p={[0, 0.075, 0]} s={[0.9, 0.03, 0.36]} m={foam} />
            <B p={[0, 0.1, 0.01]} s={[0.8, BT, 0.28]} m={board} />
            <B p={[0.01, 0.123, 0]} s={[0.8, BT, 0.28]} m={board} />
          </group>
          <group name="obj-hardware-tray" position={[-0.55, 0, 0.55]}>
            <C p={[0, 0.02, 0]} radius={0.1} top={0.12} h={0.04} m={M.white} />
            {Array.from({ length: 6 }, (_, i) => (
              <C
                key={i}
                p={[Math.cos(i) * 0.05, 0.045, Math.sin(i) * 0.05]}
                radius={0.012}
                h={0.01}
                m={M.steel}
                seg={10}
                cast={false}
              />
            ))}
            {Array.from({ length: 5 }, (_, i) => (
              <C
                key={`d${i}`}
                p={[-0.02 + i * 0.012, 0.05, 0.02]}
                r={[Math.PI / 2, 0, 0.3 * i]}
                radius={0.005}
                h={0.05}
                m={dowel}
                seg={6}
                cast={false}
              />
            ))}
          </group>
          <group name="obj-instructions" position={[-0.2, 0.012, 0.7]} rotation={[0, 0.5, 0]}>
            <B
              p={[-0.105, 0, 0]}
              r={[0, 0, 0.06]}
              s={[0.2, 0.004, 0.28]}
              m={M.white}
              cast={false}
            />
            <B
              p={[0.105, 0, 0]}
              r={[0, 0, -0.06]}
              s={[0.2, 0.004, 0.28]}
              m={M.white}
              cast={false}
            />
            {[-0.08, -0.02, 0.05].map((z) => (
              <B key={z} p={[-0.1, 0.004, z]} s={[0.14, 0.001, 0.008]} m={pencil} cast={false} />
            ))}
            <B p={[0.1, 0.004, 0]} s={[0.12, 0.001, 0.12]} m={pencil} cast={false} />
          </group>
          <B
            name="obj-allen-key"
            p={[0.1, 0.012, 0.85]}
            r={[0, 1, 0]}
            s={[0.1, 0.008, 0.008]}
            m={M.darkMetal}
            cast={false}
          />
          <group
            name="obj-assembly-drill"
            position={[0.3, 0.06, 0.75]}
            rotation={[Math.PI / 2, 0, 0.7]}
          >
            <B p={[0, 0.06, 0]} s={[0.2, 0.08, 0.07]} m={M.orange} />
            <B p={[-0.04, -0.01, 0]} s={[0.05, 0.12, 0.05]} m={M.black} />
          </group>
        </group>
      )}
    </Hotspot>
  );
}

function Thermostat() {
  const fixed = useFixed("thermostat");
  const ring = useMemo(() => glow("#ff9340", 1.6), []);
  const cool = useMemo(() => glow("#56c8ff", 1.6), []);
  const air = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#dff5ff",
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    [],
  );
  return (
    <Hotspot id="thermostat">
      <group name="obj-thermostat" position={[1.9, 1.55, -5.4]} rotation={[0, -Math.PI / 2, 0]}>
        <C r={[Math.PI / 2, 0, 0]} radius={0.1} h={0.04} m={M.white} seg={32} />
        <mesh position={[0, 0, 0.022]} material={fixed ? cool : ring}>
          <ringGeometry args={[0.075, 0.088, 40]} />
        </mesh>
        <Label p={[0, 0, 0.025]} size={0.055} color={fixed ? "#56c8ff" : "#ff9340"}>
          {fixed ? "72°" : "84°"}
        </Label>
      </group>
      <group name="obj-supply-vent" position={[0.9, 2.75, -5.9]}>
        <B s={[0.5, 0.16, 0.03]} m={M.white} />
        {[-0.04, 0, 0.04].map((y) => (
          <B key={y} p={[0, y, 0.02]} s={[0.46, 0.012, 0.01]} m={M.steel} cast={false} />
        ))}
        {fixed && (
          <Stream
            origin={[0, -0.02, 0.05]}
            dir={[0, -0.25, 1.2]}
            spread={0.5}
            count={18}
            size={0.018}
            life={1.4}
            gravity={0}
            material={air}
          />
        )}
      </group>
      {!fixed && (
        <Blink period={2.4} duty={0.5}>
          <group name="obj-heat-shimmer" position={[0.2, 1.5, -5.2]}>
            <Label size={0.09} color="#ff9340" outline="#1b1208">
              Too warm
            </Label>
          </group>
        </Blink>
      )}
    </Hotspot>
  );
}

function Furniture() {
  const lamp = useMemo(() => glow("#ffe0b0", 1.8), []);
  return (
    <group name="living-furniture">
      <group name="obj-sofa" position={[-1.7, 0, -1.4]}>
        <B p={[0, 0.25, 0]} s={[2.3, 0.42, 0.95]} m={M.fabric} />
        <B p={[0, 0.62, 0.38]} s={[2.3, 0.55, 0.22]} m={M.fabric} />
        <B p={[-1.08, 0.46, 0]} s={[0.18, 0.3, 0.95]} m={M.fabric} />
        <B p={[1.08, 0.46, 0]} s={[0.18, 0.3, 0.95]} m={M.fabric} />
        <B p={[-0.55, 0.52, -0.05]} s={[1.0, 0.12, 0.8]} m={M.fabric} />
        <B p={[0.55, 0.52, -0.05]} s={[1.0, 0.12, 0.8]} m={M.fabric} />
        <B p={[-0.8, 0.72, 0.22]} r={[0.2, 0, 0.1]} s={[0.4, 0.36, 0.12]} m={M.fabricWarm} />
      </group>
      <group name="obj-coffee-table" position={[-1.6, 0, -3.1]}>
        <B p={[0, 0.38, 0]} s={[1.2, 0.05, 0.6]} m={M.woodLight} />
        {(
          [
            [-0.55, -0.25],
            [0.55, -0.25],
            [-0.55, 0.25],
            [0.55, 0.25],
          ] as [number, number][]
        ).map(([x, z], i) => (
          <C key={i} p={[x, 0.18, z]} radius={0.02} h={0.36} m={M.darkMetal} seg={6} />
        ))}
        <B p={[0.3, 0.43, 0]} s={[0.3, 0.04, 0.22]} m={M.navy} />
      </group>
      <group name="obj-floor-lamp" position={[-3.5, 0, -0.8]}>
        <C p={[0, 0.02, 0]} radius={0.16} h={0.04} m={M.darkMetal} />
        <C p={[0, 0.8, 0]} radius={0.015} h={1.6} m={M.darkMetal} seg={6} />
        <C p={[0, 1.62, 0]} radius={0.22} top={0.14} h={0.28} m={lamp} />
      </group>
      <group name="obj-plant" position={[-3.4, 0, -5.4]}>
        <C p={[0, 0.2, 0]} radius={0.18} top={0.22} h={0.4} m={M.white} />
        <S p={[0, 0.72, 0]} radius={0.3} s={[0.3, 0.45, 0.3]} m={M.plant} />
      </group>
    </group>
  );
}

export function Living() {
  return (
    <group name="room-living">
      <StaticBatch name="living-static">
        <Furniture />
      </StaticBatch>
      <TvMount />
      <CeilingFan />
      <DrywallHole />
      <FlatPack />
      <Thermostat />
    </group>
  );
}
