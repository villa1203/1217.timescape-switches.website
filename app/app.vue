<template>
  <div class="v-app"
  >

    <div class="v-app__header app-grid">
      <AppNav/>
    </div>

    <main>
      <NuxtPage :transition="{
        name: 'fade',
        }" />
    </main>

    <div class="v-app__footer app-grid">
      <AppFooter/>
    </div>
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
}

.v-app__header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 100;
}

.v-app-footer {
  position: fixed;
  bottom: 0;
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
