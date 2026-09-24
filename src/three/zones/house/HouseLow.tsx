import { B, M } from "../../world/kit";

/** Cheap massing shown while the detailed chunk streams in or when the camera is far away. */
export function HouseLow() {
  return (
    <group name="house-low">
      <B p={[-1.5, 1.6, -2]} s={[15, 3.2, 8]} m={M.sidingLight} />
      <B p={[8.75, 1.5, -2]} s={[5.5, 3, 8]} m={M.siding} />
      <B p={[8.75, 3.9, -2]} s={[5.8, 1.8, 8.6]} m={M.shingleDark} />
    </group>
  );
}
