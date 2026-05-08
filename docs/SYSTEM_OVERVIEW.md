# 3D Material Configuration System - Visual Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WORKFLOW                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Load model in browser                                   │
│  2. Open DevTools Console (F12)                            │
│  3. Run inspector:                                          │
│     > const { inspectModel } = await import(...)           │
│     > await inspectModel(window.__THREE_MODEL__)           │
│  4. See all part names in table                            │
│  5. Edit /app/config/modelMaterials.ts                     │
│  6. Save and refresh browser                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            /app/config/modelMaterials.ts                     │
│                  (SINGLE SOURCE OF TRUTH)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  export const MODEL_CONFIGS = {                             │
│    'interrupteur': {                                        │
│      parts: [                                               │
│        {                                                    │
│          meshName: 'spring',                               │
│          normal: { color: 0x000000 },  ← Black normally    │
│          xray: { color: 0x8210c1 }     ← Purple in X-ray   │
│        }                                                    │
│      ]                                                      │
│    }                                                        │
│  }                                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│               DEVELOPER'S WORKFLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  In ThreeScene.vue:                                         │
│                                                              │
│  import { findPartConfig } from '~/config/modelMaterials'  │
│                                                              │
│  model.traverse((child) => {                               │
│    if (child.isMesh) {                                     │
│      const config = await findPartConfig('interrupteur',  │
│                                           child, THREE)     │
│      child.material = new THREE.MeshStandardMaterial({    │
│        color: config.normal.color,                         │
│        metalness: config.normal.metalness,                 │
│        ...                                                  │
│      })                                                     │
│    }                                                        │
│  })                                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  RESULT IN BROWSER                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Normal View:        X-ray View:                           │
│  ┌───────────┐      ┌───────────┐                          │
│  │ ■ Black   │      │ ● Purple  │ ← Glowing purple        │
│  │ □ White   │      │ ◌ Gray    │ ← Frosted glass         │
│  │ ▣ Metal   │      │ ◐ Orange  │ ← Highlighted           │
│  └───────────┘      └───────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## File Relationships

```
📁 Your Project
│
├── 📁 app/
│   ├── 📁 config/
│   │   └── 📄 modelMaterials.ts ⭐ YOU EDIT THIS
│   │       │
│   │       ├── Type definitions
│   │       ├── Model configurations
│   │       └── Helper functions
│   │
│   ├── 📁 utils/
│   │   └── 📄 modelInspector.ts 🔍 USE IN BROWSER CONSOLE
│   │       │
│   │       ├── inspectModel()
│   │       ├── findMeshesByName()
│   │       ├── highlightMesh()
│   │       └── generateConfigTemplate()
│   │
│   └── 📁 components/
│       └── 📄 ThreeScene.vue 👨‍💻 DEVELOPER INTEGRATES HERE
│           │
│           └── Uses findPartConfig() to apply materials
│
└── 📁 docs/
    ├── 📄 README_3D_CONFIGURATION.md 📖 START HERE
    ├── 📄 QUICK_START_5_MODELS.md 🚀 YOUR WORKFLOW
    ├── 📄 3D_MODEL_CONFIGURATION.md 📚 COMPLETE REFERENCE
    ├── 📄 INTEGRATION_EXAMPLE.md 💻 FOR DEVELOPER
    ├── 📄 COLOR_REFERENCE.md 🎨 COLORS & EXAMPLES
    └── 📄 SYSTEM_OVERVIEW.md 📊 THIS FILE
```

## Data Flow

```
[Your 5 GLB Models]
        ↓
   Load in Browser
        ↓
   [Inspector Tools] ← YOU use these
        ↓
   Identify part names
        ↓
   [modelMaterials.ts] ← YOU edit this
        │
        │ Configuration stored here
        │
        ↓
   [findPartConfig()] ← DEVELOPER uses this
        │
        │ Returns material config for each mesh
        │
        ↓
   [ThreeScene.vue] ← DEVELOPER integrates here
        │
        │ Applies materials to meshes
        │
        ↓
   [Rendered 3D Model]
   - Normal view: Your configured colors
   - X-ray view: Purple glowing parts
```

## Workflow Diagram

### Your Process (Configuration)

```
┌──────────────┐
│ Model 1      │
│ (GLB file)   │
└──────┬───────┘
       ↓
┌──────────────────────────┐
│ Load in browser          │
│ Open DevTools            │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Run inspectModel()       │
│ See part names & sizes   │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Identify purple parts:   │
│ - spring                 │
│ - lever                  │
│ - mechanism              │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Edit modelMaterials.ts:  │
│                          │
│ 'model-1': {             │
│   parts: [               │
│     {                    │
│       meshName: 'spring',│
│       xray: {            │
│         color: 0x8210c1  │ ← Purple
│       }                  │
│     }                    │
│   ]                      │
│ }                        │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Test in browser          │
│ ✓ Looks good!            │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Repeat for models 2-5    │
└──────────────────────────┘
```

### Developer Process (Integration)

```
┌──────────────────────────┐
│ Receive:                 │
│ - modelMaterials.ts      │
│ - Documentation          │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Read INTEGRATION_        │
│ EXAMPLE.md               │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ In ThreeScene.vue:       │
│                          │
│ import {                 │
│   findPartConfig         │
│ }                        │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ When loading model:      │
│                          │
│ config = await           │
│   findPartConfig(...)    │
│                          │
│ Apply to material        │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Test all 5 models        │
│ ✓ All working!           │
└──────────────────────────┘
```

## Key Concepts Visualized

### Material Properties Effect

```
┌─────────────────────────────────────────────────────┐
│  Property          Low (0)         High (1)          │
├─────────────────────────────────────────────────────┤
│  metalness      Plastic ░░░░      Chrome ████       │
│  roughness      Mirror ▓▓▓▓       Matte ░░░░        │
│  opacity        Invisible         Solid ████        │
│  emissiveInt    No glow           Bright ✨✨       │
└─────────────────────────────────────────────────────┘
```

### Part Matching Strategies

```
┌──────────────────────────────────────────────────────┐
│  Strategy        When to Use         Priority        │
├──────────────────────────────────────────────────────┤
│  meshName       Known part names     🥇 First       │
│  materialName   Consistent materials 🥈 Second      │
│  sizeRange      Unnamed small parts  🥉 Third       │
└──────────────────────────────────────────────────────┘
```

### Configuration Hierarchy

```
Model Config
│
├── defaults
│   ├── normal ──┐
│   │           │ Applied to parts
│   └── xray ───┤ without specific
│               │ configuration
│               ↓
└── parts []
    ├── part 1 (spring)
    │   ├── normal ──┐
    │   │           │ Applied only to
    │   └── xray ───┤ this specific part
    │               ↓
    └── part 2 (lever)
        ├── normal ──┐
        │           │ Overrides defaults
        └── xray ───┘ for this part
```

## Example: Complete Model Configuration

```
Input (Your 3D Model)          Configuration                Output (Browser)
─────────────────────         ──────────────              ─────────────────

interrupteur.glb              modelMaterials.ts           Normal View:
│                             │                           ┌─────────────┐
├── housing (white)           'interrupteur': {           │ □ White     │
├── spring (black)            │                           │ ■ Black     │
├── lever (black)      →      │  parts: [          →      │ ■ Black     │
├── led (green)               │    { spring },            │ ● Green LED │
└── screws (metal)            │    { lever },             │ ◆ Metal     │
                              │    { led }                └─────────────┘
                              │  ]
                              │}                          X-ray View:
                                                          ┌─────────────┐
                                                          │ ◌ Gray      │
                                                          │ ✨ Purple!  │
                                                          │ ✨ Purple!  │
                                                          │ ✨ Bright!  │
                                                          │ ◇ Faded     │
                                                          └─────────────┘
```

## Color Palette Visual

```
Normal View Colors:
┌────┬────┬────┬────┬────┐
│▓▓▓▓│░░░░│████│▓▓▓▓│◆◆◆◆│
│Black│White│Metal│Gray│LED│
└────┴────┴────┴────┴────┘

X-ray View Colors:
┌────┬────┬────┬────┬────┐
│✨✨│◌◌◌◌│▓▓▓▓│░░░░│✨✨│
│Purple│Gray│Orange│Fade│Glow│
└────┴────┴────┴────┴────┘
```

## System Benefits

```
┌─────────────────────────────────────────────┐
│ ✅ BEFORE THIS SYSTEM                       │
├─────────────────────────────────────────────┤
│ ❌ Colors hardcoded in component            │
│ ❌ Hard to update                           │
│ ❌ Different code for each model            │
│ ❌ Developer must understand entire system  │
│ ❌ No documentation                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ✅ AFTER THIS SYSTEM                        │
├─────────────────────────────────────────────┤
│ ✅ Colors in one config file                │
│ ✅ Easy to update                           │
│ ✅ Same code for all models                 │
│ ✅ Clear separation of concerns             │
│ ✅ Complete documentation                   │
│ ✅ Debug tools included                     │
└─────────────────────────────────────────────┘
```

## Quick Reference

### What You Do
```
1. Load model → Inspect → Configure → Test
2. Edit: /app/config/modelMaterials.ts
3. Use: Inspector tools in browser console
```

### What Developer Does
```
1. Read documentation
2. Import findPartConfig()
3. Apply to materials when loading model
```

### What Gets Shared
```
📦 Package for Developer:
├── 📄 modelMaterials.ts (configuration)
├── 📄 INTEGRATION_EXAMPLE.md (how-to)
├── 📄 3D_MODEL_CONFIGURATION.md (reference)
└── 📄 COLOR_REFERENCE.md (colors)
```

## Next Steps

1. **Read:** `/docs/README_3D_CONFIGURATION.md`
2. **Follow:** `/docs/QUICK_START_5_MODELS.md`
3. **Configure:** `/app/config/modelMaterials.ts`
4. **Test:** Use inspector tools
5. **Share:** Give config + docs to developer

---

**Everything is documented, typed, and ready to use!** 🎨✨
