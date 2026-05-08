# 3D Model Material Configuration Guide

This guide explains how to configure materials (colors, transparency, glow effects) for different parts of your 3D models.

## Overview

All model configurations are centralized in `/app/config/modelMaterials.ts`. This approach:
- ✅ Keeps all material settings in one place
- ✅ Makes it easy to update colors without touching component code
- ✅ Allows different configurations per model
- ✅ Supports both normal view and X-ray view materials

## Quick Start

### Step 1: Identify Your Model Parts

Before configuring materials, you need to know the names of the parts in your 3D model.

#### Method A: Using Three.js Inspector (Recommended)

1. Open your model in the browser with the 3D viewer
2. Open browser DevTools (F12)
3. In the console, type:
```javascript
// This will log all mesh names in your model
scene.traverse((child) => {
  if (child.isMesh) {
    console.log('Mesh name:', child.name, '| Material:', child.material?.name)
  }
})
```

#### Method B: Using Blender

1. Open your `.glb` file in Blender
2. Look at the Outliner panel (top right)
3. Note down the names of objects you want to customize

### Step 2: Configure Your Model

Open `/app/config/modelMaterials.ts` and add/edit your model configuration:

```typescript
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'your-model-name': {
    name: 'Display Name',
    description: 'Brief description of this model',

    // Default materials for parts not specifically configured
    defaults: {
      normal: {
        color: 0xffffff,  // White plastic
        metalness: 0,
        roughness: 0.4,
      },
      xray: {
        color: 0xe0e0e0,  // Light gray frosted glass
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
      }
    },

    // Specific part configurations
    parts: [
      {
        meshName: 'part_name_from_step_1',
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
          emissive: 0x8210c1,      // Glow color
          emissiveIntensity: 0.8,  // Glow strength
        }
      },
      // Add more parts here...
    ]
  }
}
```

## Material Properties Explained

### Color (`color`)
- Hex number representing RGB color
- Examples:
  - `0xffffff` = White
  - `0x000000` = Black
  - `0xff0000` = Red
  - `0x00ff00` = Green
  - `0x0000ff` = Blue
  - `0x8210c1` = Purple

**How to convert colors:**
- From hex string: `#8210c1` → `0x8210c1`
- From RGB: Use an online converter (Google "RGB to hex")

### Metalness (`metalness`)
- Range: 0 to 1
- `0` = Non-metallic (plastic, wood, etc.)
- `1` = Fully metallic (chrome, steel, etc.)
- `0.5` = Semi-metallic

### Roughness (`roughness`)
- Range: 0 to 1
- `0` = Mirror smooth (very shiny)
- `0.4` = Smooth plastic
- `0.7` = Matte/frosted
- `1` = Very rough/diffuse

### Transparency (`transparent`, `opacity`)
- `transparent: true` enables transparency
- `opacity`: 0 (invisible) to 1 (fully opaque)
- Example: `opacity: 0.4` = 40% opaque

### Glow/Emission (`emissive`, `emissiveIntensity`)
- `emissive`: Color of the glow (hex number)
- `emissiveIntensity`: Brightness (0 = no glow, higher = brighter)
- Example for LED effect:
  ```typescript
  emissive: 0x00ff00,        // Green glow
  emissiveIntensity: 0.8     // Bright
  ```

## Matching Parts

You have three ways to match parts in your model:

### 1. By Mesh Name (Most Common)
```typescript
{
  meshName: 'spring_mechanism',
  normal: { /* ... */ },
  xray: { /* ... */ }
}
```
This matches any mesh whose name contains "spring_mechanism".

### 2. By Material Name
```typescript
{
  materialName: 'metal_material',
  normal: { /* ... */ },
  xray: { /* ... */ }
}
```
This matches any mesh with a material name containing "metal_material".

### 3. By Size (For Unnamed Parts)
```typescript
{
  sizeRange: {
    min: 0,      // Minimum volume
    max: 0.01    // Maximum volume (small parts)
  },
  normal: { /* ... */ },
  xray: { /* ... */ }
}
```
Useful for matching small parts like screws or LEDs when they don't have names.

## Common Configurations

### White Plastic Part (Default)
```typescript
normal: {
  color: 0xffffff,
  metalness: 0,
  roughness: 0.4,
}
```

### Black Mechanical Part → Purple X-ray
```typescript
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
```

### LED Indicator (Green)
```typescript
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
  opacity: 0.6,
  emissive: 0x00ff00,
  emissiveIntensity: 0.8,  // Brighter in X-ray
}
```

### Metallic Screw
```typescript
normal: {
  color: 0x333333,  // Dark gray
  metalness: 0.8,
  roughness: 0.3,
},
xray: {
  color: 0x666666,  // Lighter gray
  metalness: 0.0,
  roughness: 0.7,
  transparent: true,
  opacity: 0.3,
}
```

### Frosted Glass
```typescript
normal: {
  color: 0xe0e0e0,
  metalness: 0.0,
  roughness: 0.7,
  transparent: true,
  opacity: 0.4,
}
```

## Example: Complete Model Configuration

Here's a complete example for a light switch with 5 different parts:

```typescript
'light-switch-v1': {
  name: 'Light Switch V1',
  description: 'Standard wall-mounted light switch',

  defaults: {
    normal: {
      color: 0xffffff,    // White plastic body
      metalness: 0,
      roughness: 0.4,
    },
    xray: {
      color: 0xe0e0e0,    // Frosted gray
      metalness: 0.0,
      roughness: 0.7,
      transparent: true,
      opacity: 0.4,
    }
  },

  parts: [
    // Spring mechanism (black → purple in X-ray)
    {
      meshName: 'spring',
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
    },

    // Metal contacts (dark gray → visible in X-ray)
    {
      meshName: 'contact',
      normal: {
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.3,
      },
      xray: {
        color: 0xff6600,  // Orange highlight in X-ray
        metalness: 0.0,
        roughness: 0.5,
        transparent: true,
        opacity: 0.6,
      }
    },

    // LED indicator
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
        emissiveIntensity: 1.0,
      }
    },

    // Mounting screws (small parts)
    {
      sizeRange: {
        min: 0,
        max: 0.005,  // Very small volume
      },
      normal: {
        color: 0x666666,
        metalness: 0.7,
        roughness: 0.4,
      },
      xray: {
        color: 0x888888,
        metalness: 0.0,
        roughness: 0.6,
        transparent: true,
        opacity: 0.4,
      }
    },

    // Rocker/toggle (the part you press)
    {
      meshName: 'rocker',
      normal: {
        color: 0xf5f5f5,  // Off-white
        metalness: 0,
        roughness: 0.3,
      },
      xray: {
        color: 0xdddddd,
        metalness: 0.0,
        roughness: 0.6,
        transparent: true,
        opacity: 0.5,
      }
    },
  ]
}
```

## Tips for Your 5 Models

Since you have 5 models with different colors and specific purple parts:

1. **Create one configuration per model** in `modelMaterials.ts`
2. **Name them clearly**: `model-1`, `switch-type-a`, etc.
3. **Document which parts are purple** in the `description` field
4. **Use consistent naming** for similar parts across models

### Recommended Workflow:

1. Open model 1 in browser
2. Inspect and note all mesh names
3. Create configuration in `modelMaterials.ts`
4. Test in browser
5. Repeat for models 2-5

## Troubleshooting

### "My part isn't changing color"
- Check the mesh name is correct (case-sensitive)
- Try using partial name matching (e.g., `spring` instead of `spring_mechanism_001`)
- Use browser console to log all mesh names

### "Colors look wrong"
- Make sure hex format is `0x` not `#`
- Check RGB values in a color picker
- Adjust `roughness` - it affects how colors appear

### "Glow isn't showing"
- Set `emissive` to the same color you want to glow
- Increase `emissiveIntensity` (try 0.8 to 1.5)
- Make sure the scene has proper lighting

## Next Steps

After configuration:
1. Update your Three.js component to use `findPartConfig()` helper
2. Test each model individually
3. Document any special cases
4. Share `modelMaterials.ts` with other developers

Need help? Check the inline comments in `modelMaterials.ts` or reach out!
