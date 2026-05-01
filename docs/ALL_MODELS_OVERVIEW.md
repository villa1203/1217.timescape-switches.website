# All 3D Models Overview

## Your 7 Models

Here are all your 3D models with their component names and configuration keys:

| GLB File | Component Name | Config Key | Status |
|----------|----------------|------------|--------|
| `interrupteur.glb` | `ThreeScene.vue` | `'interrupteur'` | ✅ Existing |
| `elevator.glb` | `ThreeElevator.vue` | `'elevator'` | ✅ Created |
| `fridge.glb` | `ThreeFridge.vue` | `'fridge'` | ⏳ To create |
| `kettle.glb` | `ThreeKettle.vue` | `'kettle'` | ⏳ To create |
| `kosher_lamp.glb` | `ThreeKosherLamp.vue` | `'kosher_lamp'` | ⏳ To create |
| `kosherswitch.glb` | `ThreeKosherSwitch.vue` | `'kosherswitch'` | ⏳ To create |
| `plugtimer.glb` | `ThreePlugTimer.vue` | `'plugtimer'` | ⏳ To create |

## Component Naming Convention

**Pattern:** `Three + ModelName.vue`

- ✅ Short and clear
- ✅ Consistent with existing `ThreeScene.vue`
- ✅ Easy to identify 3D components

**Examples:**
```
ThreeElevator.vue
ThreeFridge.vue
ThreeKettle.vue
ThreeKosherLamp.vue
ThreeKosherSwitch.vue
ThreePlugTimer.vue
```

## Configuration Keys

**Pattern:** Same as GLB filename (without `.glb`)

```typescript
// In modelMaterials.ts
export const MODEL_CONFIGS = {
  'interrupteur': { /* ... */ },
  'elevator': { /* ... */ },
  'fridge': { /* ... */ },
  'kettle': { /* ... */ },
  'kosher_lamp': { /* ... */ },
  'kosherswitch': { /* ... */ },
  'plugtimer': { /* ... */ },
}
```

## Test Pages

Create a page for each model to test:

| Route | File | Component Used |
|-------|------|----------------|
| `/` | `index.vue` | `ThreeScene` (interrupteur) |
| `/elevator` | `elevator.vue` | `ThreeElevator` |
| `/fridge` | `fridge.vue` | `ThreeFridge` |
| `/kettle` | `kettle.vue` | `ThreeKettle` |
| `/kosher-lamp` | `kosher-lamp.vue` | `ThreeKosherLamp` |
| `/kosher-switch` | `kosher-switch.vue` | `ThreeKosherSwitch` |
| `/plug-timer` | `plug-timer.vue` | `ThreePlugTimer` |

## File Structure

```
/public/
  ├── interrupteur.glb
  ├── elevator.glb
  ├── fridge.glb
  ├── kettle.glb
  ├── kosher_lamp.glb
  ├── kosherswitch.glb
  └── plugtimer.glb

/app/components/
  ├── ThreeScene.vue          (interrupteur)
  ├── ThreeElevator.vue       ✅
  ├── ThreeFridge.vue
  ├── ThreeKettle.vue
  ├── ThreeKosherLamp.vue
  ├── ThreeKosherSwitch.vue
  └── ThreePlugTimer.vue

/app/pages/
  ├── index.vue               (uses ThreeScene)
  ├── elevator.vue            ✅
  ├── fridge.vue
  ├── kettle.vue
  ├── kosher-lamp.vue
  ├── kosher-switch.vue
  └── plug-timer.vue

/app/config/
  └── modelMaterials.ts
      ├── 'interrupteur'
      ├── 'elevator'          ✅
      ├── 'fridge'
      ├── 'kettle'
      ├── 'kosher_lamp'
      ├── 'kosherswitch'
      └── 'plugtimer'
```

## Workflow for Each Model

### 1. Create Component

Copy `ThreeElevator.vue` and modify:
- Change GLB path: `'/model-name.glb'`
- Change config key: `'model-name'`
- Update console log message

### 2. Create Test Page

Copy `elevator.vue` and modify:
- Change component import/usage

### 3. Add Configuration

In `modelMaterials.ts`, add new model config:
```typescript
'model-name': {
  name: 'Display Name',
  description: 'Description',
  defaults: { /* ... */ },
  parts: []
}
```

### 4. Inspect & Configure

1. Visit `/model-name` in browser
2. Open DevTools Console
3. Run inspector: `inspectModel(window.__THREE_MODEL__)`
4. Identify purple parts
5. Update `parts` array in config
6. Test and refine

## Quick Create Template

For each new model, you need to change only **3 things**:

### In Component File (ThreeModelName.vue):
```javascript
// Line ~139: GLB path
loader.load(
  '/model-name.glb',  // ← CHANGE THIS

// Line ~169: Config key
const config = await findPartConfig('model-name', child, THREE)  // ← CHANGE THIS

// Line ~210: Config key (X-ray)
const config = await findPartConfig('model-name', child, THREE)  // ← CHANGE THIS
```

### In Test Page (model-name.vue):
```vue
<template>
  <div class="page-model">
    <div class="viewer-container">
      <ThreeModelName />  <!-- ← CHANGE THIS -->
    </div>
  </div>
</template>
```

### In modelMaterials.ts:
```typescript
'model-name': {  // ← CHANGE THIS
  name: 'Model Display Name',
  description: 'Description',
  defaults: { /* ... */ },
  parts: []
}
```

## Example: Creating ThreeFridge

### 1. Create Component
Copy `ThreeElevator.vue` → `ThreeFridge.vue`

Change these lines:
```diff
- loader.load('/elevator.glb',
+ loader.load('/fridge.glb',

- const config = await findPartConfig('elevator', child, THREE)
+ const config = await findPartConfig('fridge', child, THREE)

- console.log('🔍 Elevator model loaded!')
+ console.log('🔍 Fridge model loaded!')
```

### 2. Create Page
Copy `elevator.vue` → `fridge.vue`

```diff
<template>
  <div class="page-fridge">
    <div class="viewer-container">
-     <ThreeElevator />
+     <ThreeFridge />
    </div>
  </div>
</template>
```

### 3. Add Config
In `modelMaterials.ts`:
```typescript
'fridge': {
  name: 'Fridge Switch',
  description: 'Refrigerator switch configuration',
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
    // Add after inspection
  ]
}
```

### 4. Test
- Visit `/fridge`
- Inspect model
- Configure purple parts
- Done!

## Progress Tracking

Use this checklist:

- [x] **Interrupteur** (existing)
  - [x] Component
  - [x] Page
  - [x] Config

- [x] **Elevator**
  - [x] Component: `ThreeElevator.vue`
  - [x] Page: `/elevator`
  - [x] Config: `'elevator'`
  - [ ] Purple parts configured

- [ ] **Fridge**
  - [ ] Component: `ThreeFridge.vue`
  - [ ] Page: `/fridge`
  - [ ] Config: `'fridge'`
  - [ ] Purple parts configured

- [ ] **Kettle**
  - [ ] Component: `ThreeKettle.vue`
  - [ ] Page: `/kettle`
  - [ ] Config: `'kettle'`
  - [ ] Purple parts configured

- [ ] **Kosher Lamp**
  - [ ] Component: `ThreeKosherLamp.vue`
  - [ ] Page: `/kosher-lamp`
  - [ ] Config: `'kosher_lamp'`
  - [ ] Purple parts configured

- [ ] **Kosher Switch**
  - [ ] Component: `ThreeKosherSwitch.vue`
  - [ ] Page: `/kosher-switch`
  - [ ] Config: `'kosherswitch'`
  - [ ] Purple parts configured

- [ ] **Plug Timer**
  - [ ] Component: `ThreePlugTimer.vue`
  - [ ] Page: `/plug-timer`
  - [ ] Config: `'plugtimer'`
  - [ ] Purple parts configured

## Time Estimate

Per model (after setup):
- Create component: 2 minutes (copy & modify)
- Create page: 1 minute (copy & modify)
- Add config placeholder: 1 minute
- Inspect model: 2 minutes
- Configure colors: 5-10 minutes
- Test & refine: 5 minutes

**Total per model: ~15-20 minutes**
**All 6 remaining models: ~2 hours**

## Tips

1. **Work in batches:**
   - Create all components first
   - Then create all pages
   - Then configure colors

2. **Or work sequentially:**
   - Complete one model fully
   - Move to next
   - Less context switching

3. **Document as you go:**
   - Take screenshots
   - Note which parts are purple
   - Add to descriptions

4. **Test incrementally:**
   - Don't wait until all are done
   - Test each model as you configure it

## Next Steps

**Option A: Finish Elevator First**
1. Visit `/elevator` in browser
2. Run inspector commands
3. Configure purple parts in `modelMaterials.ts`
4. Test thoroughly
5. Move to next model

**Option B: Create All Components First**
1. Create all 6 remaining components
2. Create all 6 test pages
3. Add all config placeholders
4. Then inspect and configure each one

**Recommended: Option A** (finish one at a time for better focus)

## Ready to Go! 🚀

You now have:
- ✅ Complete example (Elevator)
- ✅ Clear naming convention
- ✅ File structure
- ✅ Workflow process
- ✅ Quick templates

Everything is ready to configure your 7 models! 🎨
