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

// Rotating gap: each dotted outline keeps its dots over ~80% of its length and
// has one ~20% empty arc. We build the dash pattern per shape from its real
// perimeter (so dot size stays consistent across circles/ellipses and the
// pattern sums to the length → no repeat), then animate stroke-dashoffset
// elsewhere to send that empty arc travelling around. `--len` (the perimeter)
// is exposed so the CSS keyframe can offset by exactly one full loop.
const shapesRef = ref<SVGGElement | null>(null)
const DOT = 10           // dash length (matches the previous "10 10" look)
const GAP = 10           // gap between dots
const EMPTY_RATIO = 0.025  // share of the ring left empty (the rotating hole)

onMounted(() => {
  const group = shapesRef.value
  if (!group) return
  for (const el of Array.from(group.children) as SVGGeometryElement[]) {
    if (typeof el.getTotalLength !== 'function') continue
    const len = el.getTotalLength()
    // Number of dotted periods that fill the non-empty part of the ring.
    const n = Math.max(2, Math.round(((1 - EMPTY_RATIO) * len + DOT) / (DOT + GAP)))
    // The one big gap absorbs the remainder so the whole pattern equals `len`.
    const hole = Math.max(DOT, len - ((n - 1) * (DOT + GAP) + DOT))
    const dash = `${Array(n - 1).fill(`${DOT} ${GAP}`).join(' ')} ${DOT} ${hole}`
    el.style.strokeDasharray = dash
    el.style.setProperty('--len', String(len))
  }
})

// `--order`: draw order from the outside in — outermost shapes (0 & 4) first,
// then the inner pair (1 & 3), then the centre (2). The trace always starts at
// each shape's path origin (the side facing the composition centre — 3 o'clock
// for the left shapes, and 9 o'clock for the right ones since they're mirrored).
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
      <!-- Découpe : l'union des 5 formes. Sert à n'afficher le sketch (et le
           grain) qu'À L'INTÉRIEUR des cercles. -->
      <clipPath :id="`dc-clip-${uid}`">
        <ellipse cx="146"  cy="356" rx="145.5" ry="355.5" />
        <circle  cx="423"  cy="357" r="355" />
        <circle  cx="781"  cy="357" r="355" />
        <circle  cx="1138" cy="357" r="355" />
        <ellipse cx="1419" cy="356" rx="145.5" ry="355.5" />
      </clipPath>

      <!-- Draw-on mask: solid white copies of the shapes, each "traced" via
           stroke-dashoffset (pathLength normalised to 1). As each stroke draws
           on, it progressively reveals the dotted outline underneath. -->
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

    <!-- Le sketch P5 vit dans le SVG (même repère que les cercles) et n'est
         visible qu'à l'intérieur des formes grâce au clip. -->
    <foreignObject
      v-if="sketch"
      x="0" y="0" width="1565" height="713"
      :clip-path="`url(#dc-clip-${uid})`"
    >
      <div xmlns="http://www.w3.org/1999/xhtml" class="dc-sketch">
        <P5Background :fill-container="true" />
      </div>
    </foreignObject>

    <!-- Contours pointillés animés, au-dessus de tout. -->
    <g ref="shapesRef" class="dc-shapes" fill="none" :mask="draw ? `url(#dc-draw-${uid})` : undefined">
      <!-- Ellipse gauche -->
      <ellipse
        cx="146" cy="356" rx="145.5" ry="355.5"
        :stroke="color || 'black'"
        :stroke-width="sw"
        stroke-linecap="round"
        stroke-dasharray="10 10"
      />
      <!-- Cercle gauche -->
      <circle
        cx="423" cy="357" r="355"
        :stroke="color || 'black'"
        :stroke-width="sw"
        stroke-linecap="round"
        stroke-dasharray="10 10"
      />
      <!-- Cercle centre -->
      <circle
        cx="781" cy="357" r="355"
        :stroke="color || 'black'"
        :stroke-width="sw"
        stroke-linecap="round"
        stroke-dasharray="10 10"
      />
      <!-- Cercle droit -->
      <circle
        cx="1138" cy="357" r="355"
        :stroke="color || 'black'"
        :stroke-width="sw"
        stroke-linecap="round"
        stroke-dasharray="10 10"
      />
      <!-- Ellipse droite -->
      <ellipse
        cx="1419" cy="356" rx="145.5" ry="355.5"
        :stroke="color || 'black'"
        :stroke-width="sw"
        stroke-linecap="round"
        stroke-dasharray="10 10"
      />
    </g>
  </svg>
</template>

<style scoped>
.dotted-circles {
  width: 100%;
  height: auto;
  /* Effet "différence" : tout l'ensemble des cercles (sketch + grain + contours)
     se fond en différence avec ce qu'il y a derrière (fond de page). */
  mix-blend-mode: difference;
}

.dc-sketch {
  width: 100%;
  height: 100%;
}

/* Trace timing (tweak here to speed up / slow down the draw + erase). */
.dc-draw-strokes {
  --dc-draw-dur: 1.5s;   /* per-shape draw/erase duration */
  --dc-draw-step: 0.3s;  /* stagger between the 3 rings */
}

/* pathLength is normalised to 1, so the drawn arc grows from 0 to the full
   circumference (dasharray 0 1 → 1 0), starting from each shape's path origin
   (the centre-facing side). Hidden by default. */
.dc-draw-strokes > * {
  stroke-dasharray: 0 1;
}

/* The two rightmost shapes trace the other way round: mirroring horizontally
   reverses the path winding (invisible — both shapes are symmetric). */
.dc-draw-strokes > .dc-draw-rev {
  transform-box: fill-box;
  transform-origin: center;
  transform: scaleX(-1);
}

/* Static fully-drawn state (e.g. the home circles on initial load — the loader
   already played the draw). */
.dc-draw-strokes.is-shown > * {
  stroke-dasharray: 1 0;
}

/* Draw on — staggered from the outside in. `both` fill so a shape holds its
   start (hidden) state during its stagger delay and its end (drawn) state after. */
.dc-draw-strokes.is-in > * {
  animation: dc-draw-on var(--dc-draw-dur) ease both;
  animation-delay: calc(var(--order, 0) * var(--dc-draw-step));
}

/* Erase (reverse trace) — staggered from the inside out (the inverse order).
   `both` fill keeps not-yet-started shapes fully drawn until their turn. */
.dc-draw-strokes.is-out > * {
  animation: dc-draw-off var(--dc-draw-dur) ease both;
  animation-delay: calc((2 - var(--order, 0)) * var(--dc-draw-step));
}

@keyframes dc-draw-on {
  from { stroke-dasharray: 0 1; }
  to   { stroke-dasharray: 1 0; }
}

@keyframes dc-draw-off {
  from { stroke-dasharray: 1 0; }
  to   { stroke-dasharray: 0 1; }
}

@media (prefers-reduced-motion: reduce) {
  /* No tracing — jump straight to the target state. */
  .dc-draw-strokes.is-in > *,
  .dc-draw-strokes.is-shown > * { stroke-dasharray: 1 0; animation: none; }
  .dc-draw-strokes.is-out > *   { stroke-dasharray: 0 1; animation: none; }
}

/* Rotating gap: offsetting the dash pattern by exactly one perimeter (`--len`,
   set per shape in JS) sends the single empty arc travelling around the ring,
   seamlessly looping. Dots stay put relative to the moving hole. */
.dc-shapes > * {
  animation: dc-gap-spin var(--gap-dur, 16s) linear infinite;
}

@keyframes dc-gap-spin {
  to { stroke-dashoffset: var(--len, 0); }
}

/* Varied speeds + directions so the holes don't move in lockstep. */
.dc-shapes ellipse:nth-child(1) { --gap-dur: 15s; }
.dc-shapes circle:nth-child(2)  { --gap-dur: 18s; animation-direction: reverse; }
.dc-shapes circle:nth-child(3)  { --gap-dur: 16s; }
.dc-shapes circle:nth-child(4)  { --gap-dur: 20s; animation-direction: reverse; }
.dc-shapes ellipse:nth-child(5) { --gap-dur: 14s; }

@media (prefers-reduced-motion: reduce) {
  .dc-shapes > * { animation: none; }
}
</style>
