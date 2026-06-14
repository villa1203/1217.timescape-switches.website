<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type p5Type from 'p5'
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'

// `fillContainer`: size the canvas to the parent element (and position it
// absolute, inset 0) instead of covering the whole window. Used when the sketch
// is embedded inside another box — e.g. clipped to the circles in DottedCircles.
// `purple`: draw purple (#820FC1) lines instead of black/white.
const props = withDefaults(defineProps<{ fillContainer?: boolean, purple?: boolean }>(), {
  fillContainer: false,
  purple: false,
})

const containerRef = ref<HTMLDivElement | null>(null)
let p5Instance: p5Type | null = null
let ro: ResizeObserver | null = null

const { isShabbat } = useShabbatCountdown()
const isDark = computed(() => isShabbat.value)

onMounted(async () => {
  const p5 = (await import('p5')).default

  const sketch = (p: p5Type) => {
    // Far fewer flow lines on mobile (40×40 = 1600 → 22×22 ≈ 480 per frame): the
    // sketch is much cheaper to init and run, so the dark-mode switch doesn't jank.
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 768
    const lCount = isMobileViewport ? 22 : 40
    const rCount = isMobileViewport ? 22 : 40
    const sw = 0.5
    const fxMin = 0.1
    const fxMax = 1
    const fyMin = 0.3
    const fyMax = 1
    let fx: number, fy: number, r: number

    const values = () => {
      fx = p.random(fxMin, fxMax)
      fy = p.random(fyMin, fyMax)
      r = p.random(0.1, 1)
    }

    const dims = (): [number, number] => {
      const el = containerRef.value
      if (props.fillContainer && el) return [el.clientWidth, el.clientHeight]
      return [p.windowWidth, p.windowHeight]
    }

    p.setup = () => {
      const [w, h] = dims()
      const canvas = p.createCanvas(w, h)
      canvas.style('display', 'block')
      p.pixelDensity(p.displayDensity())
      // RGB mode so purple color can be set directly alongside white/black.
      p.colorMode(p.RGB, 255)
      p.noFill()
      p.strokeWeight(sw)
      p.strokeCap(p.SQUARE)
      values()
    }

    p.draw = () => {
      const dark = isDark.value
      if (props.fillContainer) {
        p.clear()
      } else {
        const bg = dark ? 0 : 255
        p.background(bg, bg, bg)
      }

      if (props.purple) {
        p.stroke(130, 15, 193, 128)  // #820FC1 at 50% alpha
      } else {
        const v = dark ? 255 : 0
        p.stroke(v, v, v, 128)
      }

      const wSpc = p.width / lCount
      const hSpc = p.height / rCount
      const mx = p.millis() * 0.0007
      const my = p.millis() * 0.0005

      for (let y = 0; y < rCount; y++) {
        for (let x = 0; x < lCount; x++) {
          const xA = p.sin(r + mx + x * fx)
          const xB = p.sin(r + my + y * fy)
          const xPos = xA * xB * wSpc
          p.push()
          p.translate(wSpc + x * wSpc, y * hSpc)
          p.line(xPos, 0, xPos, hSpc)
          p.pop()
        }
      }
    }

    p.windowResized = () => {
      if (!props.fillContainer) {
        const [w, h] = dims()
        p.resizeCanvas(w, h)
      }
    }

    p.keyPressed = () => {
      if (p.key === 'r') {
        values()
      }
    }
  }

  if (containerRef.value) {
    p5Instance = new p5(sketch, containerRef.value)

    if (props.fillContainer) {
      ro = new ResizeObserver(() => {
        const el = containerRef.value
        if (p5Instance && el) p5Instance.resizeCanvas(el.clientWidth, el.clientHeight)
      })
      ro.observe(containerRef.value)
    }
  }
})

onUnmounted(() => {
  ro?.disconnect()
  ro = null
  if (p5Instance) {
    p5Instance.remove()
    p5Instance = null
  }
})
</script>

<template>
  <div ref="containerRef" class="p5-background" :class="{ 'p5-background--contained': fillContainer, 'p5-background--dark': isDark }"></div>
</template>

<style scoped>
.p5-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  pointer-events: none;
}

.p5-background--contained {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: auto;
}

.p5-background :deep(canvas) {
  display: block;
}
</style>
