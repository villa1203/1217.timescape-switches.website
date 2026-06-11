<script setup lang="ts">
definePageMeta({ layout: false })
</script>

<template>
  <div class="globe-page">
    <WireframeGlobe />
  </div>
</template>

<style scoped>
.globe-page {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
}
</style>
