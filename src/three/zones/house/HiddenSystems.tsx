import { Hotspot } from "../../world/Hotspot";
import { useXray } from "../../world/store";

/**
 * X-Ray mode: the walls fade to show what's inside. The hidden systems
 * (pipes and sewer line, wiring, ductwork) are offered as tappable
 * markers only; no glowing lines are drawn through the scene.
 */
export function HiddenSystems() {
  const on = useXray();
  if (!on) return null;
  return (
    <group name="xray-hidden-systems">
      <Hotspot id="xray-plumbing">
        <group name="xray-supply-and-drain" />
      </Hotspot>
      <Hotspot id="xray-wiring">
        <group name="xray-wiring" />
      </Hotspot>
      <Hotspot id="xray-ducts">
        <group name="xray-ductwork" />
      </Hotspot>
    </group>
  );
}
