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
  sketch_purple?: boolean  // draw the embedded P5 sketch in purple
  draw?: boolean
  play?: 'in' | 'out' | 'shown' | null
  gradient?: boolean
  dot_size?: number  // base dot length (SVG units); default 0.1 = tiny dot
  pulse?: boolean    // enable random size-pulse animation; set false to freeze dots
}>(), {
  sketch: true,
  sketch_purple: false,
  draw: false,
  play: null,
  gradient: false,
  dot_size: 0.1,
  pulse: true,
})

const sw = computed(() => props.stroke_width ?? 1.5)

// Unique id suffix so multiple instances don't share <defs> (clip/filter).
const uid = useId()

// Dot style: reactive so the parent can drive bigger dots at runtime.
const shapesRef = ref<SVGGElement | null>(null)
const DOT = computed(() => props.dot_size)
const GAP = computed(() => Math.max(0.1, 10 - DOT.value))
const EMPTY_RATIO = 0

// ── Pulse constants ───────────────────────────────────────────────────────
const MAX_RATE    = 5
const MAX_DASH    = 4
const DUR_MIN     = 3000
const DUR_MAX     = 8000
const DUR_JITTER  = 0.25
const REST_MIN    = 6000
const REST_MAX    = 22000

// Store per-element computed dasharray so it restores perfectly after the pulse.
const baseDA = new Map<SVGGeometryElement, string>()

let pulseTimer: ReturnType<typeof setTimeout> | null = null
let pulseRafId = 0
let isPulsing  = false

function scheduleNextPulse() {
  if (!props.pulse) return
  const delay = REST_MIN + Math.random() * (REST_MAX - REST_MIN)
  pulseTimer = setTimeout(triggerPulse, delay)
}

function triggerPulse() {
  if (isPulsing || !props.pulse) return
  const group = shapesRef.value
  if (!group) return
  isPulsing = true

  const peakRate = 1.5 + Math.random() * (MAX_RATE - 1.5)
  const dashMax  = 0.5 + Math.random() * (MAX_DASH - 0.5)
  const baseDur  = DUR_MIN + Math.random() * (DUR_MAX - DUR_MIN)
  const accelMs  = Math.min(DUR_MAX, baseDur * (1 + (Math.random() * 2 - 1) * DUR_JITTER))
  const decelMs  = Math.min(DUR_MAX, baseDur * (1 + (Math.random() * 2 - 1) * DUR_JITTER))

  const shapes = Array.from(group.querySelectorAll('ellipse, circle')) as SVGGeometryElement[]
  const swVal  = sw.value
  // Capture current dot/gap so the pulse is consistent even if prop changes mid-flight.
  const dot = DOT.value
  const gap = GAP.value
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

    const d = dot + progress * (dashMax - dot)
    const g = gap - progress * (gap - (10 - dashMax))
    const rate = 1 + progress * (peakRate - 1)
    const w    = swVal * (1 + progress * 0.2)

    shapes.forEach(el => {
      el.style.strokeDasharray = `${d.toFixed(2)} ${g.toFixed(2)}`
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

function measureShapes() {
  const group = shapesRef.value
  if (!group) return
  const dot = DOT.value
  const gap = GAP.value
  for (const el of Array.from(group.querySelectorAll('ellipse, circle')) as SVGGeometryElement[]) {
    const len = el.getTotalLength()
    const n = Math.max(2, Math.round(((1 - EMPTY_RATIO) * len + dot) / (dot + gap)))
    const hole = Math.max(dot, len - ((n - 1) * (dot + gap) + dot))
    const dash = `${Array(n - 1).fill(`${dot} ${gap}`).join(' ')} ${dot} ${hole}`
    el.style.strokeDasharray = dash
    el.style.setProperty('--len', String(len))
    baseDA.set(el, dash)
  }
}

onMounted(() => {
  measureShapes()
  scheduleNextPulse()
})

watch(() => props.dot_size, () => {
  if (shapesRef.value) measureShapes()
})

watch(() => props.pulse, (on) => {
  if (!on) {
    if (pulseTimer) { clearTimeout(pulseTimer); pulseTimer = null }
    cancelAnimationFrame(pulseRafId)
    isPulsing = false
    const group = shapesRef.value
    if (group) {
      for (const el of Array.from(group.querySelectorAll('ellipse, circle')) as SVGGeometryElement[]) {
        el.style.strokeDasharray = baseDA.get(el) ?? ''
        el.style.strokeWidth = ''
        el.getAnimations().forEach(a => { a.playbackRate = 1 })
      }
    }
  } else {
    scheduleNextPulse()
  }
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
  <div class="dotted-circles">
    <!-- Sketch lives OUTSIDE the SVG: Safari/WebKit doesn't clip <foreignObject>
         HTML to an SVG clip-path/mask, so the P5 canvas spilled out of the
         circles. As a plain HTML layer it's clipped reliably by a CSS mask of
         the same five circles. -->
    <Transition name="dc-sketch-fade">
      <div v-if="sketch" class="dc-sketch-layer">
        <P5Background :fill-container="true" :purple="sketch_purple" />
      </div>
    </Transition>

    <svg
      class="dc-svg"
      viewBox="0 0 1565 713"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient
          v-if="gradient"
          :id="`dc-grad-${uid}`"
          gradientUnits="userSpaceOnUse"
          x1="0" y1="356" x2="1565" y2="356"
        >
          <stop offset="0%"   stop-color="#3f3f3f" />
          <stop offset="100%" stop-color="#000000" />
        </linearGradient>

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

      <g ref="shapesRef" class="dc-shapes" fill="none" :mask="draw ? `url(#dc-draw-${uid})` : undefined">
        <ellipse
          cx="146" cy="356" rx="145.5" ry="355.5"
          class="dc-spin-left"
          :stroke="gradient ? `url(#dc-grad-${uid})` : (color || 'white')"
          :stroke-width="sw"
          stroke-linecap="round"
          stroke-dasharray="0.1 9.9"
        />
        <circle cx="423"  cy="357" r="355" :stroke="gradient ? `url(#dc-grad-${uid})` : (color || 'white')" :stroke-width="sw" stroke-linecap="round" stroke-dasharray="0.1 9.9" />
        <circle cx="781"  cy="357" r="355" :stroke="gradient ? `url(#dc-grad-${uid})` : (color || 'white')" :stroke-width="sw" stroke-linecap="round" stroke-dasharray="0.1 9.9" />
        <circle cx="1138" cy="357" r="355" :stroke="gradient ? `url(#dc-grad-${uid})` : (color || 'white')" :stroke-width="sw" stroke-linecap="round" stroke-dasharray="0.1 9.9" />
        <ellipse
          cx="1419" cy="356" rx="145.5" ry="355.5"
          class="dc-spin-right"
          :stroke="gradient ? `url(#dc-grad-${uid})` : (color || 'white')"
          :stroke-width="sw"
          stroke-linecap="round"
          stroke-dasharray="0.1 9.9"
        />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.dotted-circles {
  position: relative;
  width: 100%;
  mix-blend-mode: difference;
}

/* The SVG (dotted outlines only) defines the component's height via its viewBox
   aspect; the sketch layer is absolutely sized against it. */
.dc-svg {
  display: block;
  width: 100%;
  height: auto;
}

.dc-sketch-layer {
  position: absolute;
  inset: 0;
  /* Clip the HTML sketch to the five circles with a CSS mask (viewBox matches
     the SVG's, size:100% 100% keeps it aligned with the outlines). Works in
     WebKit, unlike clip-path on a <foreignObject>. */
  --dc-mask: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%201565%20713'%20preserveAspectRatio='none'%3E%3Cg%20fill='%23fff'%3E%3Cellipse%20cx='146'%20cy='356'%20rx='145.5'%20ry='355.5'/%3E%3Ccircle%20cx='423'%20cy='357'%20r='355'/%3E%3Ccircle%20cx='781'%20cy='357'%20r='355'/%3E%3Ccircle%20cx='1138'%20cy='357'%20r='355'/%3E%3Cellipse%20cx='1419'%20cy='356'%20rx='145.5'%20ry='355.5'/%3E%3C/g%3E%3C/svg%3E");
  -webkit-mask: var(--dc-mask) center / 100% 100% no-repeat;
          mask: var(--dc-mask) center / 100% 100% no-repeat;
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

/* ── Sketch fade ─────────────────────────────────────────────────────── */
/* Entering: hold at 0 for a beat so P5 has time to load + paint a first frame
   (slower on mobile), then ease in — avoids the sketch popping in mid-switch.
   Leaving: a quicker, plain fade out. */
.dc-sketch-fade-enter-active {
  transition: opacity 0.9s ease 0.35s;
}
.dc-sketch-fade-leave-active {
  transition: opacity 0.5s ease;
}
.dc-sketch-fade-enter-from,
.dc-sketch-fade-leave-to {
  opacity: 0;
}
/* Mobile: simple, uniform fade with no hold delay — a smooth cross-fade to the
   end state rather than a staged animation. */
@media (max-width: 768px) {
  .dc-sketch-fade-enter-active,
  .dc-sketch-fade-leave-active {
    transition: opacity 0.5s ease;
  }
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
