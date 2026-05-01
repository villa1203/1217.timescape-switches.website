# Complete Walkthrough: Configuring Elevator Model

This document shows the **complete process** for one model (elevator.glb) from start to finish.

## ✅ What's Already Done

1. ✅ Component created: `ThreeElevator.vue`
2. ✅ Test page created: `/elevator` route
3. ✅ Configuration placeholder added to `modelMaterials.ts`

## 🚀 Your Process: Step-by-Step

### Step 1: Start the Dev Server

```bash
npm run dev
```

### Step 2: Open the Elevator Page

Navigate to: `http://localhost:3000/elevator`

You should see the elevator model loading.

### Step 3: Open Browser DevTools

Press `F12` or right-click → Inspect

Go to the **Console** tab.

You should see a message:
```
🔍 Elevator model loaded! Use inspector tools in console.
```

### Step 4: Inspect the Model

In the console, paste this command:

```javascript
const { inspectModel } = await import('/app/utils/modelInspector.ts')
await inspectModel(window.__THREE_MODEL__)
```

**What you'll see:**
- A table with ALL parts in the model
- Columns: name, materialName, color, metalness, volume, size

**Example output:**
```
┌─────┬────────────────┬──────────────┬────────┬──────────┬──────────┐
│ idx │ name           │ materialName │ color  │ metalness│ volume   │
├─────┼────────────────┼──────────────┼────────┼──────────┼──────────┤
│ 0   │ housing        │ Material     │ ffffff │ 0        │ 2.450000 │
│ 1   │ button_mech    │ Material.001 │ 000000 │ 0        │ 0.125000 │
│ 2   │ spring         │ Material.002 │ 000000 │ 1        │ 0.008500 │
│ 3   │ led            │ Material.003 │ 00ff00 │ 0        │ 0.001200 │
│ 4   │ screw_1        │ Material.004 │ 808080 │ 0.8      │ 0.000350 │
└─────┴────────────────┴──────────────┴────────┴──────────┴──────────┘
```

### Step 5: Identify Purple Parts

Look at the table and **decide which parts should be purple in X-ray view**.

**Common purple parts:**
- Internal mechanisms (button_mech, spring, lever, etc.)
- Black plastic parts
- Moving parts
- Electrical contacts

**Example decision:**
- ✅ `button_mech` (black) → Purple
- ✅ `spring` (black, metallic) → Purple
- ❌ `housing` (white) → Default gray
- ❌ `led` (green) → Keep green (brighter in X-ray)
- ❌ `screw_1` (gray metal) → Default gray

### Step 6: Generate Configuration Template (Optional)

For a quick start, generate a template:

```javascript
const { generateConfigTemplate } = await import('/app/utils/modelInspector.ts')
await generateConfigTemplate(window.__THREE_MODEL__, 'elevator')
```

This will output a ready-to-use configuration with all parts commented out.

### Step 7: Edit modelMaterials.ts

Open `/app/config/modelMaterials.ts` and find the `'elevator'` section.

**Before:**
```typescript
'elevator': {
  name: 'Elevator Switch',
  description: 'Elevator control switch - configure parts after inspection',

  defaults: { /* ... */ },

  parts: [
    // TODO: Add specific parts after inspecting the model
  ]
}
```

**After (example with purple parts):**
```typescript
'elevator': {
  name: 'Elevator Switch',
  description: 'Elevator control switch with purple internal mechanism',

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
    // Button mechanism - BLACK → PURPLE in X-ray
    {
      meshName: 'button_mech',
      normal: {
        color: 0x000000,
        metalness: 0,
        roughness: 0.5,
      },
      xray: {
        color: 0x8210c1,  // Purple
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
        emissive: 0x8210c1,
        emissiveIntensity: 0.8,
      }
    },

    // Spring - BLACK METALLIC → PURPLE in X-ray
    {
      meshName: 'spring',
      normal: {
        color: 0x000000,
        metalness: 0,
        roughness: 0.5,
      },
      xray: {
        color: 0x8210c1,  // Purple
        metalness: 0.0,
        roughness: 0.7,
        transparent: true,
        opacity: 0.4,
        emissive: 0x8210c1,
        emissiveIntensity: 0.8,
      }
    },

    // LED - GREEN → BRIGHTER GREEN in X-ray
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
        emissiveIntensity: 1.2,  // Brighter in X-ray
      }
    },
  ]
}
```

### Step 8: Save and Refresh Browser

1. Save `modelMaterials.ts`
2. Refresh the browser at `/elevator`
3. **Check the result:**
   - Normal view: Should show configured colors
   - Hover over model: Purple parts should glow through the circle

### Step 9: Fine-Tune (If Needed)

If colors don't look right:

#### Test Individual Parts

Highlight a specific part to identify it:

```javascript
const { findMeshesByName, highlightMesh } = await import('/app/utils/modelInspector.ts')
const springs = await findMeshesByName(window.__THREE_MODEL__, 'spring')
await highlightMesh(springs[0], 0xff0000, 3000)  // Red for 3 seconds
```

#### Adjust Colors

- **Too bright:** Reduce `emissiveIntensity` (try 0.5)
- **Not visible:** Increase `emissiveIntensity` (try 1.2)
- **Wrong part:** Check `meshName` matches exactly
- **Different color:** Change the hex value

#### Common Adjustments

```typescript
// Make purple brighter
emissiveIntensity: 1.2  // instead of 0.8

// Make more transparent
opacity: 0.3  // instead of 0.4

// Different purple shade
color: 0x9b30ff  // lighter purple
```

### Step 10: Done! ✅

Your elevator model is now configured!

**Result:**
- ✅ Normal view shows your configured colors
- ✅ X-ray view shows purple glowing parts
- ✅ Configuration is in one file
- ✅ Easy to modify later

## 🔄 Repeat for Other Models

Now create components and configurations for:

1. ✅ **Elevator** (done)
2. **Fridge** → `ThreeFridge.vue` + config
3. **Kettle** → `ThreeKettle.vue` + config
4. **Kosher Lamp** → `ThreeKosherLamp.vue` + config
5. **Kosher Switch** → `ThreeKosherSwitch.vue` + config
6. **Plug Timer** → `ThreePlugTimer.vue` + config

**Component naming pattern:**
- `ThreeElevator.vue`
- `ThreeFridge.vue`
- `ThreeKettle.vue`
- `ThreeKosherLamp.vue`
- `ThreeKosherSwitch.vue`
- `ThreePlugTimer.vue`

## 📝 Quick Reference Commands

### Inspect Model
```javascript
const { inspectModel } = await import('/app/utils/modelInspector.ts')
await inspectModel(window.__THREE_MODEL__)
```

### Generate Config Template
```javascript
const { generateConfigTemplate } = await import('/app/utils/modelInspector.ts')
await generateConfigTemplate(window.__THREE_MODEL__, 'elevator')
```

### Find Parts by Name
```javascript
const { findMeshesByName } = await import('/app/utils/modelInspector.ts')
await findMeshesByName(window.__THREE_MODEL__, 'spring')
```

### Find Small Parts
```javascript
const { findMeshesBySize } = await import('/app/utils/modelInspector.ts')
await findMeshesBySize(window.__THREE_MODEL__, 0, 0.01)
```

### Highlight Part
```javascript
const { highlightMesh } = await import('/app/utils/modelInspector.ts')
// First find the part, then highlight it
const parts = await findMeshesByName(window.__THREE_MODEL__, 'spring')
await highlightMesh(parts[0], 0xff0000, 3000)
```

## 🎨 Color Quick Reference

```typescript
// Purple shades
0x8210c1  // Main purple (current)
0x9b30ff  // Lighter purple
0x6a0dad  // Darker purple

// Common colors
0xffffff  // White
0x000000  // Black
0xff0000  // Red
0x00ff00  // Green
0x0000ff  // Blue
0xffa500  // Orange

// Grays
0xe0e0e0  // Light gray (default X-ray)
0x808080  // Medium gray
0x333333  // Dark gray
```

## 🐛 Troubleshooting

### Model doesn't load
- Check `/public/elevator.glb` exists
- Check browser console for errors
- Verify component path is correct

### Inspector says "window.__THREE_MODEL__ is undefined"
- Wait for model to load (check for loader spinner)
- Refresh page and try again
- Check console for "model loaded" message

### Purple parts not showing
- Check `meshName` matches exactly (case-sensitive)
- Add `emissive` and `emissiveIntensity` to xray config
- Verify configuration is saved

### Wrong part is purple
- Use `highlightMesh` to verify which part is which
- Check mesh name in inspector table
- Update `meshName` in configuration

## 📚 Next Steps

After configuring elevator:

1. **Test thoroughly** - Check both normal and X-ray views
2. **Take screenshots** - Document which parts are purple
3. **Move to next model** - Repeat process for fridge, kettle, etc.
4. **Update documentation** - Note any model-specific quirks

## 🎯 Summary

**What you did:**
1. Created `ThreeElevator.vue` component
2. Created `/elevator` test page
3. Loaded model in browser
4. Inspected parts with console tools
5. Identified purple parts
6. Configured `modelMaterials.ts`
7. Tested and refined

**What you have:**
- Working 3D viewer for elevator
- Configuration system in place
- Debug tools ready
- Repeatable process for other models

**Next:** Repeat for your other 6 models! 🚀
