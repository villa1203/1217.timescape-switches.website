# Quick Start: Configuring Your 5 Models

This guide will walk you through configuring materials for your 5 different 3D switch models.

## 📋 Workflow Summary

For each of your 5 models, you'll:
1. Load the model in the browser
2. Inspect and identify parts
3. Configure materials in `modelMaterials.ts`
4. Test and refine

## 🚀 Step-by-Step Process

### Step 1: Prepare Your Model Files

Ensure all 5 `.glb` files are in `/public/`:
```
/public/
  ├── interrupteur.glb       (Model 1)
  ├── switch-model-2.glb     (Model 2)
  ├── switch-model-3.glb     (Model 3)
  ├── switch-model-4.glb     (Model 4)
  └── switch-model-5.glb     (Model 5)
```

### Step 2: For Each Model

#### 2.1 Load Model in Browser

Open your app with the model loaded, then open DevTools Console (F12).

#### 2.2 Inspect the Model

In the console, type:
```javascript
// Import the inspector
const { inspectModel, generateConfigTemplate } = await import('/app/utils/modelInspector.ts')

// Get reference to your loaded model (adjust based on your component)
const model = window.__THREE_MODEL__  // You may need to expose this

// Inspect all parts
inspectModel(model)

// Generate configuration template
generateConfigTemplate(model, 'switch-model-1')
```

This will output:
- A table of all meshes with names, colors, sizes
- A ready-to-use configuration template

#### 2.3 Identify Purple Parts

Look at the table and identify which parts should be purple in X-ray view.

Common patterns:
- **Internal mechanisms** (springs, levers) → Purple
- **Black plastic parts** → Purple
- **Metal contacts** → Orange or yellow highlight
- **Everything else** → Default frosted glass

#### 2.4 Update Configuration

Open `/app/config/modelMaterials.ts` and add your model configuration.

**Example for Model 1:**
```typescript
'switch-model-1': {
  name: 'Switch Model 1',
  description: 'Toggle switch with spring mechanism',

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
    // Spring mechanism - BLACK → PURPLE in X-ray
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

    // Internal lever - BLACK → PURPLE in X-ray
    {
      meshName: 'lever',
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

    // Add more parts as needed...
  ]
}
```

### Step 3: Test Your Configuration

#### 3.1 Update Your Component

In your Three.js component, use the configuration:

```typescript
import { findPartConfig } from '~/config/modelMaterials'

// When applying materials to meshes:
model.traverse((child) => {
  if (child.isMesh) {
    const config = findPartConfig('switch-model-1', child)

    if (config) {
      // Apply normal material
      const normalMat = new THREE.MeshStandardMaterial({
        color: config.normal.color,
        metalness: config.normal.metalness || 0,
        roughness: config.normal.roughness || 0.4,
        transparent: config.normal.transparent || false,
        opacity: config.normal.opacity || 1,
        emissive: config.normal.emissive || 0x000000,
        emissiveIntensity: config.normal.emissiveIntensity || 0,
      })

      child.material = normalMat
    }
  }
})
```

#### 3.2 Verify in Browser

1. Load the page
2. Check that parts have correct colors
3. Toggle to X-ray view
4. Verify purple parts glow correctly

### Step 4: Repeat for All 5 Models

## 🎨 Color Scheme Recommendations

Since you have different colors across models:

### Model Type A: Standard Black/White
```typescript
parts: [
  { /* Black parts → Purple X-ray */ },
  { /* White parts → Gray X-ray */ }
]
```

### Model Type B: Colored Variants
```typescript
parts: [
  { /* Mechanisms → Purple X-ray */ },
  { /* Colored housing → Tinted X-ray */ }
]
```

### Model Type C: Metallic Elements
```typescript
parts: [
  { /* Metal contacts → Orange X-ray */ },
  { /* Springs → Purple X-ray */ }
]
```

## 📝 Documentation Template for Your Team

For each model, document:

```markdown
## Model: switch-model-1

**File:** `/public/switch-model-1.glb`

**Description:** Toggle switch with internal spring mechanism

**Parts:**
- `spring` - Internal spring (Black → Purple in X-ray)
- `lever` - Toggle lever (Black → Purple in X-ray)
- `housing` - External case (White → Gray in X-ray)
- `led` - Indicator light (Green → Brighter green in X-ray)
- `contacts` - Metal contacts (Gray → Orange in X-ray)

**Special notes:**
- Spring glows purple when Shabbat is active
- LED brightness increases in X-ray view
```

## 🔧 Troubleshooting

### Parts not changing color?
```javascript
// In browser console:
import { findMeshesByName } from '~/utils/modelInspector'
const springs = findMeshesByName(model, 'spring')
console.log('Found springs:', springs)

// Check actual mesh names
springs.forEach(s => console.log(s.name))
```

### Don't know the exact mesh name?
```javascript
// Use partial matching
{
  meshName: 'spr',  // Matches 'spring', 'spring_001', etc.
}
```

### Small parts without names?
```javascript
// Find by size first
import { findMeshesBySize } from '~/utils/modelInspector'
findMeshesBySize(model, 0, 0.01)  // Find small parts

// Then configure by size range
{
  sizeRange: { min: 0, max: 0.01 },
  normal: { /* ... */ },
  xray: { /* ... */ }
}
```

## 📤 Sharing Configuration

When ready to share with another developer:

1. **Configuration file:** `/app/config/modelMaterials.ts`
2. **Documentation:** This file + `3D_MODEL_CONFIGURATION.md`
3. **Model files:** Share the `.glb` files
4. **Screenshots:** Take screenshots showing:
   - Normal view
   - X-ray view
   - Which parts are purple

## ✅ Checklist for Each Model

- [ ] Model file in `/public/`
- [ ] Model inspected with `inspectModel()`
- [ ] All mesh names documented
- [ ] Purple parts identified
- [ ] Configuration added to `modelMaterials.ts`
- [ ] Tested in browser (normal view)
- [ ] Tested in browser (X-ray view)
- [ ] Documentation updated
- [ ] Screenshots taken

## 🎯 Next Steps

After configuring all 5 models:

1. Create a model switcher UI component
2. Test transitions between models
3. Ensure X-ray effect works for all
4. Document any model-specific quirks
5. Share with your team

## Need Help?

- Check `/docs/3D_MODEL_CONFIGURATION.md` for detailed explanations
- Use inspector utilities in `/app/utils/modelInspector.ts`
- Look at example configurations in `modelMaterials.ts`
