<template>
    <nuxt-link class="v-app-project-preview app-rm-child-margin"
               :to="`works/${slug}`"
    >
      <template v-if="covers_video">
        <video class="v-app-project-preview__cover"
               muted loop autoplay
               :src="covers_video"
        />
      </template>
      <template v-else>
        <img class="v-app-project-preview__cover"
             :src="image?.reg.url"
        />
      </template>
      <div>
        <h2 class="app-text-reg app-text-strong app-no-margin">{{title}}</h2>
        <p class="app-text-reg app-no-margin">{{baseline}}</p>
      </div>
    </nuxt-link>
</template>



<script setup lang="ts">
import { defineProps } from 'vue'
import type {CMS_API_ImageInstance} from "#shared/cms_api";

defineProps<{
  image?: CMS_API_ImageInstance,
  covers_video?: string,
  title: string,
  baseline: string,
  slug: string,
}>()
</script>





<style lang="scss" scoped >
.v-app-project-preview {
  color: inherit;
  text-decoration: inherit;
}

.v-app-project-preview__cover {
  display: block;
  width: 100%;
  object-fit: cover;
  aspect-ratio: 3/2;
  padding-bottom: .5rem;
}
</style>
