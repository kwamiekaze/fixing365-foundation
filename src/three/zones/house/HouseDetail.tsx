import { useEffect } from "react";
import { XrayFader } from "../../world/kit";
import { BathUtility } from "./BathUtility";
import { Exterior } from "./Exterior";
import { HiddenSystems } from "./HiddenSystems";
import { Kitchen } from "./Kitchen";
import { Living } from "./Living";
import { Shell } from "./Shell";

/**
 * Detailed chunk for The House zone. Code-split: fetched only when the
 * camera focus is near the house. Each room is its own module so rooms can be
 * replaced by optimized GLBs one at a time.
 */
export default function HouseDetail() {
  return (
    <group name="house-detail">
      <XrayFader />
      <Shell />
      <Kitchen />
      <Living />
      <BathUtility />
      <Exterior />
      <HiddenSystems />
    </group>
  );
}
