# Color Reference & Quick Examples

Quick reference for common colors and material configurations.

## Color Hex Codes

### Basic Colors
```typescript
0xffffff  // White
0x000000  // Black
0xff0000  // Red
0x00ff00  // Green
0x0000ff  // Blue
0xffff00  // Yellow
0xff00ff  // Magenta
0x00ffff  // Cyan
```

### Grays
```typescript
0xf5f5f5  // Very Light Gray (almost white)
0xe0e0e0  // Light Gray
0xcccccc  // Medium-Light Gray
0x999999  // Medium Gray
0x666666  // Medium-Dark Gray
0x333333  // Dark Gray
0x1a1a1a  // Very Dark Gray (almost black)
```

### Purple Shades
```typescript
0x8210c1  // Main Purple (current X-ray purple)
0x9b30ff  // Lighter Purple
0x6a0dad  // Darker Purple
0xda70d6  // Orchid
0x9370db  // Medium Purple
0x8b008b  // Dark Magenta
```

### Metallic Colors
```typescript
0xc0c0c0  // Silver
0xd4af37  // Gold
0xb87333  // Copper
0x918a3e  // Brass
```

### Indicator/LED Colors
```typescript
0x00ff00  // Green LED
0xff0000  // Red LED
0xffa500  // Orange LED
0x0000ff  // Blue LED
0xffff00  // Yellow LED
```

## Complete Material Examples

### 1. White Plastic (Default)
```typescript
{
  color: 0xffffff,
  metalness: 0,
  roughness: 0.4,
}
```

### 2. Black Plastic → Purple X-ray ⭐ (Most Common)
```typescript
// Normal view
{
  color: 0x000000,
  metalness: 0,
  roughness: 0.5,
}

// X-ray view
{
  color: 0x8210c1,        // Purple
  metalness: 0.0,
  roughness: 0.7,
  transparent: true,
  opacity: 0.4,
  emissive: 0x8210c1,     // Glowing purple
  emissiveIntensity: 0.8,
}
```

### 3. Frosted Glass (Default X-ray)
```typescript
{
  color: 0xe0e0e0,        // Light gray
  metalness: 0.0,
  roughness: 0.7,         // High = frosted
  transparent: true,
  opacity: 0.4,
}
```

### 4. Chrome/Metallic Screw
```typescript
{
  color: 0xc0c0c0,        // Silver
  metalness: 0.9,         // Very metallic
  roughness: 0.2,         // Shiny
}
```

### 5. Brushed Metal
```typescript
{
  color: 0x888888,
  metalness: 0.7,
  roughness: 0.5,         // Medium roughness = brushed
}
```

### 6. Green LED Indicator
```typescript
// Normal view
{
  color: 0x00ff00,
  metalness: 0,
  roughness: 0.4,
  emissive: 0x00ff00,
  emissiveIntensity: 0.5,
}

// X-ray view (brighter)
{
  color: 0x00ff00,
  metalness: 0,
  roughness: 0.4,
  transparent: true,
  opacity: 0.8,
  emissive: 0x00ff00,
  emissiveIntensity: 1.2,  // Brighter in X-ray
}
```

### 7. Transparent Colored Plastic
```typescript
{
  color: 0xff0000,        // Red
  metalness: 0,
  roughness: 0.3,
  transparent: true,
  opacity: 0.6,
}
```

### 8. Rubber/Soft Material
```typescript
{
  color: 0x1a1a1a,        // Very dark gray
  metalness: 0,
  roughness: 0.9,         // Very rough = matte
}
```

### 9. Glowing Part (Like Neon)
```typescript
{
  color: 0xff00ff,
  metalness: 0,
  roughness: 0.5,
  emissive: 0xff00ff,
  emissiveIntensity: 1.5,  // Strong glow
}
```

### 10. Semi-Transparent Orange (Warning)
```typescript
{
  color: 0xff6600,
  metalness: 0,
  roughness: 0.4,
  transparent: true,
  opacity: 0.7,
  emissive: 0xff6600,
  emissiveIntensity: 0.3,
}
```

## Property Quick Reference

### Color (`color`)
- Hex number: `0xRRGGBB`
- Sets the base color of the material

### Metalness (`metalness`)
- Range: `0` to `1`
- `0` = Non-metallic (plastic, wood)
- `0.5` = Semi-metallic
- `1` = Fully metallic (chrome, steel)

### Roughness (`roughness`)
- Range: `0` to `1`
- `0` = Mirror smooth (very shiny)
- `0.3` = Smooth plastic
- `0.5` = Brushed metal
- `0.7` = Frosted/matte
- `1` = Very rough/diffuse

### Opacity (`opacity`)
- Range: `0` to `1`
- `0` = Completely invisible
- `0.4` = Semi-transparent (good for X-ray)
- `0.7` = Slightly transparent
- `1` = Fully opaque
- **Note:** Requires `transparent: true`

### Emissive (`emissive`)
- Hex number: `0xRRGGBB`
- Makes the material glow (self-illuminating)
- Usually set to same color as `color`

### Emissive Intensity (`emissiveIntensity`)
- Range: `0` to `2+`
- `0` = No glow
- `0.5` = Subtle glow
- `0.8` = Moderate glow (good for purple X-ray)
- `1.2` = Strong glow
- `2.0` = Very bright glow

## Matching Strategies Cheat Sheet

### By Name (Most Common)
```typescript
{
  meshName: 'spring',  // Matches any mesh with "spring" in name
  normal: { ... },
  xray: { ... }
}
```

### By Material
```typescript
{
  materialName: 'black_plastic',  // Matches by material name
  normal: { ... },
  xray: { ... }
}
```

### By Size (For Small Parts)
```typescript
{
  sizeRange: {
    min: 0,       // Minimum volume
    max: 0.01     // Maximum volume
  },
  normal: { ... },
  xray: { ... }
}
```

## Copy-Paste Templates

### Template A: Black Part → Glowing Purple
```typescript
{
  meshName: 'PART_NAME_HERE',
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

### Template B: Colored Part → Transparent in X-ray
```typescript
{
  meshName: 'PART_NAME_HERE',
  normal: {
    color: 0xff0000,  // Change color here
    metalness: 0,
    roughness: 0.4,
  },
  xray: {
    color: 0xff0000,  // Same color, just transparent
    metalness: 0.0,
    roughness: 0.7,
    transparent: true,
    opacity: 0.5,
  }
}
```

### Template C: LED/Indicator
```typescript
{
  meshName: 'PART_NAME_HERE',
  normal: {
    color: 0x00ff00,  // LED color
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
}
```

### Template D: Small Metal Parts (Screws)
```typescript
{
  sizeRange: { min: 0, max: 0.01 },  // Very small
  normal: {
    color: 0x666666,
    metalness: 0.8,
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
```

## Color Conversion

### From RGB to Hex
If you have RGB values (e.g., from a color picker):
- RGB(130, 16, 193) = Purple

**Conversion:**
1. Red: 130 = 0x82
2. Green: 16 = 0x10
3. Blue: 193 = 0xC1
4. Result: `0x8210C1`

**Or use online converter:** Google "RGB to hex converter"

### From Hex String to Number
- Hex string: `#8210C1`
- Hex number: `0x8210C1`

Just replace `#` with `0x`

## Common Combinations

### Internal Mechanism (Black → Purple)
```typescript
normal: { color: 0x000000, metalness: 0, roughness: 0.5 }
xray: { color: 0x8210c1, emissive: 0x8210c1, emissiveIntensity: 0.8, transparent: true, opacity: 0.4 }
```

### External Housing (White → Frosted Gray)
```typescript
normal: { color: 0xffffff, metalness: 0, roughness: 0.4 }
xray: { color: 0xe0e0e0, metalness: 0.0, roughness: 0.7, transparent: true, opacity: 0.4 }
```

### Metal Contact (Dark Gray → Orange Highlight)
```typescript
normal: { color: 0x333333, metalness: 0.8, roughness: 0.3 }
xray: { color: 0xff6600, metalness: 0.0, roughness: 0.5, transparent: true, opacity: 0.6 }
```

### LED On (Green Glow)
```typescript
normal: { color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.5 }
xray: { color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1.2, transparent: true, opacity: 0.8 }
```

## Tips

1. **Purple parts:** Use `emissive` + `emissiveIntensity` to make them glow
2. **X-ray view:** Always set `transparent: true` and `opacity: 0.3-0.5`
3. **Metallic parts:** High `metalness` (0.7-0.9), low `roughness` (0.2-0.4)
4. **Matte/Plastic:** Zero `metalness`, medium `roughness` (0.4-0.6)
5. **Glow effect:** Set `emissive` to same value as `color`

## Need More?

- **Complete guide:** `/docs/3D_MODEL_CONFIGURATION.md`
- **Workflow:** `/docs/QUICK_START_5_MODELS.md`
- **Code examples:** `/docs/INTEGRATION_EXAMPLE.md`
