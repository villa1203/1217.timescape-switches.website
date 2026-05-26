<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, useId } from 'vue'
import { useStickerMeasure } from '~/composables/useStickerMeasure'

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
  fill_max_width?: boolean // when true, the SVG canvas always spans the full
                           // `max_width` (= container width) instead of shrinking
                           // to the longest line. Use for full-bleed text blocks.
}>()

const sizePreset = computed(() => {
  switch (props.size) {
    case 'sm': return { fs: 20, sw: 18, bs: 9 }
    case 'lg': return { fs: 52, sw: 44, bs: 22 }
    case 'md':
    default:   return { fs: 30, sw: 28, bs: 14 }
  }
})

const uid       = useId()
const stickerRef = ref<HTMLElement | null>(null)
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

function computeLinesDOM() {
  if (!import.meta.client || !props.text) return

  const ns    = 'http://www.w3.org/2000/svg'
  const svg   = document.createElementNS(ns, 'svg')
  const probe = document.createElementNS(ns, 'text')

  probe.setAttribute('font-size', String(fs.value))
  // Let font-weight & font-family inherit from the host context so the probe
  // measures glyphs at the actual rendered weight (was hardcoded to 800, which
  // mismatched body context = 400 and made text wrap earlier than necessary).
  probe.setAttribute('x', String(PAD.value))
  probe.setAttribute('y', '0')

  Object.assign(svg.style, {
    position:   'fixed',
    top:        '-9999px',
    left:       '-9999px',
    visibility: 'hidden',
    overflow:   'visible',
  })

  svg.appendChild(probe)
  // Mount the probe inside the component's own span so CSS inheritance
  // (font-family, font-weight) matches what the rendered .sp-t will use.
  const host: HTMLElement = stickerRef.value ?? document.body
  host.appendChild(svg)

  // Available pixel width for text. Cap to viewport width so stickers never
  // push outside the screen on mobile — they re-wrap onto more lines instead.
  const VIEWPORT_PAD = 32 // total horizontal margin we want to keep clear of stickers
  const cappedMax = Math.min(
    props.max_width ?? 600,
    window.innerWidth - VIEWPORT_PAD,
  )
  // Available width for text. Fill mode reserves a touch more than one PAD on
  // the right so the visible margin feels slightly bigger than the left start
  // offset. Inline contexts reserve PAD on both sides so the stroke stays
  // fully inside the SVG box.
  const availW = props.fill_max_width
    ? cappedMax - PAD.value * 1.5
    : cappedMax - PAD.value * 2

  // Honor literal "\n" in the input as a hard line break — but only on desktop.
  // On mobile (≤768px) the text reflows naturally to fit the narrower viewport
  // instead of being held to the desktop line-break layout.
  const MOBILE_BREAKPOINT = 768
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT
  const sourceText = isMobile ? props.text.replace(/\n/g, ' ') : props.text
  const segments = sourceText.split('\n')
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

  host.removeChild(svg)

  lines.value    = result.length > 0 ? result : [props.text]
  // Symmetric horizontal margins: same PAD on both sides. The blob extends past
  // the box thanks to overflow:visible, so we don't reserve extra room here.
  // When `fill_max_width` is set, stretch the SVG canvas to the full available
  // width instead — the text stays left-aligned and the sticker visually fills
  // the container (used by BlockText sticker mode).
  svgWidth.value = props.fill_max_width
    ? Math.ceil(cappedMax)
    : Math.ceil(maxW + PAD.value * 2)
}

const { measure: measureViaWorker } = useStickerMeasure()

// Measure line wraps off the main thread via the Worker (OffscreenCanvas).
// Falls back to the DOM method (computeLinesDOM) on SSR or if the Worker is
// unavailable / errors.
async function measure() {
  if (!import.meta.client || !props.text) return

  // The sticker text uses font-family/weight: inherit, so read the resolved
  // values from the host span and pass them to the Worker.
  let fontFamily = "'Happy Times NG', Georgia, serif"
  let fontWeight: string | number = 400
  const host = stickerRef.value
  if (host) {
    const cs = getComputedStyle(host)
    if (cs.fontFamily) fontFamily = cs.fontFamily
    if (cs.fontWeight) fontWeight = cs.fontWeight
  }

  try {
    const res = await measureViaWorker({
      text: props.text,
      fontSize: fs.value,
      fontFamily,
      fontWeight,
      maxWidth: props.max_width ?? 600,
      fillMaxWidth: !!props.fill_max_width,
      pad: PAD.value,
      innerWidth: window.innerWidth,
    })
    lines.value    = res.lines.length > 0 ? res.lines : [props.text]
    svgWidth.value = res.svgWidth
  } catch {
    computeLinesDOM()
  }
}

onMounted(() => {
  measure()
  if (import.meta.client) {
    // Re-measure once custom fonts finish loading. Without this, the first
    // measurement uses the fallback font (font-display: swap) which is narrower
    // than ES Allianz Bold — svgWidth ends up too small, the mask region gets
    // truncated, and the inner gradient/white layers disappear past that point.
    // The remaining outer colored blob shows as a flat purple fill. Most
    // visible on mobile where font loading is slower.
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
  }
})
onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('resize', measure)
})
watch(() => [props.text, props.font_size, props.max_width, props.stroke_width, props.size], measure)

// ── Glow-layer helper ────────────────────────────────────────────────────────
// dy="0" on the first tspan, lh em on all subsequent ones.
// (StickerText uses `1.2 * index` which compounds for 3+ lines — this is the fix.)
const DY = (i: number) => i === 0 ? '0' : `${lh.value}em`

// Text always starts at x=PAD on the left — keeps the visible margin
// consistent with non-fill stickers. In fill mode the right side stretches
// past the SVG box (handled in availW below + overflow:visible).
const startX = computed(() => PAD.value)
</script>

<template>
  <span class="sticker-pg" ref="stickerRef">
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
             inverted variants). The region is intentionally oversized so any
             small mismatch between our measured svgWidth and the actually
             rendered text width (fonts swapping in late, hinting/kerning
             differences between the probe and the rendered SVG text) can never
             clip the mask — past the clip point the inner gradient/white
             layers disappear and only the outer colored blob shows, producing
             the "flat purple cut-off" visible on mobile. -->
        <mask :id="`mb-${uid}`" maskUnits="userSpaceOnUse"
              x="-10000" y="-10000" width="20000" height="20000">
          <text class="sp-t" :x="startX" :y="textY"
            :style="{ fontSize:`${fs}px`, fill:'#fff', stroke:'#fff', strokeWidth:`${sw}px` }">
            <tspan v-for="(l,i) in lines" :key="i" :x="startX" :dy="DY(i)">{{ l }}</tspan>
          </text>
        </mask>
      </defs>

      <!-- Layer 1: outer colored blob -->
      <text class="sp-t" :x="startX" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:strokeColor, stroke:strokeColor, strokeWidth:`${sw}px` }">
        <tspan v-for="(l,i) in lines" :key="i" :x="startX" :dy="DY(i)">{{ l }}</tspan>
      </text>

      <!-- Solid interior backing (unmasked) at the interior width. Sits above
           the outer blob but below the masked glow group, so any tiny holes in
           the masked interior show the interior colour instead of the outer
           blob beneath. This is what plugs the white specks visible inside the
           purple fill on hover (inverted mode). -->
      <text class="sp-t" :x="startX" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:bgColor, stroke:bgColor, strokeWidth:`${whiteInteriorSW}px` }">
        <tspan v-for="(l,i) in lines" :key="i" :x="startX" :dy="DY(i)">{{ l }}</tspan>
      </text>

      <!-- Inner layers (glow gradient + solid interior) clipped to the outer blob -->
      <g :mask="`url(#mb-${uid})`">
        <!-- Smooth white-glow gradient: N layers between outer stroke and white interior -->
        <text v-for="(layer, li) in glowLayers" :key="`g${li}`"
          class="sp-t" :x="startX" :y="textY"
          :style="{ fontSize:`${fs}px`, fill:'transparent', stroke:bgColor, strokeWidth:`${layer.w}px`,
                    filter:`url(#gb-${uid})`, opacity:layer.op }">
          <tspan v-for="(l,i) in lines" :key="i" :x="startX" :dy="DY(i)">{{ l }}</tspan>
        </text>

        <!-- Clean white interior (min 2px so inter-letter gaps are always filled) -->
        <text class="sp-t" :x="startX" :y="textY"
          :style="{ fontSize:`${fs}px`, fill:bgColor, stroke:bgColor, strokeWidth:`${whiteInteriorSW}px` }">
          <tspan v-for="(l,i) in lines" :key="i" :x="startX" :dy="DY(i)">{{ l }}</tspan>
        </text>
      </g>

      <!-- Layer 8: colored text -->
      <text class="sp-t" :x="startX" :y="textY"
        :style="{ fontSize:`${fs}px`, fill:strokeColor, stroke:'transparent' }">
        <tspan v-for="(l,i) in lines" :key="i" :x="startX" :dy="DY(i)">{{ l }}</tspan>
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
