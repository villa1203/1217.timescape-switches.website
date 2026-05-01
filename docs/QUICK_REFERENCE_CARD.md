# Quick Reference Card - 3D Model Configuration

## 🎯 Complete Process for ONE Model (Elevator Example)

### Step 1: Created Files ✅
```
✅ Component: /app/components/ThreeElevator.vue
✅ Page: /app/pages/elevator.vue
✅ Config: 'elevator' in /app/config/modelMaterials.ts
```

### Step 2: Test It
```bash
npm run dev
```
Visit: `http://localhost:3000/elevator`

### Step 3: Inspect Model

Open DevTools Console (F12), paste:

```javascript
const { inspectModel } = await import('/app/utils/modelInspector.ts')
await inspectModel(window.__THREE_MODEL__)
```

**You'll see a table with all parts!**

### Step 4: Identify Purple Parts

Look at the table, decide which parts should glow purple in X-ray.

### Step 5: Configure Colors

Edit `/app/config/modelMaterials.ts`:

```typescript
'elevator': {
  name: 'Elevator Switch',
  parts: [
    {
      meshName: 'part_name_here',  // From inspection table
      normal: {
        color: 0x000000,  // Black normally
      },
      xray: {
        color: 0x8210c1,  // Purple in X-ray
        emissive: 0x8210c1,
        emissiveIntensity: 0.8,
      }
    }
  ]
}
```

### Step 6: Test & Refine

Save → Refresh browser → Check result!

---

## 📋 All Your Models

| Model | Component | Route | Config Key |
|-------|-----------|-------|------------|
| interrupteur.glb | ThreeScene | `/` | `'interrupteur'` |
| elevator.glb | ThreeElevator | `/elevator` | `'elevator'` ✅ |
| fridge.glb | ThreeFridge | `/fridge` | `'fridge'` |
| kettle.glb | ThreeKettle | `/kettle` | `'kettle'` |
| kosher_lamp.glb | ThreeKosherLamp | `/kosher-lamp` | `'kosher_lamp'` |
| kosherswitch.glb | ThreeKosherSwitch | `/kosher-switch` | `'kosherswitch'` |
| plugtimer.glb | ThreePlugTimer | `/plug-timer` | `'plugtimer'` |

---

## 🔍 Inspector Commands

### See All Parts
```javascript
const { inspectModel } = await import('/app/utils/modelInspector.ts')
await inspectModel(window.__THREE_MODEL__)
```

### Find Specific Part
```javascript
const { findMeshesByName } = await import('/app/utils/modelInspector.ts')
await findMeshesByName(window.__THREE_MODEL__, 'spring')
```

### Highlight Part (to identify it)
```javascript
const { highlightMesh } = await import('/app/utils/modelInspector.ts')
const parts = await findMeshesByName(window.__THREE_MODEL__, 'spring')
await highlightMesh(parts[0], 0xff0000, 3000)  // Red for 3 seconds
```

### Generate Config Template
```javascript
const { generateConfigTemplate } = await import('/app/utils/modelInspector.ts')
await generateConfigTemplate(window.__THREE_MODEL__, 'elevator')
```

---

## 🎨 Common Color Configs

### Black → Purple (Most Common)
```typescript
{
  meshName: 'mechanism',
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
```

### LED (Brighter in X-ray)
```typescript
{
  meshName: 'led',
  normal: {
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.5,
  },
  xray: {
    color: 0x00ff00,
    transparent: true,
    opacity: 0.8,
    emissive: 0x00ff00,
    emissiveIntensity: 1.2,
  }
}
```

---

## 🎨 Color Codes

```typescript
0xffffff  // White
0x000000  // Black
0x8210c1  // Purple (main)
0x9b30ff  // Purple (lighter)
0x00ff00  // Green
0xff0000  // Red
0xffa500  // Orange
0xe0e0e0  // Light gray
```

---

## 📁 File Locations

```
/app/config/modelMaterials.ts       ← Edit colors here
/app/utils/modelInspector.ts        ← Inspector tools
/app/components/ThreeElevator.vue   ← Component
/app/pages/elevator.vue             ← Test page
/public/elevator.glb                ← 3D model file
```

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| [ELEVATOR_EXAMPLE_WALKTHROUGH.md](ELEVATOR_EXAMPLE_WALKTHROUGH.md) | Complete step-by-step |
| [ALL_MODELS_OVERVIEW.md](ALL_MODELS_OVERVIEW.md) | All 7 models overview |
| [3D_MODEL_CONFIGURATION.md](3D_MODEL_CONFIGURATION.md) | Complete reference |
| [COLOR_REFERENCE.md](COLOR_REFERENCE.md) | Color codes & examples |
| [QUICK_START_5_MODELS.md](QUICK_START_5_MODELS.md) | Workflow guide |
| [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md) | Visual diagrams |

---

## ⚡ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Model doesn't load | Check `/public/model-name.glb` exists |
| Purple not showing | Add `emissive` + `emissiveIntensity` |
| Wrong part is purple | Check `meshName` matches exactly |
| Inspector undefined | Wait for model to load first |

---

## ✅ Checklist for Each Model

- [ ] Component created
- [ ] Test page created
- [ ] Config placeholder added
- [ ] Model loads in browser
- [ ] Inspected with console tools
- [ ] Purple parts identified
- [ ] Configuration updated
- [ ] Tested normal view
- [ ] Tested X-ray view
- [ ] Screenshots taken

---

## 🚀 Next Steps

1. **Test elevator** - Visit `/elevator`, run inspector
2. **Configure colors** - Edit `modelMaterials.ts`
3. **Repeat** - Do same for other 6 models

**Everything is ready to go!** 🎨
