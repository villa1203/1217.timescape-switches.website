/**
 * 3D Model Material Configuration
 *
 * This file defines the material properties for different parts of 3D models.
 * Each model can have custom color schemes and material properties defined here.
 *
 * How to use:
 * 1. Load your model in a 3D viewer (like Blender or Three.js inspector)
 * 2. Identify the mesh names you want to customize
 * 3. Add them to the appropriate model configuration below
 * 4. Specify colors and material properties
 */

export type MaterialConfig = {
  color: number          // Hex color (e.g., 0xff0000 for red)
  metalness?: number     // 0-1, how metallic the material appears
  roughness?: number     // 0-1, surface roughness (0=mirror, 1=matte)
  transparent?: boolean  // Whether the material is transparent
  opacity?: number       // 0-1, transparency level
  emissive?: number      // Hex color for glow/emission
  emissiveIntensity?: number // 0+, strength of emission
}

export type ModelPartConfig = {
  // Mesh name or pattern to match
  meshName?: string
  // Alternative: match by material name
  materialName?: string
  // Alternative: match by size (for unnamed parts)
  sizeRange?: {
    min: number  // Minimum volume
    max: number  // Maximum volume
  }
  // Material properties for normal view
  normal: MaterialConfig
  // Material properties for X-ray view
  xray: MaterialConfig
}

export type ModelConfig = {
  name: string
  description: string
  // Default materials (applied to parts not specified below)
  defaults: {
    normal: MaterialConfig
    xray: MaterialConfig
  }
  // Specific part configurations
  parts: ModelPartConfig[]
}

/**
 * Model Configurations
 * Add your models here with their specific material configurations
 */
export const MODEL_CONFIGS: Record<string, ModelConfig> = {

  // Example: Main switch model (interrupteur.glb)
  'interrupteur': {
    name: 'Interrupteur',
    description: 'Main light switch model',

    defaults: {
      // Default normal view: white plastic
      normal: {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.4,
      },
      // Default X-ray view: frosted gray glass
      xray: {
        color: 0xe0e0e0,
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
      }
    },

    parts: [
      // Example: Black mechanical parts become purple in X-ray
      {
        meshName: 'mechanism_part',  // Replace with actual mesh name
        normal: {
          color: 0x000000,  // Black in normal view
          metalness: 0,
          roughness: 0.5,
        },
        xray: {
          color: 0x8210c1,  // Purple in X-ray view
          metalness: 0.0,
          roughness: 0.7,
          transparent: true,
          opacity: 0.4,
          emissive: 0x8210c1,
          emissiveIntensity: 0.8,  // Glowing purple
        }
      },

      // Example: Small screws
      {
        meshName: 'screw',
        normal: {
          color: 0x333333,  // Dark gray
          metalness: 0.8,
          roughness: 0.3,
        },
        xray: {
          color: 0x666666,
          metalness: 0.0,
          roughness: 0.7,
          transparent: true,
          opacity: 0.3,
        }
      },

      // Example: LED indicator
      {
        meshName: 'led',
        normal: {
          color: 0x00ff00,  // Green
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
          opacity: 0.6,
          emissive: 0x00ff00,
          emissiveIntensity: 0.8,
        }
      },
    ]
  },

  // Elevator switch
  'elevator': {
    name: 'Elevator Switch',
    description: 'Elevator control switch - configure parts after inspection',

    defaults: {
      normal: {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.4,
      },
      xray: {
        color: 0xe0e0e0,
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
      }
    },

    parts: [
      // TODO: Add specific parts after inspecting the model
      // Example configuration (uncomment and modify after inspection):
      // {
      //   meshName: 'mechanism',
      //   normal: {
      //     color: 0x000000,
      //     metalness: 0,
      //     roughness: 0.5,
      //   },
      //   xray: {
      //     color: 0x8210c1,  // Purple
      //     metalness: 0.0,
      //     roughness: 0.7,
      //     transparent: true,
      //     opacity: 0.4,
      //     emissive: 0x8210c1,
      //     emissiveIntensity: 0.8,
      //   }
      // },
    ]
  },

  'model_3': {
    name: 'Model 3',
    description: 'Description of third model',

    defaults: {
      normal: {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.4,
      },
      xray: {
        color: 0xe0e0e0,
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
      }
    },

    parts: []
  },

  'model_4': {
    name: 'Model 4',
    description: 'Description of fourth model',

    defaults: {
      normal: {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.4,
      },
      xray: {
        color: 0xe0e0e0,
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
      }
    },

    parts: []
  },

  'model_5': {
    name: 'Model 5',
    description: 'Description of fifth model',

    defaults: {
      normal: {
        color: 0xffffff,
        metalness: 0,
        roughness: 0.4,
      },
      xray: {
        color: 0xe0e0e0,
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
      }
    },

    parts: []
  },
}

/**
 * Helper function to get model configuration
 */
export function getModelConfig(modelName: string): ModelConfig | null {
  return MODEL_CONFIGS[modelName] || null
}

/**
 * Helper function to find matching part configuration
 *
 * Note: Size-based matching requires Three.js to be loaded.
 * Pass the THREE object if you want to use size-based matching.
 */
export async function findPartConfig(
  modelName: string,
  mesh: any,
  THREE?: any
): Promise<{ normal: MaterialConfig; xray: MaterialConfig } | null> {
  const config = getModelConfig(modelName)
  if (!config) return null

  // Try to find a matching part configuration
  for (const part of config.parts) {
    // Match by mesh name
    if (part.meshName && mesh.name && mesh.name.includes(part.meshName)) {
      return { normal: part.normal, xray: part.xray }
    }

    // Match by material name
    if (part.materialName && mesh.material?.name && mesh.material.name.includes(part.materialName)) {
      return { normal: part.normal, xray: part.xray }
    }

    // Match by size (volume) - requires THREE to be passed
    if (part.sizeRange && mesh.geometry && THREE) {
      try {
        const box = new THREE.Box3().setFromObject(mesh)
        const size = new THREE.Vector3()
        box.getSize(size)
        const volume = size.x * size.y * size.z
        if (volume >= part.sizeRange.min && volume <= part.sizeRange.max) {
          return { normal: part.normal, xray: part.xray }
        }
      } catch (e) {
        // Silently fail if THREE is not available
        console.warn('Size-based matching requires THREE to be passed to findPartConfig')
      }
    }
  }

  // Return defaults if no match found
  return { normal: config.defaults.normal, xray: config.defaults.xray }
}
