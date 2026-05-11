import { ref, onUnmounted } from 'vue'

export function useFrameStats() {
  const fps     = ref(0)
  const frameMs = ref(0)
  const calls   = ref(0)  // draw calls — populated if you pass renderer

  let frames   = 0
  let lastTime = performance.now()
  let rafId    = 0

  function tick() {
    rafId = requestAnimationFrame(tick)
    frames++
    const now     = performance.now()
    const elapsed = now - lastTime
    if (elapsed >= 500) {
      fps.value     = Math.round(frames * 1000 / elapsed)
      frameMs.value = Math.round(elapsed / frames * 10) / 10
      frames        = 0
      lastTime      = now
    }
  }

  tick()
  onUnmounted(() => cancelAnimationFrame(rafId))

  return { fps, frameMs, calls }
}
