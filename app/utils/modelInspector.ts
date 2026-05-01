/**
 * Model Inspector Utilities
 *
 * Helper functions to inspect and debug 3D models.
 * Use these in browser console to understand your model structure.
 *
 * Note: This file is designed to work with dynamically imported Three.js
 */

/**
 * Logs all meshes in a model with their names, material info, and sizes
 *
 * Usage in browser console after model is loaded:
 * const { inspectModel } = await import('/app/utils/modelInspector.ts')
 * inspectModel(window.__THREE_MODEL__)
 */
export async function inspectModel(model: any) {
  const THREE = await import('three')

  console.group('🔍 Model Inspector')
  console.log('Model:', model)

  const meshes: any[] = []

  model.traverse((child: any) => {
    if (child.isMesh) {
      const mesh = child
      const box = new THREE.Box3().setFromObject(mesh)
      const size = new THREE.Vector3()
      box.getSize(size)
      const volume = size.x * size.y * size.z

      const meshInfo = {
        name: mesh.name || '(unnamed)',
        materialName: mesh.material?.name || '(unnamed material)',
        color: mesh.material?.color?.getHexString?.() || 'N/A',
        metalness: mesh.material?.metalness ?? 'N/A',
        volume: volume.toFixed(6),
        size: {
          x: size.x.toFixed(3),
          y: size.y.toFixed(3),
          z: size.z.toFixed(3),
        }
      }

      meshes.push(meshInfo)
    }
  })

  // Sort by volume (largest first)
  meshes.sort((a, b) => parseFloat(b.volume) - parseFloat(a.volume))

  console.table(meshes)
  console.log(`Total meshes: ${meshes.length}`)
  console.groupEnd()

  return meshes
}

/**
 * Exports model structure as JSON for documentation
 */
export async function exportModelStructure(model: any): Promise<string> {
  const meshes: any[] = []

  model.traverse((child: any) => {
    if (child.isMesh) {
      const mesh = child
      meshes.push({
        name: mesh.name || '(unnamed)',
        material: mesh.material?.name || '(unnamed)',
        color: mesh.material?.color?.getHexString?.() || 'N/A',
      })
    }
  })

  return JSON.stringify(meshes, null, 2)
}

/**
 * Finds meshes matching a name pattern
 */
export async function findMeshesByName(model: any, pattern: string): Promise<any[]> {
  const matches: any[] = []

  model.traverse((child: any) => {
    if (child.isMesh) {
      const mesh = child
      if (mesh.name && mesh.name.toLowerCase().includes(pattern.toLowerCase())) {
        matches.push(mesh)
      }
    }
  })

  console.log(`Found ${matches.length} meshes matching "${pattern}":`, matches)
  return matches
}

/**
 * Finds meshes by volume range (useful for finding small parts like screws)
 */
export async function findMeshesBySize(
  model: any,
  minVolume: number,
  maxVolume: number
): Promise<Array<{ mesh: any; volume: number; name: string }>> {
  const THREE = await import('three')
  const matches: Array<{ mesh: any; volume: number; name: string }> = []

  model.traverse((child: any) => {
    if (child.isMesh) {
      const mesh = child
      const box = new THREE.Box3().setFromObject(mesh)
      const size = new THREE.Vector3()
      box.getSize(size)
      const volume = size.x * size.y * size.z

      if (volume >= minVolume && volume <= maxVolume) {
        matches.push({
          mesh,
          volume,
          name: mesh.name || '(unnamed)'
        })
      }
    }
  })

  matches.sort((a, b) => a.volume - b.volume)
  console.log(`Found ${matches.length} meshes with volume between ${minVolume} and ${maxVolume}:`)
  console.table(matches.map(m => ({ name: m.name, volume: m.volume.toFixed(6) })))

  return matches
}

/**
 * Highlights a mesh in the scene (changes its color temporarily)
 * Useful for identifying which mesh is which
 */
export async function highlightMesh(mesh: any, color: number = 0xff0000, duration: number = 2000) {
  const originalColor = mesh.material?.color?.clone()
  const originalEmissive = mesh.material?.emissive?.clone()
  const originalEmissiveIntensity = mesh.material?.emissiveIntensity

  // Set highlight color
  if (mesh.material?.color) {
    mesh.material.color.setHex(color)
  }
  if (mesh.material?.emissive) {
    mesh.material.emissive.setHex(color)
    mesh.material.emissiveIntensity = 1.0
  }

  console.log(`Highlighting mesh: ${mesh.name || '(unnamed)'}`)

  // Restore original color after duration
  setTimeout(() => {
    if (originalColor && mesh.material?.color) {
      mesh.material.color.copy(originalColor)
    }
    if (originalEmissive && mesh.material?.emissive) {
      mesh.material.emissive.copy(originalEmissive)
      mesh.material.emissiveIntensity = originalEmissiveIntensity
    }
    console.log(`Restored mesh: ${mesh.name || '(unnamed)'}`)
  }, duration)
}

/**
 * Generates a material configuration template based on the model
 * Copy this output into your modelMaterials.ts file
 */
export async function generateConfigTemplate(model: any, modelName: string): Promise<string> {
  const THREE = await import('three')
  const meshes: Array<{ name: string; materialName: string; volume: number }> = []

  model.traverse((child: any) => {
    if (child.isMesh) {
      const mesh = child
      const box = new THREE.Box3().setFromObject(mesh)
      const size = new THREE.Vector3()
      box.getSize(size)
      const volume = size.x * size.y * size.z

      meshes.push({
        name: mesh.name || '(unnamed)',
        materialName: mesh.material?.name || '(unnamed)',
        volume
      })
    }
  })

  // Generate TypeScript configuration
  let config = `'${modelName}': {\n`
  config += `  name: '${modelName}',\n`
  config += `  description: 'TODO: Add description',\n\n`
  config += `  defaults: {\n`
  config += `    normal: {\n`
  config += `      color: 0xffffff,\n`
  config += `      metalness: 0,\n`
  config += `      roughness: 0.4,\n`
  config += `    },\n`
  config += `    xray: {\n`
  config += `      color: 0xe0e0e0,\n`
  config += `      metalness: 0.0,\n`
  config += `      roughness: 0.7,\n`
  config += `      transparent: true,\n`
  config += `      opacity: 0.4,\n`
  config += `    }\n`
  config += `  },\n\n`
  config += `  parts: [\n`

  // Add commented templates for each unique mesh
  const uniqueMeshes = Array.from(new Set(meshes.map(m => m.name)))
  uniqueMeshes.forEach(meshName => {
    config += `    // {\n`
    config += `    //   meshName: '${meshName}',\n`
    config += `    //   normal: {\n`
    config += `    //     color: 0x000000,  // TODO: Set color\n`
    config += `    //     metalness: 0,\n`
    config += `    //     roughness: 0.5,\n`
    config += `    //   },\n`
    config += `    //   xray: {\n`
    config += `    //     color: 0x8210c1,  // TODO: Set X-ray color\n`
    config += `    //     metalness: 0.0,\n`
    config += `    //     roughness: 0.7,\n`
    config += `    //     transparent: true,\n`
    config += `    //     opacity: 0.4,\n`
    config += `    //   }\n`
    config += `    // },\n\n`
  })

  config += `  ]\n`
  config += `},\n`

  console.log('\n📋 Copy this configuration template:\n')
  console.log(config)

  return config
}

/**
 * Quick reference of all inspector functions
 */
export function help() {
  console.log(`
🔍 Model Inspector Help
=======================

Available functions:

1. inspectModel(model)
   → Shows all meshes with names, materials, sizes

2. findMeshesByName(model, 'pattern')
   → Find meshes matching a name pattern
   Example: findMeshesByName(model, 'spring')

3. findMeshesBySize(model, minVolume, maxVolume)
   → Find meshes by volume (useful for small parts)
   Example: findMeshesBySize(model, 0, 0.01)

4. highlightMesh(mesh, color, duration)
   → Temporarily highlight a mesh
   Example: highlightMesh(mesh, 0xff0000, 3000)

5. generateConfigTemplate(model, 'model-name')
   → Generate a configuration template
   Example: generateConfigTemplate(model, 'switch-v1')

6. exportModelStructure(model)
   → Export model structure as JSON

Usage example:
--------------
const model = yourThreeJsModel
await inspectModel(model)
const springs = await findMeshesByName(model, 'spring')
await highlightMesh(springs[0])
  `)
}

// Auto-display help in console when imported
if (typeof window !== 'undefined') {
  console.log('💡 Model Inspector loaded! Type help() for usage instructions.')
}
