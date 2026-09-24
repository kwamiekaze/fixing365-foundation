import { useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { getZone, type ZoneId } from "@/config/world";
import { useWorld } from "./store";

const target = new THREE.Vector3();
const center = new THREE.Vector3();

/**
 * Streams one zone. The low-detail massing is always drawn (cheap, in the
 * main bundle). The detailed chunk is a separate code-split module that is
 * only fetched and mounted when the camera's focus comes within the zone's
 * load radius, and unmounted again when it moves well away (hysteresis
 * prevents thrashing at the boundary).
 */
export function ZoneSlot({
  id,
  low,
  Detail,
  onDetail,
}: {
  id: ZoneId;
  low: ReactNode;
  Detail: LazyExoticComponent<ComponentType>;
  onDetail?: ((id: ZoneId, loaded: boolean) => void) | undefined;
}) {
  const zone = getZone(id)!;
  const active = useWorld((s) => s.zone === id);
  const [near, setNear] = useState(active);
  const [ready, setReady] = useState(false);
  const acc = useRef(0);
  const controls = useThree((s) => s.controls) as unknown as { target?: THREE.Vector3 } | null;

  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 0.25) return;
    acc.current = 0;
    if (!controls?.target) return;
    target.copy(controls.target);
    center.set(...zone.center);
    const d = target.distanceTo(center);
    const next = near ? d < zone.loadRadius * 1.35 : d < zone.loadRadius;
    if (next !== near) setNear(next);
  });

  const show = near || active;
  useEffect(() => {
    if (!show) setReady(false);
  }, [show]);
  useEffect(() => onDetail?.(id, show && ready), [id, show, ready, onDetail]);

  return (
    <group name={`zone-${id}`}>
      {(!show || !ready) && <group name={`zone-${id}-low`}>{low}</group>}
      {show && (
        <Suspense fallback={null}>
          <group name={`zone-${id}-detail`}>
            <Detail />
            <Ready onReady={() => setReady(true)} />
          </group>
        </Suspense>
      )}
    </group>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => onReady(), [onReady]);
  return null;
}
