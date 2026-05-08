# 3D Model Material Configuration System

## Overview

This is a complete system for managing materials (colors, transparency, effects) for your 5 different 3D switch models in a clean, maintainable way.

## What I've Created For You

### 1. Configuration File
**Location:** `/app/config/modelMaterials.ts`

This is the **single source of truth** for all material configurations. It contains:
- Type definitions for material properties
- Configuration for each model
- Helper functions to apply configurations

**This is the file you (or another developer) will edit** to change colors and materials.

### 2. Debug/Inspector Tools
**Location:** `/app/utils/modelInspector.ts`

Browser console utilities to help you identify parts in your 3D models:
- `inspectModel()` - See all mesh names and properties
- `findMeshesByName()` - Find specific parts
- `findMeshesBySize()` - Find small parts like screws
- `highlightMesh()` - Temporarily color a part to identify it
- `generateConfigTemplate()` - Auto-generate configuration templates

### 3. Documentation

Three comprehensive guides:

#### `/docs/3D_MODEL_CONFIGURATION.md`
Complete reference guide covering:
- How the system works
- All material properties explained
- Matching strategies (by name, material, size)
- Common configurations
- Color conversion

#### `/docs/QUICK_START_5_MODELS.md`
Step-by-step workflow for configuring your 5 models:
- How to inspect each model
- How to identify purple parts
- How to configure materials
- Checklist for each model

#### `/docs/INTEGRATION_EXAMPLE.md`
Code examples showing:
- Before/after comparison
- How to integrate into your Three.js components
- Dynamic model switching
- Performance optimization

## Quick Start

### For You (Configuration)

1. **Load your model in the browser**
2. **Open DevTools console (F12)**
3. **Inspect the model:**
   ```javascript
   const { inspectModel } = await import('/app/utils/modelInspector.ts')
   inspectModel(window.__THREE_MODEL__)
   ```
4. **Identify which parts should be purple**
5. **Edit `/app/config/modelMaterials.ts`:**
   ```typescript
   'your-model': {
     name: 'Your Model',
     parts: [
       {
         meshName: 'spring',  // The part name from step 3
         normal: {
           color: 0x000000,   // Black normally
         },
         xray: {
           color: 0x8210c1,   // Purple in X-ray
           emissive: 0x8210c1,
           emissiveIntensity: 0.8,
         }
       }
     ]
   }
   ```

### For Another Developer (Implementation)

1. **Read `/docs/INTEGRATION_EXAMPLE.md`**
2. **Import the configuration:**
   ```typescript
   import { findPartConfig } from '~/config/modelMaterials'
   ```
3. **Apply materials when loading model:**
   ```typescript
   model.traverse((child) => {
     if (child.isMesh) {
       const config = await findPartConfig('model-name', child, THREE)
       child.material = new THREE.MeshStandardMaterial(config.normal)
     }
   })
   ```

## File Structure

```
/app/
  /config/
    modelMaterials.ts          ← Main configuration file (edit this!)
  /utils/
    modelInspector.ts          ← Debug tools (use in browser console)
  /components/
    ThreeScene.vue             ← Your 3D viewer component

/docs/
  3D_MODEL_CONFIGURATION.md    ← Complete reference
  QUICK_START_5_MODELS.md      ← Workflow for 5 models
  INTEGRATION_EXAMPLE.md       ← Code examples
  README_3D_CONFIGURATION.md   ← This file
```

## Benefits of This System

✅ **Centralized** - All colors in one file
✅ **Clean** - Separation of data and logic
✅ **Typed** - TypeScript ensures correctness
✅ **Documented** - Complete guides for both roles
✅ **Debuggable** - Inspector tools included
✅ **Scalable** - Easy to add new models
✅ **Maintainable** - Clear for other developers

## Common Tasks

### Change a Part's Color
1. Open `/app/config/modelMaterials.ts`
2. Find your model configuration
3. Update the `color` value (hex number)
4. Save and refresh browser

### Add a New Model
1. Use inspector tools to identify parts
2. Copy an existing model configuration as template
3. Update part names and colors
4. Test in browser

### Make a Part Glow in X-ray
```typescript
xray: {
  color: 0x8210c1,
  emissive: 0x8210c1,           // Same as color
  emissiveIntensity: 0.8,       // 0.5-1.5 for brightness
}
```

### Find Small Parts (Screws, Pins)
```javascript
const { findMeshesBySize } = await import('/app/utils/modelInspector.ts')
const small = await findMeshesBySize(model, 0, 0.01)
```

## What You Need to Do Next

### Your 5 Models Workflow

For each of your 5 models:

1. **Identify the model file name** (e.g., `interrupteur.glb`)
2. **Choose a configuration name** (e.g., `'interrupteur'`)
3. **Load in browser and inspect:**
   ```javascript
   const { inspectModel, generateConfigTemplate } = await import('/app/utils/modelInspector.ts')
   await inspectModel(window.__THREE_MODEL__)
   await generateConfigTemplate(window.__THREE_MODEL__, 'interrupteur')
   ```
4. **Copy the generated template** into `modelMaterials.ts`
5. **Uncomment the parts** you want to customize
6. **Set colors:**
   - Black parts that should be purple: `color: 0x8210c1` in X-ray
   - Other colors as needed
7. **Test in browser**
8. **Repeat for models 2-5**

### Model Naming Suggestion

```typescript
// In modelMaterials.ts
export const MODEL_CONFIGS = {
  'interrupteur': { ... },      // Model 1
  'switch-model-2': { ... },    // Model 2
  'switch-model-3': { ... },    // Model 3
  'switch-model-4': { ... },    // Model 4
  'switch-model-5': { ... },    // Model 5
}
```

## Handing Off to Another Developer

Give them:
1. ✅ `/app/config/modelMaterials.ts` - The configuration
2. ✅ `/docs/INTEGRATION_EXAMPLE.md` - How to use it
3. ✅ `/docs/3D_MODEL_CONFIGURATION.md` - Reference
4. ✅ This README

Tell them:
> "All material configurations are in `/app/config/modelMaterials.ts`.
> Read `/docs/INTEGRATION_EXAMPLE.md` to see how to use `findPartConfig()` in the Three.js component.
> The system is already set up - you just need to apply it when loading models."

## Support

- **Configuration questions:** See `/docs/3D_MODEL_CONFIGURATION.md`
- **Workflow questions:** See `/docs/QUICK_START_5_MODELS.md`
- **Integration questions:** See `/docs/INTEGRATION_EXAMPLE.md`
- **Debugging:** Use the inspector tools in `/app/utils/modelInspector.ts`

## Summary

**What this system does:**
- Centralizes all material/color configurations in one file
- Provides tools to inspect and understand your 3D models
- Makes it easy to specify which parts are purple (or any color)
- Keeps your code clean and maintainable
- Makes handoff to another developer straightforward

**What you need to do:**
1. For each model, inspect it and identify part names
2. Configure which parts are purple in `modelMaterials.ts`
3. Hand off the configuration file and docs to your developer

**What the other developer needs to do:**
1. Read the integration example
2. Use `findPartConfig()` when loading models
3. Apply the returned configurations to materials

Everything is documented, typed, and ready to use! 🎨
