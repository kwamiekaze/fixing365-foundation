import { B, M } from "../../world/kit";

export function BlockLow() {
  return (
    <group name="block-low">
      <B p={[25, 3.75, -2.5]} s={[12, 7.5, 7]} m={M.brick} />
      <B p={[27, 8, -3]} s={[2.4, 1, 1.6]} m={M.sidingLight} />
    </group>
  );
}
