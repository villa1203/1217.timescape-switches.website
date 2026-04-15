<template>
  <div class="v-app"
  >
    <div class="v-app__header app-grid">
      <AppNav/>
    </div>
    <main>
      <NuxtPage/>
    </main>
    <div>
      <AppFooter/>
    </div>
  </div>
</template>


<script setup lang="ts">

</script>


<style lang="scss" scoped>
.v-app__header {
  overflow-x: hidden;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 100;
}
</style>
