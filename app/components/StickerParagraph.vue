<script setup lang="ts">
import { ref, computed, onMounted, watch, useId } from 'vue'

const props = defineProps<{
  text:          string
  color?:        string
  variant?:      'primary' | 'secondary'
  stroke_width?: number  // outer blob thickness — bigger = words connect more. default 35
  font_size?:    number  // px. default 24
  line_height?:  number  // em multiplier between lines. default 1.2
  max_width?:    number  // px — wrap width. default 600
  border_size?:  number  // visible colored border in px. default 6 — smaller = more white
}>()

const uid      = useId()
const lines    = ref<string[]>([props.text])
const svgWidth = ref(600)

const strokeColor = computed(() => {
  if (props.color)                     return props.color
  if (props.variant === 'secondary')   return 'var(--app-color-secondary)'
  return 'var(--app-color-primary)'
})

const bgColor = '#ffffff'
const fs  = computed(() => props.font_size    ?? 24)
const sw  = computed(() => props.stroke_width ?? 35)
const lh  = computed(() => props.line_height  ?? 1.2)
const PAD = 30    // same x-offset StickerText uses

// y of the first line's baseline (same as StickerText)
const textY = computed(() => fs.value * 1.1)

// Total SVG height: first baseline + each extra line + stroke buffer below
const svgHeight = computed(() =>
  textY.value + (lines.value.length - 1) * lh.value * fs.value + sw.value * 2
)

// White interior stroke — covers the glow gradient zone, leaving only `border_size` px
// of colored border visible. Clamped to min 2px so inter-letter gaps are always filled.
const border         = computed(() => props.border_size ?? 6)
const whiteInteriorSW = computed(() => Math.max(sw.value - border.value, 2))

// ── Line measurement ─────────────────────────────────────────────────────────
//
// We create a hidden SVG text element, fill it word-by-word, and read getBBox().width.
// This uses the real font metrics (same method StickerText uses for its width).
// The hidden SVG is appended to <body> so it inherits the page's font-family.

function computeLines() {
  if (!import.meta.client || !props.text) return

  const ns    = 'http://www.w3.org/2000/svg'
  const svg   = document.createElementNS(ns, 'svg')
  const probe = document.createElementNS(ns, 'text')

  probe.setAttribute('font-size',   String(fs.value))
  probe.setAttribute('font-weight', '800')
  probe.setAttribute('x',           String(PAD))
  probe.setAttribute('y',           '0')

  Object.assign(svg.style, {
    position:   'fixed',
    top:        '-9999px',
    left:       '-9999px',
    visibility: 'hidden',
    overflow:   'visible',
  })

  svg.appendChild(probe)
  document.body.appendChild(svg)

  // Available pixel width for text (subtract stroke padding on both sides)
  const availW = (props.max_width ?? 600) - sw.value * 2 - PAD

  const words  = props.text.split(/\s+/).filter(Boolean)
  const result: string[] = []
  let   current = ''
  let   maxW    = 0

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    probe.textContent = test
    let w = 0
    try { w = probe.getBBox().width } catch { /* SVG not laid out yet */ }

    if (w > availW && current) {
      probe.textContent = current
      try { maxW = Math.max(maxW, probe.getBBox().width) } catch {}
      result.push(current)
      current = word
    } else {
      current = test
    }
  }

  if (current) {
    probe.textContent = current
    try { maxW = Math.max(maxW, probe.getBBox().width) } catch {}
    result.push(current)
  }

  document.body.removeChild(svg)

  lines.value    = result.length > 0 ? result : [props.text]
  svgWidth.value = Math.ceil(maxW + sw.value * 2 + PAD + 10)
}

onMounted(computeLines)
watch(() => [props.text, props.font_size, props.max_width, props.stroke_width], computeLines)

// ── Glow-layer helper ────────────────────────────────────────────────────────
// dy="0" on the first tspan, lh em on all subsequent ones.
// (StickerText uses `1.2 * index` which compounds for 3+ lines — this is the fix.)
const DY = (i: number) => i === 0 ? '0' : `${lh.value}em`
</script>

<template>
  <span class="sticker-pg">
    <svg
      class="sticker-pg__svg"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      :style="{ width: `${svgWidth}px` }"
    >
      <defs>
        <filter :id="`gb-${uid}`" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>

      <!-- Layer 1: outer colored blob -->
      <text class="sp-t" :x="PAD" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:strokeColor, stroke:strokeColor, strokeWidth:`${sw}px` }">
        <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
      </text>

      <!-- Layers 2-6: blurred white glow, decreasing width, increasing opacity -->
      <text v-for="(layer, li) in [
          { w: sw-2,  op: 0.15 },
          { w: sw-5,  op: 0.30 },
          { w: sw-8,  op: 0.50 },
          { w: sw-12, op: 0.70 },
          { w: sw-16, op: 0.90 },
        ]" :key="`g${li}`"
        class="sp-t" :x="PAD" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:'transparent', stroke:bgColor, strokeWidth:`${layer.w}px`,
                  filter:`url(#gb-${uid})`, opacity:layer.op }">
        <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
      </text>

      <!-- Layer 7: clean white interior (min 2px so inter-letter gaps are always filled) -->
      <text class="sp-t" :x="PAD" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:bgColor, stroke:bgColor, strokeWidth:`${whiteInteriorSW}px` }">
        <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
      </text>

      <!-- Layer 8: colored text -->
      <text class="sp-t" :x="PAD" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:strokeColor, stroke:'transparent' }">
        <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
      </text>
    </svg>
  </span>
</template>

<style scoped>
.sticker-pg {
  display: inline-block;
}

.sticker-pg__svg {
  display: block;
  height: auto;
  overflow: visible;
}

.sp-t {
  font-family:    inherit;
  font-style:     inherit;
  font-weight:    800;
  stroke-linejoin: round;
  paint-order:    stroke;
}
</style>
