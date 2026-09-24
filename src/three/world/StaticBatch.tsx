import { useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Collapses every static mesh inside it into one mesh per material.
 * Originals stay in the tree but are hidden, so pointer events (which
 * raycast hidden meshes too) keep working and React still owns them.
 * Anything under an object with userData.dynamic is left alone, so
 * animated parts stay live. `version` rebuilds the
 * batch when a child's state intentionally changes.
 */
export function StaticBatch({
  children,
  name = "static-batch",
  version = 0,
}: {
  children: ReactNode;
  name?: string;
  version?: string | number;
}) {
  const source = useRef<THREE.Group>(null);
  const out = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const src = source.current;
    const dst = out.current;
    if (!src || !dst) return;
    src.updateWorldMatrix(true, true);
    const inv = new THREE.Matrix4().copy(src.matrixWorld).invert();
    const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const hidden: THREE.Mesh[] = [];
    const isDynamic = (o: THREE.Object3D) => {
      for (let p: THREE.Object3D | null = o; p && p !== src; p = p.parent)
        if (p.userData["dynamic"]) return true;
      return false;
    };
    src.traverse((o) => {
      const m = o as THREE.Mesh;
      if (isDynamic(o)) return;
      if (
        !m.isMesh ||
        (m as unknown as THREE.InstancedMesh).isInstancedMesh ||
        Array.isArray(m.material)
      )
        return;
      if ((m.geometry as THREE.InstancedBufferGeometry).isInstancedBufferGeometry || !m.visible)
        return;
      const mat = m.material as THREE.Material;
      if (!(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) return;
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const key of Object.keys(g.attributes))
        if (!["position", "normal", "uv"].includes(key)) g.deleteAttribute(key);
      if (!g.attributes["uv"])
        g.setAttribute(
          "uv",
          new THREE.Float32BufferAttribute(
            new Float32Array(g.attributes["position"]!.count * 2),
            2,
          ),
        );
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      const list = groups.get(mat) ?? [];
      list.push(g);
      groups.set(mat, list);
      hidden.push(m);
    });
    const made: THREE.Mesh[] = [];
    groups.forEach((geos, mat) => {
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) return;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.name = `${name}-merged`;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.raycast = () => {};
      dst.add(mesh);
      made.push(mesh);
    });
    hidden.forEach((m) => (m.visible = false));
    return () => {
      hidden.forEach((m) => (m.visible = true));
      made.forEach((m) => {
        dst.remove(m);
        m.geometry.dispose();
      });
    };
  }, [name, version]);

  return (
    <group name={name}>
      <group ref={source}>{children}</group>
      <group ref={out} />
    </group>
  );
}
