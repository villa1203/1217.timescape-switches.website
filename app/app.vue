<template>
  <div class="v-app"
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
    <DarkModeToggle />
  </div>
</template>


<script setup lang="ts">
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

.v-app--dark {
  background-color: #000000;

  /* Make all backgrounds black */
  :deep(*) {
    background-color: #000000 !important;
  }
}

.v-app__header {
  overflow-x: hidden;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 300; // above the Research overlay (z-index: 200)
}

.v-app__footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 300; // above the Research overlay (z-index: 200)
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
