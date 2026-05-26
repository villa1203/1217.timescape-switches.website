<template>
  <div class="v-app" :class="{ 'v-app--home': isHome, 'v-app--dark': isDark }"
  >

    <div class="v-app__header app-grid">
      <AppNav/>
    </div>

    <main>
      <NuxtPage :transition="{
        name: 'fade',
        mode: 'out-in'
        }" />
    </main>

    <div class="v-app__footer app-grid">
      <AppFooter/>
    </div>

    <ResearchOverlay />
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'

const route = useRoute()
// The header/footer fade gradient is shown everywhere except the home page.
const isHome = computed(() => route.path === '/')

// Dark (black-background) mode is on during Shabbat. `?shabbat` (or `?dark`) in
// the URL forces it on so the look can be previewed outside of Shabbat. The
// preview flag persists across client-side navigation for the session.
const { isShabbat } = useShabbatCountdown()
const previewDark = useState('previewDark', () => false)
onMounted(() => {
  if ('shabbat' in route.query || 'dark' in route.query) previewDark.value = true
})
const isDark = computed(() => isShabbat.value || previewDark.value)

// Shabbat: only the home is accessible. If Shabbat turns on while the user is
// on another page, send them home (navigation between pages is handled by the
// global `shabbat` middleware).
watch(isDark, (dark) => {
  if (dark && route.path !== '/') navigateTo('/')
})

// Dark background goes on <body> so it sits behind the z-index:-1 P5 canvas.
useHead({
  bodyAttrs: {
    class: computed(() => (isDark.value ? 'app-is-dark' : '')),
  },
})

useRouter().afterEach(() => {
  if (import.meta.client) {
    document.body.classList.remove('v-block--is-visible')
  }
})
</script>


<style lang="scss" scoped>
.v-app {
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  padding-top: var(--app-header-height);
  padding-bottom: var(--app-footer-height);
  transition: background-color 0.8s ease;
}

// NB: the dark background lives on <body> (see the global block at the bottom),
// NOT on .v-app — a background here would paint over the z-index:-1 P5 canvas
// and hide the sketch. .v-app--dark stays as a hook for targeted dark overrides.

.v-app__header {
  overflow-x: hidden;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  // Desktop: header sits above the Research overlay (z-index: 400) so the
  // "Weekly Timescape" countdown stays visible while the overlay is open.
  // Mobile: keep below the overlay so the full-screen overlay covers the nav.
  z-index: 300;
  @media (min-width: 769px) {
    z-index: 500;
  }

  // Mobile: white→transparent gradient behind the nav so page content fades
  // out as it scrolls up under the fixed header (white near the top, fading at
  // the bottom edge). Solid for the top portion to keep the nav legible.
  @media (max-width: 768px) {
    background: linear-gradient(
      to bottom,
      var(--app-color-light, #fff) 0%,
      var(--app-color-light, #fff) 65%,
      transparent 100%
    );
  }
}

.v-app__footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  // Same logic as the header — visible above the overlay on desktop, hidden on mobile.
  z-index: 300;
  @media (min-width: 769px) {
    z-index: 500;
  }
  // Footer is purely decorative text — never intercept clicks/scroll on the page below.
  // Setting on both wrapper and descendants (pointer-events doesn't cascade by default).
  &, * { pointer-events: none; }

  // Mobile: white→transparent gradient behind the footer so content fades out
  // as it scrolls down under it. Drawn on a pseudo-element that extends above
  // the footer box (taller fade) without shifting the footer text.
  @media (max-width: 768px) {
    &::before {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: calc(100% + 5rem);
      background: linear-gradient(
        to top,
        var(--app-color-light, #fff) 0%,
        var(--app-color-light, #fff) 45%,
        transparent 100%
      );
      z-index: -1;
      pointer-events: none;
    }
  }
}


// Home page: no header/footer fade gradient (it has its own full-bleed layout).
@media (max-width: 768px) {
  .v-app--home {
    .v-app__header { background: none; }
    .v-app__footer::before { display: none; }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>


<!-- Global (non-scoped): dark page background on <body>, behind the P5 canvas. -->
<style lang="scss">
body {
  transition: background-color 0.8s ease;
}
body.app-is-dark {
  background-color: #000000;
}
</style>
