<template>
    <nuxt-link class="v-app-project-preview--list app-rm-child-margin"
               :to="`/works/${slug}`"
    >
      <button class="v-app-project-preview--list__title">{{title}}</button>
      <img class="v-app-project-preview--list__cover"
           v-if="image?.large.url"
           :src="image.large.url"
      />
    </nuxt-link>
</template>



<script setup lang="ts">
import { defineProps } from 'vue'
import type {CMS_API_ImageInstance} from "#shared/cms_api";

defineProps<{
  image?: CMS_API_ImageInstance,
  title?: string,
  baseline?: string,
  slug?: string,
}>()
</script>





<style lang="scss" scoped >
.v-app-project-preview--list {
  color: inherit;
  text-decoration: inherit;
  position: relative;
}

.v-app-project-preview--list__title {
  position: absolute;
  top: var(--app-gutter);
  left: var(--app-gutter);
}

.v-app-project-preview--list__cover {
  display: block;
  width: 100%;
  object-fit: cover;
  aspect-ratio: 4/5;
}
</style>
