<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type p5Type from 'p5'
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'

const containerRef = ref<HTMLDivElement | null>(null)
let p5Instance: p5Type | null = null

// Dark (Shabbat) mode — mirrors app.vue. White lines on black instead of the
// default black lines on white. `?shabbat`/`?dark` preview flag is shared via
// the same `previewDark` state.
const { isShabbat } = useShabbatCountdown()
const previewDark = useState('previewDark', () => false)
const isDark = computed(() => isShabbat.value || previewDark.value)

onMounted(async () => {
  const p5 = (await import('p5')).default

  const sketch = (p: p5Type) => {
    const lCount = 40
    const rCount = 40
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

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight)
      canvas.style('display', 'block')
      p.pixelDensity(p.displayDensity())
      p.colorMode(p.HSB, 360, 100, 100, 1)
      p.noFill()
      // Stroke colour is (re)set each frame in draw() so it reacts to dark mode.
      p.strokeWeight(sw)
      p.strokeCap(p.SQUARE)
      values()
    }

    p.draw = () => {
      const dark = isDark.value
      // Shabbat: black background + white lines. Otherwise: white bg + black lines.
      p.background(0, 0, dark ? 0 : 100)
      p.stroke(0, 0, dark ? 100 : 0, 0.5)

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
      p.resizeCanvas(p.windowWidth, p.windowHeight)
    }

    p.keyPressed = () => {
      if (p.key === 'r') {
        values()
      }
    }
  }

  if (containerRef.value) {
    p5Instance = new p5(sketch, containerRef.value)
  }
})

onUnmounted(() => {
  if (p5Instance) {
    p5Instance.remove()
    p5Instance = null
  }
})
</script>

<template>
  <div ref="containerRef" class="p5-background"></div>
</template>

<style scoped>
.p5-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  pointer-events: none;
}

.p5-background :deep(canvas) {
  display: block;
}
</style>
