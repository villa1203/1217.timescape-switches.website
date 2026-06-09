<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppLoader } from '~/composables/useAppLoader'

const { loaderDone, finish } = useAppLoader()

// 'in'  : violet screen + loader text held
// 'out' : the whole loader fades out
const phase = ref<'in' | 'out'>('in')

// Animations (marquee / float) only start once mounted on the client, so the
// SSR-painted frame doesn't start them and then have hydration restart them
// (which looked like the image jumping back / reloading).
const ready = ref(false)

// How long the loader stays before starting its exit. Long enough for the
// circles' draw-on (≈2.1s: 1.5s + 0.6s outside-in stagger) to finish first.
const HOLD_MS = 2300

// Must match the CSS opacity transition on .loader.
const FADE_MS = 1200

onMounted(() => {
  // Not arriving on the home (loaderDone already set true in app.vue): nothing
  // to play.
  if (loaderDone.value) return

  // Respect reduced motion: skip the show + fade, reveal immediately.
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    finish()
    return
  }
  ready.value = true
  window.setTimeout(() => {
    phase.value = 'out'
    // Reveal the home (and header/footer in app.vue) once the fade completes.
    // Timer-driven (not transitionend) so it always fires.
    window.setTimeout(finish, FADE_MS)
  }, HOLD_MS)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="!loaderDone"
      class="loader"
      :class="{ 'loader--out': phase === 'out', 'loader--ready': ready }"
      aria-hidden="true"
    >
      <div class="loader__panel">
        <!-- Dotted circles that draw themselves on while the loader holds. -->
        <div class="loader__circles">
          <DottedCircles color="#fff" :stroke_width="1.5" :sketch="false" :draw="true" :play="ready ? 'in' : null" />
        </div>
        <!-- Mobile: 3 identical copies scrolling left forever (seamless loop),
             like the home logo marquee. Desktop: only the first copy is shown. -->
        <div class="loader__track">
          <img v-for="n in 3" :key="n" src="/TexteTMSLOADER.svg" alt="" class="loader__text" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.loader {
  position: fixed;
  inset: 0;
  // Above the header (z-index 500) and overlay (400) so it covers everything.
  z-index: 2000;
  pointer-events: none;
  overflow: hidden;
  opacity: 1;
  transition: opacity 1.2s ease;
}

.loader__panel {
  position: absolute;
  inset: 0;
  background: var(--app-color-primary, #820fc1);
  display: flex;
  align-items: center;
  justify-content: center;

  // Mobile: start the marquee flush against the left edge (like the home),
  // so the logo begins at the start of the image rather than centred.
  @media (max-width: 768px) {
    justify-content: flex-start;
  }
}

// White dotted circles behind the loader text (same 85% footprint as the home),
// so the drawn-on circles line up with the home's circles when the loader fades.
.loader__circles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 85%;
  transform: translate(-50%, -50%);
  z-index: 0;

  // Mobile: mirror the home (.hero-circles) — rotate the wide circles SVG 90°.
  @media (max-width: 768px) {
    width: calc(100vh * 0.9);
    transform: translate(-50%, -50%) rotate(90deg);
  }

  // Plain white outlines here — no difference blend.
  :deep(.dotted-circles) {
    mix-blend-mode: normal;
  }
}

// Wrapper around the logo copies. Desktop: centres the single logo. Mobile:
// left→right scrolling marquee (translateX by one copy = seamless loop).
.loader__track {
  position: relative;
  z-index: 1; // above the circles
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;

  @media (max-width: 768px) {
    width: auto;
    flex-shrink: 0;
  }
}

.loader__text {
  // Desktop: same footprint as the home hero logo (.hero-svg is width: 75%),
  // and only the first copy is shown (copies 2-3 are for the mobile marquee).
  width: 75%;
  height: auto;

  &:nth-child(n + 2) {
    display: none;
  }

  // Mobile: big like the home logo (.hero-svg is height: 60vh on mobile); all
  // three copies sit in a row to feed the marquee.
  @media (max-width: 768px) {
    width: auto;
    height: 60vh;
    flex-shrink: 0;

    &:nth-child(n + 2) {
      display: block;
    }
  }
}

// Animations start only once the client has mounted (.loader--ready), so the
// SSR-painted frame doesn't begin them and have hydration restart them — that
// restart looked like the image jumping back / reloading.
.loader--ready {
  @media (max-width: 768px) {
    .loader__track { animation: loader-marquee 20s linear infinite; }
  }
  @media (min-width: 769px) {
    .loader__text { animation: loader-float 3s ease-in-out infinite; }
  }
}

// Continuous left scroll — one copy = -100%/3, so the loop is seamless.
@keyframes loader-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-100% / 3)); }
}

// Gentle vertical bob for the desktop loader logo (matches the home hero-float).
@keyframes loader-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2%); }
}

// Exit: the whole loader simply fades out.
.loader--out {
  opacity: 0;
}
</style>
