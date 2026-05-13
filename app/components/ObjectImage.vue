<template>
  <figure class="object-image">
    <img
      :src="src"
      :alt="alt || ''"
      class="object-image__img"
    />
    <figcaption v-if="caption" class="object-image__caption caption" v-html="caption" />
  </figure>
</template>

<script setup lang="ts">
defineProps<{
  src: string
  alt?: string
  caption?: string
}>()
</script>

<style scoped lang="scss">
.object-image {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.object-image__img {
  display: block;
  width: 100%;
  max-width: 28rem;
  height: auto;
  border-radius: 1.5rem;
  object-fit: cover;
}

.object-image__caption {
  margin-top: 0.75rem;
}
</style>
