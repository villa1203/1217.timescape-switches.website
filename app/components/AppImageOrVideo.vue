<template>
    <div class="v-app-image-or-video"
    >
      <video v-if="src.endsWith('.mp4')" :src="src" autoplay loop muted />
      <img v-else
           :src="src"
           :alt="src"
      />
    </div>
</template>





<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
    src: string
}>()
</script>





<style lang="scss" scoped >
.v-app-image-or-video {
  width: 100%;
}

img, video {
  display: block;
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}
</style>
