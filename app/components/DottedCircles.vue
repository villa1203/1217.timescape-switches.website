<script setup lang="ts">
// `sketch`: render the animated P5 sketch clipped inside the circles. Off when
// the sketch is shown full-bleed behind the page instead (see the home page).
// `draw`: enable the stroke mask so the dotted outlines can be traced in/out.
// `play` drives that trace:
//   'in'     → draw the circles on
//   'out'    → erase them (reverse trace)
//   'shown'  → already fully drawn (no animation)
//   null     → hidden (not drawn)
const props = withDefaults(defineProps<{
  color?: string
  stroke_width?: number
  sketch?: boolean
  draw?: boolean
  play?: 'in' | 'out' | 'shown' | null
}>(), {
  sketch: true,
  draw: false,
  play: null,
})

const sw = computed(() => props.stroke_width ?? 1.5)

// Unique id suffix so multiple instances don't share <defs> (clip/filter).
const uid = useId()

// Dot style: near-zero dash + round linecap = circular dot (same as globe).
const shapesRef = ref<SVGGElement | null>(null)
const DOT = 0.1
const GAP = 9.9
const EMPTY_RATIO = 0

// ── Pulse constants ───────────────────────────────────────────────────────
// Each pulse is fully random: accel duration, decel duration, peak rate and
// dash length. progress goes 0 → 1 (accel) then immediately 1 → 0 (decel) —
// no hold at peak.
const MAX_RATE    = 5      // peak playback rate cap
const MAX_DASH    = 4      // peak dash length cap
const DUR_MIN     = 3000   // shortest accel or decel (ms)
const DUR_MAX     = 8000   // longest accel or decel (ms)
const DUR_JITTER  = 0.25   // each side can deviate ±25% from the shared base
const REST_MIN    = 6000   // rest between pulses (ms)
const REST_MAX    = 22000

// Store per-element computed dasharray so it restores perfectly after the pulse.
const baseDA = new Map<SVGGeometryElement, string>()

let pulseTimer: ReturnType<typeof setTimeout> | null = null
let pulseRafId = 0
let isPulsing  = false

function scheduleNextPulse() {
  const delay = REST_MIN + Math.random() * (REST_MAX - REST_MIN)
  pulseTimer = setTimeout(triggerPulse, delay)
}

function triggerPulse() {
  if (isPulsing) return
  const group = shapesRef.value
  if (!group) return
  isPulsing = true

  // Each pulse is unique — random timing and intensity within caps.
  const peakRate = 1.5 + Math.random() * (MAX_RATE - 1.5)
  const dashMax  = 0.5 + Math.random() * (MAX_DASH - 0.5)
  const baseDur  = DUR_MIN + Math.random() * (DUR_MAX - DUR_MIN)
  const accelMs  = Math.min(DUR_MAX, baseDur * (1 + (Math.random() * 2 - 1) * DUR_JITTER))
  const decelMs  = Math.min(DUR_MAX, baseDur * (1 + (Math.random() * 2 - 1) * DUR_JITTER))

  const shapes = Array.from(group.querySelectorAll('ellipse, circle')) as SVGGeometryElement[]
  const swVal  = sw.value
  const start  = performance.now()

  const tick = () => {
    const elapsed = performance.now() - start
    let progress: number

    if (elapsed < accelMs) {
      const t = elapsed / accelMs
      progress = t * t * t
    } else if (elapsed < accelMs + decelMs) {
      const t = (elapsed - accelMs) / decelMs
      progress = (1 - t) * (1 - t)
    } else {
      progress = 0
    }

    const dash = DOT + progress * (dashMax - DOT)
    const gap  = GAP - progress * (GAP - (10 - dashMax))
    const rate = 1 + progress * (peakRate - 1)
    const w    = swVal * (1 + progress * 0.2)

    shapes.forEach(el => {
      el.style.strokeDasharray = `${dash.toFixed(2)} ${gap.toFixed(2)}`
      el.style.strokeWidth     = w.toFixed(2)
      el.getAnimations().forEach(a => { a.playbackRate = rate })
    })

    if (elapsed < accelMs + decelMs) {
      pulseRafId = requestAnimationFrame(tick)
    } else {
      shapes.forEach(el => {
        el.style.strokeDasharray = baseDA.get(el) ?? ''
        el.style.strokeWidth     = ''
        el.getAnimations().forEach(a => { a.playbackRate = 1 })
      })
      isPulsing = false
      scheduleNextPulse()
    }
  }

  pulseRafId = requestAnimationFrame(tick)
}

onMounted(() => {
  // Compute per-shape dasharray so dots fill each ring perfectly
  const group = shapesRef.value
  if (group) {
    for (const el of Array.from(group.querySelectorAll('ellipse, circle')) as SVGGeometryElement[]) {
      const len = el.getTotalLength()
      const n = Math.max(2, Math.round(((1 - EMPTY_RATIO) * len + DOT) / (DOT + GAP)))
      const hole = Math.max(DOT, len - ((n - 1) * (DOT + GAP) + DOT))
      const dash = `${Array(n - 1).fill(`${DOT} ${GAP}`).join(' ')} ${DOT} ${hole}`
      el.style.strokeDasharray = dash
      el.style.setProperty('--len', String(len))
      baseDA.set(el, dash)
    }
  }

  scheduleNextPulse()
})

onUnmounted(() => {
  if (pulseTimer) clearTimeout(pulseTimer)
  cancelAnimationFrame(pulseRafId)
})

// `--order`: draw order from the outside in — outermost shapes (0 & 4) first,
// then the inner pair (1 & 3), then the centre (2).
const maskVars = (i: number) => ({ '--order': 2 - Math.abs(i - 2) })
</script>

<template>
  <svg
    class="dotted-circles"
    viewBox="0 0 1565 713"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <clipPath :id="`dc-clip-${uid}`">
        <ellipse cx="146"  cy="356" rx="145.5" ry="355.5" />
        <circle  cx="423"  cy="357" r="355" />
        <circle  cx="781"  cy="357" r="355" />
        <circle  cx="1138" cy="357" r="355" />
        <ellipse cx="1419" cy="356" rx="145.5" ry="355.5" />
      </clipPath>

      <mask
        v-if="draw"
        :id="`dc-draw-${uid}`"
        maskUnits="userSpaceOnUse"
        x="-50" y="-50" width="1665" height="813"
      >
        <g
          class="dc-draw-strokes"
          :class="{ 'is-in': play === 'in', 'is-out': play === 'out', 'is-shown': play === 'shown' }"
          fill="none"
          stroke="#fff"
          stroke-width="14"
          stroke-linecap="round"
        >
          <ellipse cx="146"  cy="356" rx="145.5" ry="355.5" pathLength="1" :style="maskVars(0)" />
          <circle  cx="423"  cy="357" r="355" pathLength="1" :style="maskVars(1)" />
          <circle  cx="781"  cy="357" r="355" pathLength="1" :style="maskVars(2)" />
          <circle  cx="1138" cy="357" r="355" pathLength="1" class="dc-draw-rev" :style="maskVars(3)" />
          <ellipse cx="1419" cy="356" rx="145.5" ry="355.5" pathLength="1" class="dc-draw-rev" :style="maskVars(4)" />
        </g>
      </mask>
    </defs>

    <foreignObject
      v-if="sketch"
      x="0" y="0" width="1565" height="713"
      :clip-path="`url(#dc-clip-${uid})`"
    >
      <div xmlns="http://www.w3.org/1999/xhtml" class="dc-sketch">
        <P5Background :fill-container="true" />
      </div>
    </foreignObject>

    <g ref="shapesRef" class="dc-shapes" fill="none" :mask="draw ? `url(#dc-draw-${uid})` : undefined">
      <ellipse
        cx="146" cy="356" rx="145.5" ry="355.5"
        class="dc-spin-left"
        :stroke="color || 'white'"
        :stroke-width="sw"
        stroke-linecap="round"
        stroke-dasharray="0.1 9.9"
      />
      <circle cx="423"  cy="357" r="355" :stroke="color || 'white'" :stroke-width="sw" stroke-linecap="round" stroke-dasharray="0.1 9.9" />
      <circle cx="781"  cy="357" r="355" :stroke="color || 'white'" :stroke-width="sw" stroke-linecap="round" stroke-dasharray="0.1 9.9" />
      <circle cx="1138" cy="357" r="355" :stroke="color || 'white'" :stroke-width="sw" stroke-linecap="round" stroke-dasharray="0.1 9.9" />
      <ellipse
        cx="1419" cy="356" rx="145.5" ry="355.5"
        class="dc-spin-right"
        :stroke="color || 'white'"
        :stroke-width="sw"
        stroke-linecap="round"
        stroke-dasharray="0.1 9.9"
      />
    </g>
  </svg>
</template>

<style scoped>
.dotted-circles {
  width: 100%;
  height: auto;
  mix-blend-mode: difference;
}

.dc-sketch {
  width: 100%;
  height: 100%;
}

/* ── Draw-on mask ─────────────────────────────────────────────────────── */
.dc-draw-strokes {
  --dc-draw-dur: 1.5s;
  --dc-draw-step: 0.3s;
}
.dc-draw-strokes > * { stroke-dasharray: 0 1; }
.dc-draw-strokes > .dc-draw-rev {
  transform-box: fill-box;
  transform-origin: center;
  transform: scaleX(-1);
}
.dc-draw-strokes.is-shown > * { stroke-dasharray: 1 0; }
.dc-draw-strokes.is-in > * {
  animation: dc-draw-on var(--dc-draw-dur) ease both;
  animation-delay: calc(var(--order, 0) * var(--dc-draw-step));
}
.dc-draw-strokes.is-out > * {
  animation: dc-draw-off var(--dc-draw-dur) ease both;
  animation-delay: calc((2 - var(--order, 0)) * var(--dc-draw-step));
}
@keyframes dc-draw-on  { from { stroke-dasharray: 0 1; } to { stroke-dasharray: 1 0; } }
@keyframes dc-draw-off { from { stroke-dasharray: 1 0; } to { stroke-dasharray: 0 1; } }
@media (prefers-reduced-motion: reduce) {
  .dc-draw-strokes.is-in > *,
  .dc-draw-strokes.is-shown > * { stroke-dasharray: 1 0; animation: none; }
  .dc-draw-strokes.is-out > *   { stroke-dasharray: 0 1; animation: none; }
}

/* ── Rotating dots ────────────────────────────────────────────────────── */
.dc-shapes ellipse,
.dc-shapes > circle {
  animation: dc-gap-spin var(--gap-dur, 32s) linear infinite;
}
@keyframes dc-gap-spin { to { stroke-dashoffset: var(--len, 0); } }

.dc-spin-left                    { --gap-dur: 30s; }
.dc-shapes > circle:nth-child(2) { --gap-dur: 36s; animation-direction: reverse; }
.dc-shapes > circle:nth-child(3) { --gap-dur: 32s; }
.dc-shapes > circle:nth-child(4) { --gap-dur: 40s; animation-direction: reverse; }
.dc-spin-right                   { --gap-dur: 28s; }

@media (prefers-reduced-motion: reduce) {
  .dc-shapes ellipse,
  .dc-shapes > circle { animation: none; }
}
</style>
