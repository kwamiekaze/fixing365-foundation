import { B, M } from "../../world/kit";

export function HqLow() {
  return (
    <group name="hq-low">
      <B p={[-25, 2.1, -1]} s={[12, 4.2, 4.8]} m={M.navy} />
      <B p={[-25, 4.3, 1.45]} s={[12.4, 0.5, 0.12]} m={M.orange} />
    </group>
  );
}
