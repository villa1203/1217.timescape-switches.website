<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{ fillViewport?: boolean }>(), { fillViewport: false })
const svgRef = ref<SVGSVGElement | null>(null)

// ─── Constants ────────────────────────────────────────────────────────────
const CX      = 800                        // horizontal center
const CY      = 450                        // vertical center
const RADIUS  = 900                        // equatorial radius — outermost arcs reach screen edges
const N_MER   = 20                         // total meridians (18° apart)
const DISTORT = 0.13                       // how close to the pole the bezier CPs sit
const ROT_SPEED  = (Math.PI * 2) / 38     // one globe rotation per 38 s
const BASE_TOP   = -45                     // poles at rest: 5% outside the 900-unit viewBox
const BASE_BOT   = 945
const SQUISH_AMP = 45                      // squish pushes poles to 10% outside (−90 / 990)
const SQUISH_PER = 10                      // seconds per squish cycle
const LAT_FLOW   = 7                       // dot-scroll speed at equator (svg units/s)
const PURPLE     = '#820FC1'

// Latitude rings: sinLat drives vertical position, cosLat drives horizontal extent
const LATS = [80, 60, 40, 20, 0, -20, -40, -60, -80].map(deg => ({
  sinLat: Math.sin(deg  * Math.PI / 180),
  cosLat: Math.cos(Math.abs(deg) * Math.PI / 180),
}))

// ─── Mutable state ────────────────────────────────────────────────────────
let animFrame = 0
let lastTime  = 0
let totalTime = 0
let rotation  = 0
let mX = 0, sX = 0   // raw + smoothed mouse x

let meridianElsB: SVGPathElement[] = []  // black dots
let meridianElsP: SVGPathElement[] = []  // purple dots
let latitudeElsB: SVGPathElement[] = []
let latitudeElsP: SVGPathElement[] = []

// ─── Path generators ──────────────────────────────────────────────────────

// Orthographic meridian with time-distortion compression near poles.
function meridianPath(xOff: number, poleX: number, topY: number, botY: number): string {
  const range = botY - topY
  const cpX   = poleX + xOff * (4 / 3)
  const cpY1  = topY + range * DISTORT
  const cpY2  = botY - range * DISTORT
  return `M${poleX},${topY} C${cpX},${cpY1} ${cpX},${cpY2} ${poleX},${botY}`
}

// Latitude arc: full width ±RADIUS·cosLat from center, bows toward nearer pole.
function latPath(y: number, cosLat: number): string {
  const R   = RADIUS * cosLat
  const x0  = CX - R
  const x1  = CX + R
  const bow = (CY - y) * 0.12
  return `M${x0},${y} C${x0 + R * 0.38},${y - bow} ${x1 - R * 0.38},${y - bow} ${x1},${y}`
}

// ─── Build SVG structure ──────────────────────────────────────────────────

function makeGroup(root: SVGSVGElement, stroke: string): SVGGElement {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.setAttribute('stroke', stroke)
  g.setAttribute('stroke-width', '1.4')
  g.setAttribute('stroke-linecap', 'round')
  g.setAttribute('stroke-dasharray', '0.1 19.9')  // period 20 — every other dot is the other color
  g.setAttribute('fill', 'none')
  root.appendChild(g)
  return g
}

function buildSVG(root: SVGSVGElement) {
  const gB = makeGroup(root, '#111')
  const gP = makeGroup(root, PURPLE)

  for (let i = 0; i < N_MER; i++) {
    const b = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    b.setAttribute('opacity', '0')
    gB.appendChild(b)
    meridianElsB.push(b)

    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('opacity', '0')
    p.setAttribute('stroke-dashoffset', '10')  // offset by half period → fills the black gaps
    gP.appendChild(p)
    meridianElsP.push(p)
  }

  LATS.forEach(() => {
    const b = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    b.setAttribute('opacity', '0')
    gB.appendChild(b)
    latitudeElsB.push(b)

    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('opacity', '0')
    gP.appendChild(p)
    latitudeElsP.push(p)
  })
}

// ─── Animation loop ───────────────────────────────────────────────────────

function animate(now: number) {
  const dt  = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0
  lastTime  = now
  totalTime += dt
  rotation  += ROT_SPEED * dt

  // Smooth mouse → subtle pole parallax
  sX += (mX - sX) * 0.06
  const poleX = CX + sX * 14

  // Poles oscillate between 5% and 10% outside the screen (always off-screen)
  const squish = (Math.sin(totalTime * (Math.PI * 2) / SQUISH_PER) + 1) / 2
  const topY   = BASE_TOP - squish * SQUISH_AMP   // −45 → −90
  const botY   = BASE_BOT + squish * SQUISH_AMP   // 945 → 990

  // ── Meridians ─────────────────────────────────────────────────────────
  for (let i = 0; i < N_MER; i++) {
    const phase = (i / N_MER) * Math.PI * 2 + rotation
    const cosP  = Math.cos(phase)

    if (cosP < -0.06) {
      meridianElsB[i].setAttribute('opacity', '0')
      meridianElsP[i].setAttribute('opacity', '0')
    } else {
      const d       = meridianPath(RADIUS * Math.sin(phase), poleX, topY, botY)
      const opacity = String(Math.max(0, cosP) * 0.88)
      meridianElsB[i].setAttribute('d', d)
      meridianElsB[i].setAttribute('opacity', opacity)
      meridianElsP[i].setAttribute('d', d)
      meridianElsP[i].setAttribute('opacity', opacity)
    }
  }

  // ── Latitude rings ─────────────────────────────────────────────────────
  const halfGlobe = (botY - topY) / 2

  LATS.forEach(({ sinLat, cosLat }, i) => {
    const y       = CY - halfGlobe * sinLat
    const d       = latPath(y, cosLat)
    const opacity = String(0.28 + Math.abs(sinLat) * 0.3)
    const dashOff = totalTime * LAT_FLOW * cosLat

    latitudeElsB[i].setAttribute('d', d)
    latitudeElsB[i].setAttribute('opacity', opacity)
    latitudeElsB[i].setAttribute('stroke-dashoffset', String(dashOff))

    latitudeElsP[i].setAttribute('d', d)
    latitudeElsP[i].setAttribute('opacity', opacity)
    latitudeElsP[i].setAttribute('stroke-dashoffset', String(dashOff + 10))
  })

  animFrame = requestAnimationFrame(animate)
}

// ─── Pointer ──────────────────────────────────────────────────────────────

function onMouseMove(e: MouseEvent) {
  mX = (e.clientX / window.innerWidth) * 2 - 1
}

function prefersReduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ─── Lifecycle ────────────────────────────────────────────────────────────

onMounted(() => {
  const root = svgRef.value
  if (!root) return
  buildSVG(root)

  if (prefersReduced()) {
    for (let i = 0; i < N_MER; i++) {
      const phase = (i / N_MER) * Math.PI * 2
      const cosP  = Math.cos(phase)
      if (cosP > 0) {
        const d       = meridianPath(RADIUS * Math.sin(phase), CX, BASE_TOP, BASE_BOT)
        const opacity = String(cosP * 0.88)
        meridianElsB[i].setAttribute('d', d)
        meridianElsB[i].setAttribute('opacity', opacity)
        meridianElsP[i].setAttribute('d', d)
        meridianElsP[i].setAttribute('opacity', opacity)
      }
    }
    const halfGlobe = (BASE_BOT - BASE_TOP) / 2
    LATS.forEach(({ sinLat, cosLat }, i) => {
      const d       = latPath(CY - halfGlobe * sinLat, cosLat)
      const opacity = String(0.28 + Math.abs(sinLat) * 0.3)
      latitudeElsB[i].setAttribute('d', d)
      latitudeElsB[i].setAttribute('opacity', opacity)
      latitudeElsP[i].setAttribute('d', d)
      latitudeElsP[i].setAttribute('opacity', opacity)
      latitudeElsP[i].setAttribute('stroke-dashoffset', '10')
    })
    return
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true })
  animFrame = requestAnimationFrame(animate)
})

onUnmounted(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('mousemove', onMouseMove)
  meridianElsB = []
  meridianElsP = []
  latitudeElsB = []
  latitudeElsP = []
})
</script>

<template>
  <svg
    ref="svgRef"
    class="wireframe-globe"
    viewBox="0 0 1600 900"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    :preserveAspectRatio="props.fillViewport ? 'xMidYMid slice' : 'xMidYMid meet'"
  />
</template>

<style scoped>
.wireframe-globe {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
  pointer-events: none;
}
</style>
