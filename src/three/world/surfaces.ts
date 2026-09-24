import * as THREE from "three";

/**
 * Photographic surface textures (generated with Higgsfield, stored in
 * public/f365/tex). Every wall, floor and roof in the scene is a scaled unit
 * box, so regular UVs would stretch a texture differently on every piece.
 * Instead each textured material samples its map in world space, picking the
 * plane from the surface normal (a cheap one-sample triplanar). That keeps
 * boards, tiles and shingles the same real-world size everywhere, and it
 * still works after StaticBatch merges meshes.
 *
 * Textures load in the background. Until one arrives (or if it fails) the
 * material keeps its flat colour, so nothing ever blocks the first frame.
 */

const loader = new THREE.TextureLoader();
const small =
  typeof window !== "undefined" &&
  (window.innerWidth < 768 || new URLSearchParams(window.location.search).has("lite"));

/** Tag lets several materials share one compiled shader program. */
const PROGRAM_KEY = "f365-worldmap";

function patch(mat: THREE.MeshStandardMaterial, scale: number) {
  const uScale = { value: scale };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms["uWorldScale"] = uScale;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;")
      .replace(
        "#include <project_vertex>",
        [
          "#include <project_vertex>",
          "vec4 wp4 = vec4(transformed, 1.0);",
          "#ifdef USE_INSTANCING",
          "wp4 = instanceMatrix * wp4;",
          "#endif",
          "vWPos = (modelMatrix * wp4).xyz;",
          "vWNrm = normalize(mat3(modelMatrix) * objectNormal);",
        ].join("\n"),
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;\nuniform float uWorldScale;",
      )
      .replace(
        "#include <map_fragment>",
        [
          "#ifdef USE_MAP",
          "vec3 an = abs(vWNrm);",
          "vec2 wuv = an.y > max(an.x, an.z) ? vWPos.xz : (an.x > an.z ? vWPos.zy : vWPos.xy);",
          "diffuseColor *= texture2D(map, wuv * uWorldScale);",
          "#endif",
        ].join("\n"),
      );
  };
  mat.customProgramCacheKey = () => `${PROGRAM_KEY}`;
}

/**
 * Give a shared material a world-space photographic map.
 * @param repeatsPerMetre how many copies of the texture fit in one metre.
 * @param tint multiplied with the texture, so one texture can serve a
 *   warmer or darker variant of the same surface.
 */
export function texturize(
  mat: THREE.MeshStandardMaterial,
  name: string,
  repeatsPerMetre: number,
  tint = "#ffffff",
) {
  if (typeof window === "undefined") return;
  patch(mat, repeatsPerMetre);
  const url = `/f365/tex/${name}${small ? "-512" : ""}.webp`;
  loader.load(
    url,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = small ? 2 : 8;
      mat.map = tex;
      mat.color.set(tint);
      mat.needsUpdate = true;
    },
    undefined,
    () => {
      // Missing texture: keep the flat colour, drop the patch cost.
      mat.onBeforeCompile = () => {};
      mat.needsUpdate = true;
    },
  );
}
