# Integration Example: Using Material Configuration

This document shows how to integrate the material configuration system into your existing Three.js components.

## Before & After Comparison

### ❌ Before (Hardcoded in Component)

```typescript
// ThreeScene.vue - OLD APPROACH
model.traverse((child) => {
  if (child.isMesh) {
    const originalMat = child.material
    const volume = partSizes.get(child)
    let normalMaterial

    // Hardcoded logic for each part type
    if (volume <= smallThreshold) {
      normalMaterial = new THREE.MeshStandardMaterial({
        color: tinyColors[colorIndex % tinyColors.length],
        metalness: 0,
        roughness: 0.4,
      })
    } else if (originalMat.metalness === 1) {
      normalMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0,
        roughness: 0.5,
      })
    } else {
      normalMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.4,
      })
    }

    child.material = normalMaterial
  }
})
```

**Problems:**
- Hard to update colors
- Difficult to maintain across multiple models
- No clear separation of data and logic
- Another developer needs to understand the entire component

### ✅ After (Configuration-Based)

```typescript
// ThreeScene.vue - NEW APPROACH
import { findPartConfig } from '~/config/modelMaterials'

const modelName = 'switch-model-1'  // Could be a prop

model.traverse((child) => {
  if (child.isMesh) {
    // Get configuration for this specific mesh
    const config = findPartConfig(modelName, child)

    if (config) {
      // Apply normal view material
      const normalMaterial = new THREE.MeshStandardMaterial({
        color: config.normal.color,
        metalness: config.normal.metalness ?? 0,
        roughness: config.normal.roughness ?? 0.4,
        transparent: config.normal.transparent ?? false,
        opacity: config.normal.opacity ?? 1,
        emissive: config.normal.emissive ?? 0x000000,
        emissiveIntensity: config.normal.emissiveIntensity ?? 0,
        side: THREE.DoubleSide,
      })

      child.material = normalMaterial
      normalMaterials.set(child, normalMaterial)
    }
  }
})
```

**Benefits:**
- Colors centralized in `modelMaterials.ts`
- Easy to update without touching component code
- Clear separation: logic in component, data in config
- Another developer only needs to edit `modelMaterials.ts`

## Complete Integration Steps

### Step 1: Update Your Model Loading

```typescript
// ThreeScene.vue (or ThreeSceneAdvanced.vue)
<script setup>
import { ref, onMounted, watch } from 'vue'
import { findPartConfig } from '~/config/modelMaterials'

const props = defineProps({
  modelPath: {
    type: String,
    default: '/interrupteur.glb'
  },
  modelName: {
    type: String,
    default: 'interrupteur'  // Matches key in modelMaterials.ts
  },
  mode: {
    type: String,
    default: 'normal'
  }
})

// ... rest of your setup
</script>
```

### Step 2: Apply Materials on Load

```typescript
loader.load(
  props.modelPath,
  (gltf) => {
    model = gltf.scene

    // Apply normal materials
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true

        if (child.geometry) {
          child.geometry.computeVertexNormals()
        }

        // GET CONFIGURATION FROM CENTRALIZED FILE
        const config = findPartConfig(props.modelName, child)

        if (config) {
          // Create normal material from config
          const normalMaterial = new THREE.MeshStandardMaterial({
            color: config.normal.color,
            metalness: config.normal.metalness ?? 0,
            roughness: config.normal.roughness ?? 0.4,
            transparent: config.normal.transparent ?? false,
            opacity: config.normal.opacity ?? 1,
            emissive: config.normal.emissive ?? 0x000000,
            emissiveIntensity: config.normal.emissiveIntensity ?? 0,
            side: THREE.DoubleSide,
          })

          child.material = normalMaterial
          normalMaterials.set(child, normalMaterial)
        }
      }
    })

    // Clone for X-ray scene
    const xrayModel = model.clone()

    // Apply X-ray materials
    const xrayMeshes = []
    xrayModel.traverse((child) => {
      if (child.isMesh) xrayMeshes.push(child)
    })

    xrayMeshes.forEach((child, index) => {
      child.castShadow = true
      child.receiveShadow = true

      if (child.geometry) {
        child.geometry.computeVertexNormals()
      }

      // GET X-RAY CONFIGURATION
      const config = findPartConfig(props.modelName, child)

      if (config) {
        // Create X-ray material from config
        const xrayMaterial = new THREE.MeshStandardMaterial({
          color: config.xray.color,
          metalness: config.xray.metalness ?? 0,
          roughness: config.xray.roughness ?? 0.7,
          transparent: config.xray.transparent ?? true,
          opacity: config.xray.opacity ?? 0.4,
          emissive: config.xray.emissive ?? 0x000000,
          emissiveIntensity: config.xray.emissiveIntensity ?? 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        })

        child.material = xrayMaterial
        xrayMaterials.set(child, xrayMaterial)
      }
    })

    // Add to scenes
    normalScene.add(model)
    xrayScene.add(xrayModel)

    loading.value = false
  },
  undefined,
  (error) => {
    console.error('Error loading GLB:', error)
    loading.value = false
  }
)
```

### Step 3: Helper Function (Optional but Recommended)

Create a helper to reduce duplication:

```typescript
// Inside your component
function createMaterialFromConfig(config: MaterialConfig, isXray: boolean = false) {
  const matConfig = isXray ? config.xray : config.normal

  return new THREE.MeshStandardMaterial({
    color: matConfig.color,
    metalness: matConfig.metalness ?? 0,
    roughness: matConfig.roughness ?? (isXray ? 0.7 : 0.4),
    transparent: matConfig.transparent ?? isXray,
    opacity: matConfig.opacity ?? (isXray ? 0.4 : 1),
    emissive: matConfig.emissive ?? 0x000000,
    emissiveIntensity: matConfig.emissiveIntensity ?? 0,
    side: THREE.DoubleSide,
    depthWrite: isXray ? false : true,
  })
}

// Then use it like:
model.traverse((child) => {
  if (child.isMesh) {
    const config = findPartConfig(props.modelName, child)
    if (config) {
      child.material = createMaterialFromConfig(config, false)  // normal
      normalMaterials.set(child, child.material)
    }
  }
})

xrayMeshes.forEach((child) => {
  const config = findPartConfig(props.modelName, child)
  if (config) {
    child.material = createMaterialFromConfig(config, true)  // X-ray
    xrayMaterials.set(child, child.material)
  }
})
```

## Using with Multiple Models

### Dynamic Model Switching

```vue
<template>
  <div>
    <select v-model="currentModel" @change="loadModel">
      <option value="interrupteur">Model 1</option>
      <option value="switch-model-2">Model 2</option>
      <option value="switch-model-3">Model 3</option>
    </select>

    <ThreeScene
      :model-path="`/${currentModel}.glb`"
      :model-name="currentModel"
      :mode="viewMode"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentModel = ref('interrupteur')
const viewMode = ref('normal')

function loadModel() {
  // Model automatically reloads with new configuration
  console.log('Loading model:', currentModel.value)
}
</script>
```

## Testing Your Integration

### Test Checklist

1. **Load model** - Does it appear correctly?
2. **Check normal view** - Are colors correct?
3. **Toggle X-ray mode** - Do purple parts glow?
4. **Switch models** - Do different models use their configs?
5. **Console errors** - Any warnings about missing configs?

### Debug Mode

Add this to your component for debugging:

```typescript
onMounted(async () => {
  await init()

  // DEBUG: Log configuration being used
  if (import.meta.env.DEV) {
    const { getModelConfig } = await import('~/config/modelMaterials')
    const config = getModelConfig(props.modelName)
    console.log('Using model configuration:', config)

    // Expose model to window for inspection
    ;(window as any).__THREE_MODEL__ = model
    console.log('Model exposed as window.__THREE_MODEL__')
  }
})
```

Then in browser console:
```javascript
// Import inspector
const { inspectModel } = await import('/app/utils/modelInspector.ts')

// Inspect current model
inspectModel(window.__THREE_MODEL__)
```

## Common Patterns

### Pattern 1: All Black Parts → Purple in X-ray

```typescript
// In modelMaterials.ts
parts: [
  {
    // Match all black parts
    materialName: 'black',  // Or use actual material name
    normal: {
      color: 0x000000,
      metalness: 0,
      roughness: 0.5,
    },
    xray: {
      color: 0x8210c1,
      metalness: 0.0,
      roughness: 0.7,
      transparent: true,
      opacity: 0.4,
      emissive: 0x8210c1,
      emissiveIntensity: 0.8,
    }
  }
]
```

### Pattern 2: Small Parts (Screws, Pins) → Same Treatment

```typescript
parts: [
  {
    sizeRange: { min: 0, max: 0.01 },
    normal: {
      color: 0x666666,
      metalness: 0.7,
      roughness: 0.3,
    },
    xray: {
      color: 0x888888,
      metalness: 0.0,
      roughness: 0.6,
      transparent: true,
      opacity: 0.4,
    }
  }
]
```

### Pattern 3: LED/Indicator → Brighter in X-ray

```typescript
parts: [
  {
    meshName: 'led',
    normal: {
      color: 0x00ff00,
      metalness: 0,
      roughness: 0.4,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
    },
    xray: {
      color: 0x00ff00,
      metalness: 0,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8,
      emissive: 0x00ff00,
      emissiveIntensity: 1.2,  // Brighter!
    }
  }
]
```

## Performance Considerations

The configuration lookup is fast, but you can optimize further:

```typescript
// Cache configurations at component level
const configCache = new Map()

function getCachedConfig(modelName: string, mesh: Mesh) {
  const cacheKey = `${modelName}:${mesh.name || mesh.uuid}`

  if (!configCache.has(cacheKey)) {
    configCache.set(cacheKey, findPartConfig(modelName, mesh))
  }

  return configCache.get(cacheKey)
}

// Use cached version in your loops
model.traverse((child) => {
  if (child.isMesh) {
    const config = getCachedConfig(props.modelName, child)
    // ... apply materials
  }
})
```

## Summary

**Key Benefits of This Approach:**

1. ✅ **Centralized Configuration** - One file to edit
2. ✅ **Type-Safe** - TypeScript ensures correctness
3. ✅ **Documented** - Comments explain each part
4. ✅ **Reusable** - Same config for multiple views
5. ✅ **Maintainable** - Easy for other developers
6. ✅ **Flexible** - Match by name, material, or size
7. ✅ **Testable** - Inspector tools included

**What Your Developer Receives:**

- `/app/config/modelMaterials.ts` - The configuration file
- `/docs/3D_MODEL_CONFIGURATION.md` - Detailed guide
- `/docs/QUICK_START_5_MODELS.md` - Quick reference
- `/app/utils/modelInspector.ts` - Debug tools
- This integration example

They can:
- Update colors without touching component code
- Add new models easily
- Understand the system quickly
- Debug with provided tools
