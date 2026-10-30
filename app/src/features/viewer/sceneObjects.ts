import { Box3, Group, Mesh, Texture, Vector3, type Object3D } from 'three'
import { meshMaterials } from './modelMaterials'

/**
 * Wraps a loaded scene so its base sits on the origin, centered: AR places
 * the origin on the surface, whatever origin the file was made with.
 */
export function standOnOrigin(scene: Object3D): Object3D {
  const box = new Box3().setFromObject(scene)
  const center = box.getCenter(new Vector3())
  scene.position.sub(new Vector3(center.x, box.min.y, center.z))
  return new Group().add(scene)
}

/** Frees the GPU resources (geometries, materials, textures) of `root`. */
export function disposeObject(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    node.geometry.dispose()
    for (const material of meshMaterials(node)) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) value.dispose()
      }
      material.dispose()
    }
  })
}
