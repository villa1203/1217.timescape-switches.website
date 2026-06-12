<template>
  <div class="v-app" :class="{ 'v-app--home': isHome, 'v-app--dark': isDark }"
  >

    <div class="v-app__header app-grid" :class="{ 'is-revealed': loaderDone }">
      <AppNav/>
    </div>

    <main>
      <NuxtPage :transition="{
        name: 'fade',
        mode: 'out-in'
        }" />
    </main>

    <div class="v-app__footer app-grid" :class="{ 'is-revealed': loaderDone, 'v-app__footer--scroll-hidden': footerHidden }">
      <AppFooter/>
    </div>

    <ResearchOverlay />

    <AppLoader />
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'
import { useAppLoader } from '~/composables/useAppLoader'
import {initMatomo, updateMatomoWithNavigation} from "#shared/matomo";


if (import.meta.client) {
    initMatomo()
    useRouter().afterEach((to, from) => {
        updateMatomoWithNavigation(from.fullPath)
    })
}


// Header/footer stay hidden until the initial loader finishes.
const { loaderDone } = useAppLoader()

const route = useRoute()
// The header/footer fade gradient is shown everywhere except the home page.
const isHome = computed(() => route.path === '/')

// Shared scroll signals (set by AppNav): the footer (text + white gradient) is
// hidden while scrolling down or while at the very top of the page, but always
// shown at the very bottom — and always shown on the home page.
const hiddenOnScroll = useState('uiScrollHidden', () => false)
const atTop = useState('uiAtTop', () => true)
const atBottom = useState('uiAtBottom', () => false)
const footerHidden = computed(() =>
  !isHome.value && !atBottom.value && (hiddenOnScroll.value || atTop.value),
)

// The loader only plays when arriving directly on the home. On any other entry
// point (object/info pages…), skip it so the chrome shows immediately. Set in
// setup (runs on SSR too) so the header/footer render already revealed there.
if (route.path !== '/') loaderDone.value = true

// Two SEPARATE looks, each with its own preview flag (persist for the session):
//  • ?shabbat → the real weekly Shabbat look: black background + centred title
//    replacing the logo + locked nav/footer. Driven by `isShabbat`.
//  • ?dark    → the bottom-right toggle's dark aesthetic only (hidden globe,
//    purple circles, dark logo). No title, no lock. Driven by `previewDark`.
const { isShabbat } = useShabbatCountdown()
const previewDark = useState('previewDark', () => false)
onMounted(() => {
  if ('shabbat' in route.query) isShabbat.value = true
  if ('dark' in route.query) previewDark.value = true
})
// Black-background mode = real Shabbat only (the toggle's dark aesthetic does
// NOT darken the page background — it stays a distinct, lighter look).
const isDark = computed(() => isShabbat.value)

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
    // New pages load scrolled to the top: reset the footer scroll signals so it
    // starts hidden (at top) rather than inheriting the previous page's state.
    hiddenOnScroll.value = false
    atTop.value = true
    atBottom.value = false
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
      transition: opacity 0.3s ease;
    }

    // Fade the gradient out together with the footer text on scroll down.
    &.v-app__footer--scroll-hidden::before {
      opacity: 0;
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

// Initial reveal: header slides down from the top, footer up from the bottom,
// once the loader's blob exit has finished (.is-revealed added in app.vue).
.v-app__header,
.v-app__footer {
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease;
}
.v-app__header:not(.is-revealed) {
  transform: translateY(-100%);
  opacity: 0;
  pointer-events: none;
}
.v-app__footer:not(.is-revealed) {
  transform: translateY(100%);
  opacity: 0;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .v-app__header,
  .v-app__footer {
    transition: none;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
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
