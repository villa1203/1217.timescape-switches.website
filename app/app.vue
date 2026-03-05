<template>
  <div class="v-app"
  >

    <P5Background />

    <div class="v-app__header app-grid">
      <AppNav/>
    </div>

    <main>
      <NuxtPage/>
    </main>

    <div class="v-app__footer app-grid">
      <AppFooter/>
    </div>
  </div>
</template>


<script setup lang="ts">

useRouter().afterEach(() => {
  document.body.classList.remove('v-block--is-visible')
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
</style>
