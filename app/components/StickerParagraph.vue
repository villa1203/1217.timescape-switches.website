<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, useId } from 'vue'

const props = defineProps<{
  text:          string
  color?:        string
  variant?:      'primary' | 'secondary'
  size?:         'sm' | 'md' | 'lg'  // shorthand for fs/stroke/border presets. default 'md'
  stroke_width?: number  // outer blob thickness. overrides size preset
  font_size?:    number  // px. overrides size preset
  line_height?:  number  // em multiplier between lines. default 1.2
  max_width?:    number  // px — wrap width. default 600
  border_size?:  number  // visible colored border in px. overrides size preset
  inverted?:     boolean // swap colored ↔ white (e.g. for hover state)
}>()

const sizePreset = computed(() => {
  switch (props.size) {
    case 'sm': return { fs: 20, sw: 18, bs: 9 }
    case 'lg': return { fs: 52, sw: 44, bs: 22 }
    case 'md':
    default:   return { fs: 30, sw: 28, bs: 14 }
  }
})

const uid      = useId()
const lines    = ref<string[]>([props.text])
const svgWidth = ref(600)

const baseColor = computed(() => {
  if (props.color)                     return props.color
  if (props.variant === 'secondary')   return 'var(--app-color-secondary)'
  return 'var(--app-color-primary)'
})

// Inverted swaps the colored stroke and the white interior.
const strokeColor = computed(() => props.inverted ? '#ffffff'        : baseColor.value)
const bgColor     = computed(() => props.inverted ? baseColor.value : '#ffffff')
const fs  = computed(() => props.font_size    ?? sizePreset.value.fs)
const sw  = computed(() => props.stroke_width ?? sizePreset.value.sw)
const lh  = computed(() => props.line_height  ?? 1.2)
// Left x-offset of text inside the SVG. Sized to the half-stroke so the colored
// blob just fits flush against the SVG's left edge (no visible indent).
const PAD = computed(() => Math.ceil(sw.value / 2))

// y of the first line's baseline (same as StickerText)
const textY = computed(() => fs.value * 1.1)

// Total SVG height: first baseline + each extra line + stroke buffer below.
// Bottom buffer must cover descender (~fs*0.3) + half stroke. Using sw is enough;
// the SVG has overflow:visible so the blob can extend beyond the box anyway.
const svgHeight = computed(() =>
  textY.value + (lines.value.length - 1) * lh.value * fs.value + sw.value / 2
)

// White interior stroke — covers the glow gradient zone, leaving only `border_size` px
// of colored border visible. Clamped to min 2px so inter-letter gaps are always filled.
const border         = computed(() => props.border_size ?? sizePreset.value.bs)
const whiteInteriorSW = computed(() => Math.max(sw.value - border.value, 2))

// Generate the white-glow layers that sit between the outer colored stroke (sw)
// and the inner solid white (whiteInteriorSW). Linear width + opacity ramp gives
// the smoothest perceived gradient from the colored border to the white interior.
const glowLayers = computed(() => {
  const N = 8
  const wOuter = sw.value
  const wInner = whiteInteriorSW.value
  const out = []
  for (let i = 1; i <= N; i++) {
    const t = i / (N + 1)
    out.push({
      w:  wOuter - t * (wOuter - wInner),
      op: 0.1 + t * 0.8,
    })
  }
  return out
})

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
  probe.setAttribute('x',           String(PAD.value))
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

  // Available pixel width for text. Cap to viewport width so stickers never
  // push outside the screen on mobile — they re-wrap onto more lines instead.
  const VIEWPORT_PAD = 32 // total horizontal margin we want to keep clear of stickers
  const cappedMax = Math.min(
    props.max_width ?? 600,
    window.innerWidth - VIEWPORT_PAD,
  )
  const availW = cappedMax - sw.value * 2 - PAD.value

  // Honor literal "\n" in the input as a hard line break. Split on newlines
  // first, then word-wrap within each segment.
  const segments = props.text.split('\n')
  const result: string[] = []
  let   maxW = 0

  for (const segment of segments) {
    const words = segment.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      result.push('')
      continue
    }

    let current = ''
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
  }

  document.body.removeChild(svg)

  lines.value    = result.length > 0 ? result : [props.text]
  // Symmetric horizontal margins: same PAD on both sides. The blob extends past
  // the box thanks to overflow:visible, so we don't reserve extra room here.
  svgWidth.value = Math.ceil(maxW + PAD.value * 2)
}

onMounted(() => {
  computeLines()
  // Re-wrap when the viewport size changes so the cap above stays accurate
  if (import.meta.client) window.addEventListener('resize', computeLines)
})
onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('resize', computeLines)
})
watch(() => [props.text, props.font_size, props.max_width, props.stroke_width, props.size], computeLines)

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
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <!-- Mask that matches the outer blob silhouette so the blurred inner
             layers can never bleed past it (otherwise visible as a halo on
             inverted variants). -->
        <mask :id="`mb-${uid}`" maskUnits="userSpaceOnUse"
              :x="-sw" :y="-sw" :width="svgWidth + sw * 2" :height="svgHeight + sw * 2">
          <text class="sp-t" :x="PAD" :y="textY"
            :style="{ fontSize:`${fs}px`, fill:'#fff', stroke:'#fff', strokeWidth:`${sw}px` }">
            <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
          </text>
        </mask>
      </defs>

      <!-- Layer 1: outer colored blob -->
      <text class="sp-t" :x="PAD" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:strokeColor, stroke:strokeColor, strokeWidth:`${sw}px` }">
        <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
      </text>

      <!-- Inner layers (glow gradient + solid interior) clipped to the outer blob -->
      <g :mask="`url(#mb-${uid})`">
        <!-- Smooth white-glow gradient: N layers between outer stroke and white interior -->
        <text v-for="(layer, li) in glowLayers" :key="`g${li}`"
          class="sp-t" :x="PAD" :y="textY"
          :style="{ fontSize:`${fs}px`, fill:'transparent', stroke:bgColor, strokeWidth:`${layer.w}px`,
                    filter:`url(#gb-${uid})`, opacity:layer.op }">
          <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
        </text>

        <!-- Clean white interior (min 2px so inter-letter gaps are always filled) -->
        <text class="sp-t" :x="PAD" :y="textY"
          :style="{ fontSize:`${fs}px`, fill:bgColor, stroke:bgColor, strokeWidth:`${whiteInteriorSW}px` }">
          <tspan v-for="(l,i) in lines" :key="i" :x="PAD" :dy="DY(i)">{{ l }}</tspan>
        </text>
      </g>

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
  font-weight:    inherit;
  stroke-linejoin: round;
  paint-order:    stroke;
}
</style>
