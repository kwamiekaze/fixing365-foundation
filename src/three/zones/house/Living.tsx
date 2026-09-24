import { StaticBatch } from "../../world/StaticBatch";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { B, C, M, S, glow } from "../../world/kit";
import { Blink, Spin, Stream, useFlicker } from "../../world/fx";
import { Hotspot } from "../../world/Hotspot";
import { Label } from "../../world/Label";
import { useFixed, world } from "../../world/store";

function TvScreen() {
  const screen = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0b1426",
        emissive: "#13233d",
        emissiveIntensity: 1.4,
        roughness: 0.2,
        toneMapped: false,
      }),
    [],
  );
  return (
    <group>
      <B s={[1.46, 0.84, 0.05]} m={M.black} />
      <B p={[0, 0, 0.027]} s={[1.4, 0.78, 0.002]} m={screen} cast={false} />
      <Label p={[0, 0.06, 0.03]} size={0.13} color="#ff7a1a">
        FIXING365
      </Label>
      <Label p={[0, -0.1, 0.03]} size={0.045} color="#e9eef5">
        If it’s broken, start here.
      </Label>
    </group>
  );
}

function TvMount() {
  const fixed = useFixed("tv-mount");
  return (
    <Hotspot id="tv-mount">
      <group name="obj-media-console" position={[-1, 0, -5.62]}>
        <B p={[0, 0.25, 0]} s={[2.0, 0.5, 0.42]} m={M.floorWoodDark} />
        <B p={[0, 0.25, 0.212]} s={[0.02, 0.4, 0.005]} m={M.black} cast={false} />
        <B p={[0.6, 0.55, 0]} s={[0.36, 0.08, 0.26]} m={M.black} />
        <B p={[-0.55, 0.56, 0.02]} s={[0.7, 0.1, 0.12]} m={M.darkMetal} name="obj-soundbar" />
      </group>
      {fixed ? (
        <group name="obj-tv-mounted" position={[-1, 1.62, -5.84]}>
          <TvScreen />
        </group>
      ) : (
        <group name="obj-tv-unmounted">
          <group position={[-1, 0.47, -5.1]} rotation={[-0.2, 0, 0]}>
            <TvScreen />
          </group>
          <group name="obj-tv-bracket" position={[-1, 1.62, -5.9]}>
            <B s={[0.5, 0.36, 0.03]} m={M.darkMetal} />
            <B p={[-0.18, 0, 0.04]} s={[0.04, 0.5, 0.05]} m={M.darkMetal} />
            <B p={[0.18, 0, 0.04]} s={[0.04, 0.5, 0.05]} m={M.darkMetal} />
          </group>
          <B
            name="obj-mount-box"
            p={[0.4, 0.14, -4.8]}
            r={[0, 0.3, 0]}
            s={[0.6, 0.26, 0.4]}
            m={M.cardboard}
          />
          <B
            name="obj-stud-finder"
            p={[-0.2, 0.08, -4.6]}
            r={[0, -0.4, 0]}
            s={[0.16, 0.05, 0.08]}
            m={M.orange}
          />
          <C name="obj-cable-coil" p={[-1.9, 0.07, -5.0]} radius={0.16} h={0.04} m={M.black} />
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

function FlatPack() {
  const fixed = useFixed("flat-pack");
  return (
    <Hotspot id="flat-pack">
      {fixed ? (
        <group name="obj-bookshelf-assembled" position={[-0.4, 0, 1.62]}>
          <B p={[0, 0.5, 0]} s={[1.3, 1.0, 0.36]} m={M.cabinetLight} />
          <B p={[0, 0.5, 0.17]} s={[1.24, 0.03, 0.02]} m={M.trim} />
          <B p={[-0.35, 0.72, 0.05]} s={[0.4, 0.3, 0.22]} m={M.fabricWarm} />
          <B p={[0.3, 0.25, 0.05]} s={[0.5, 0.22, 0.22]} m={M.navy} />
          <S p={[0.35, 1.12, 0]} radius={0.1} m={M.plant} />
        </group>
      ) : (
        <group name="obj-flatpack-parts" position={[-0.4, 0, 0.8]}>
          <B p={[0, 0.2, 0.2]} r={[0, 0.2, 0]} s={[1.2, 0.4, 0.5]} m={M.cardboard} />
          <B p={[0.55, 0.03, -0.45]} r={[0, 0.4, 0]} s={[1.3, 0.03, 0.36]} m={M.cabinetLight} />
          <B p={[-0.5, 0.06, -0.55]} r={[0, -0.3, 0]} s={[1.3, 0.03, 0.36]} m={M.cabinetLight} />
          <group position={[0.2, 0, 0.9]} rotation={[0, -0.25, 0]}>
            <B p={[-0.6, 0.5, 0]} s={[0.03, 1.0, 0.36]} m={M.cabinetLight} />
            <B p={[0, 0.02, 0]} s={[1.2, 0.03, 0.36]} m={M.cabinetLight} />
            <B p={[0, 0.5, 0]} r={[0, 0, 0.35]} s={[0.9, 0.03, 0.36]} m={M.cabinetLight} />
          </group>
          <B
            name="obj-instructions"
            p={[-0.9, 0.012, 0.4]}
            r={[0, 0.6, 0]}
            s={[0.3, 0.004, 0.42]}
            m={M.white}
            cast={false}
          />
          <B
            name="obj-allen-key"
            p={[-0.7, 0.02, 0.7]}
            r={[0, 1, 0]}
            s={[0.12, 0.01, 0.01]}
            m={M.darkMetal}
            cast={false}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <C
              key={i}
              p={[-0.55 + i * 0.05, 0.015, 0.9 - (i % 2) * 0.04]}
              r={[Math.PI / 2, 0, i]}
              radius={0.008}
              h={0.04}
              m={M.steel}
              seg={6}
              cast={false}
            />
          ))}
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
      <group name="obj-plant" position={[1.4, 0, -5.4]}>
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
