import { FONT_URL } from "./world/Label";
import { Html, Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Steam } from "./effects/Steam";
const examples = [
  "Leaking faucet…",
  "Breaker keeps tripping…",
  "Washer shows E21…",
  "Loose deck railing…",
] as const;
function LiveMonitor({ reduced = false }: { reduced?: boolean }) {
  const [text, setText] = useState<string>(examples[0]);
  useEffect(() => {
    if (reduced) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      const example = examples[Math.floor(elapsed / 5) % examples.length] ?? examples[0];
      setText(example.slice(0, Math.min(example.length, Math.floor((elapsed % 5) * 5))));
    }, 125);
    return () => window.clearInterval(timer);
  }, [reduced]);
  return (
    <group name="obj-hq-monitor" position={[0, 1.65, -0.2]}>
      <RoundedBox args={[1.7, 1, 0.12]} radius={0.08}>
        <meshStandardMaterial color="#111a28" metalness={0.55} />
      </RoundedBox>
      <Html transform position={[0, 0, 0.07]} distanceFactor={1.4}>
        <div className="w-72 rounded bg-panel-strong p-5 text-foreground shadow-2xl">
          <div className="text-[9px] font-bold uppercase text-primary">Fixing365 HQ</div>
          <div className="mt-2 font-display text-lg font-bold">What needs fixing?</div>
          <div className="mt-3 h-8 border-b border-border text-xs text-muted-foreground">
            {text}
            <span className="text-primary">|</span>
          </div>
        </div>
      </Html>
      <mesh position={[0, -0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.12, 0.55, 12]} />
        <meshStandardMaterial color="#677380" metalness={0.7} />
      </mesh>
    </group>
  );
}
function Clock() {
  const hour = useRef<THREE.Group>(null),
    minute = useRef<THREE.Group>(null),
    second = useRef<THREE.Group>(null);
  useFrame(() => {
    const d = new Date();
    if (hour.current)
      hour.current.rotation.z = (-((d.getHours() % 12) + d.getMinutes() / 60) * Math.PI) / 6;
    if (minute.current) minute.current.rotation.z = (-d.getMinutes() * Math.PI) / 30;
    if (second.current) second.current.rotation.z = (-d.getSeconds() * Math.PI) / 30;
  });
  const hand = (ref: React.RefObject<THREE.Group | null>, len: number, w: number, c: string) => (
    <group ref={ref}>
      <mesh position={[0, len / 2, 0.07]}>
        <boxGeometry args={[w, len, 0.025]} />
        <meshBasicMaterial color={c} />
      </mesh>
    </group>
  );
  return (
    <group name="obj-hq-live-clock" position={[-1.8, 2.7, -1.25]}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.55, 0.55, 0.08, 32]} />
        <meshStandardMaterial color="#ece7da" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * Math.PI) / 6;
        return (
          <mesh
            key={i}
            name={`obj-hq-clock-tick-${i + 1}`}
            position={[Math.sin(angle) * 0.44, Math.cos(angle) * 0.44, 0.06]}
            rotation-z={-angle}
          >
            <boxGeometry args={[0.025, 0.09, 0.025]} />
            <meshBasicMaterial color="#1a2432" />
          </mesh>
        );
      })}
      <group position={[0, 0, 0.04]}>
        {hand(hour, 0.3, 0.045, "#1a2432")}
        {hand(minute, 0.42, 0.035, "#1a2432")}
        {hand(second, 0.45, 0.018, "#ff7a1a")}
      </group>
      <mesh position={[0, 0, 0.12]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshBasicMaterial color="#1a2432" />
      </mesh>
    </group>
  );
}
function Calendar() {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setDate(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <group name="obj-hq-calendar" position={[1.8, 2.65, -1.22]}>
      <RoundedBox args={[1.2, 0.9, 0.08]} radius={0.04}>
        <meshStandardMaterial color="#e8e2d6" />
      </RoundedBox>
      <Text font={FONT_URL} position={[0, 0.25, 0.05]} fontSize={0.11} color="#ff7a1a">
        {date.toLocaleDateString(undefined, { month: "long" }).toUpperCase()}
      </Text>
      <Text font={FONT_URL} position={[0, -0.03, 0.05]} fontSize={0.28} color="#182334">
        {date.getDate().toString()}
      </Text>
      <Text font={FONT_URL} position={[0, -0.3, 0.05]} fontSize={0.09} color="#516072">
        {date.toLocaleDateString(undefined, { weekday: "long" }).toUpperCase()}
      </Text>
    </group>
  );
}
function DeskTools() {
  return (
    <group name="obj-hq-tools-tray" position={[1.38, 1.04, -0.25]}>
      <RoundedBox args={[0.9, 0.08, 0.42]} radius={0.04}>
        <meshStandardMaterial color="#263342" metalness={0.35} />
      </RoundedBox>
      <mesh name="obj-hq-tools-screwdriver" position={[-0.28, 0.09, 0]} rotation-z={-0.12}>
        <cylinderGeometry args={[0.035, 0.035, 0.5, 10]} />
        <meshStandardMaterial color="#e2a43c" metalness={0.35} />
      </mesh>
      <group name="obj-hq-tools-pliers" position={[-0.05, 0.1, 0]}>
        <mesh rotation-z={0.24}>
          <boxGeometry args={[0.05, 0.46, 0.04]} />
          <meshStandardMaterial color="#aeb8c1" metalness={0.8} />
        </mesh>
        <mesh rotation-z={-0.24}>
          <boxGeometry args={[0.05, 0.46, 0.04]} />
          <meshStandardMaterial color="#aeb8c1" metalness={0.8} />
        </mesh>
      </group>
      <RoundedBox
        name="obj-hq-tools-tape-measure"
        args={[0.22, 0.15, 0.2]}
        position={[0.25, 0.11, 0.08]}
        radius={0.04}
      >
        <meshStandardMaterial color="#f1b83f" />
      </RoundedBox>
      <RoundedBox
        name="obj-hq-tools-multimeter"
        args={[0.25, 0.08, 0.32]}
        position={[0.25, 0.11, -0.1]}
        radius={0.025}
      >
        <meshStandardMaterial color="#202936" metalness={0.25} />
      </RoundedBox>
    </group>
  );
}
export function HQDesk({
  onRequest,
  reduced = false,
}: {
  onRequest: () => void;
  reduced?: boolean;
}) {
  const [buttonHover, setButtonHover] = useState(false);
  return (
    <group name="station-fixing365-hq" position={[0, 0, -0.9]}>
      <Clock />
      <Calendar />
      <Text
        font={FONT_URL}
        name="fixing365-logo-3d"
        position={[0, 3.25, -1.25]}
        fontSize={0.45}
        color="#ff7a1a"
      >
        FIXING365
      </Text>
      <Text font={FONT_URL} position={[0, 2.9, -1.24]} fontSize={0.14} color="#f5f1e8">
        IF IT’S BROKEN, START HERE.
      </Text>
      <RoundedBox name="obj-hq-desk" args={[3.8, 0.18, 1.35]} position={[0, 0.9, 0]} radius={0.08}>
        <meshStandardMaterial color="#7d573d" roughness={0.5} />
      </RoundedBox>
      <LiveMonitor reduced={reduced} />
      <BoxDetails />
      <DeskTools />
      <group position={[1.25, 1.1, 0.2]}>
        <mesh name="obj-hq-coffee-cup">
          <cylinderGeometry args={[0.18, 0.15, 0.32, 16]} />
          <meshStandardMaterial color="#d8d5cb" roughness={0.4} />
        </mesh>
        <Steam reduced={reduced} />
      </group>
      <RoundedBox
        name="obj-hq-request-service-button"
        args={[1.15, 0.16, 0.45]}
        position={[0, 1.08, 0.5]}
        rotation-x={-0.08}
        radius={0.06}
        onPointerOver={(e) => {
          e.stopPropagation();
          setButtonHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setButtonHover(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRequest();
        }}
      >
        <meshStandardMaterial
          color="#ff7a1a"
          emissive="#ff7a1a"
          emissiveIntensity={buttonHover ? 0.75 : 0.3}
        />
      </RoundedBox>
      <Text
        font={FONT_URL}
        position={[0, 1.18, 0.58]}
        rotation-x={-Math.PI / 2 + 0.08}
        fontSize={0.12}
        color="#121b28"
      >
        REQUEST SERVICE
      </Text>
    </group>
  );
}
function BoxDetails() {
  return (
    <>
      <RoundedBox
        name="obj-hq-keyboard"
        args={[1.1, 0.06, 0.35]}
        position={[-0.75, 1.04, 0.4]}
        rotation-x={-0.05}
        radius={0.03}
      >
        <meshStandardMaterial color="#293442" metalness={0.4} />
      </RoundedBox>
      <RoundedBox
        name="obj-hq-diagnostic-tablet"
        args={[0.7, 0.05, 0.48]}
        position={[0.85, 1.04, 0.35]}
        radius={0.04}
      >
        <meshStandardMaterial color="#202b38" metalness={0.6} />
      </RoundedBox>
      <mesh name="obj-hq-mouse" position={[-1.4, 1.08, 0.36]}>
        <sphereGeometry args={[0.13, 12, 8]} />
        <meshStandardMaterial color="#4c5968" metalness={0.4} />
      </mesh>
    </>
  );
}
