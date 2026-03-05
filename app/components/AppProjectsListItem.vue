<template>
  <nuxt-link :to="`/works/${project.slug}`"
             class="v-app-projects-list__projects__item app-grid"
  >
    <div class="app-grid__col-6">
      <div class="app-grid">
        <div class="app-grid__col-4" >
          <div class="app-text-strong">{{project.title}}</div>
        </div>
        <div class="app-grid__col-4" >
          <div class="app-text-strong">services</div>
          <div v-for="sector of project.services" :key="sector.title">{{sector.title}} / {{sector.slug}}</div>
        </div>
        <div class="app-grid__col-4" >
          <div class="app-text-strong">sector</div>
          <div v-for="sector of project.sectors" :key="sector.title">{{sector.title}}</div>
        </div>
      </div>

      <div>
        <p class="app-color-grey">{{project.baseline}}</p>
      </div>
    </div>

    <div class="app-grid__col-6 v-app-projects-list__gallery"
         :class="{
          'has-scroll': project.gallery.length > 3,
          'hide-gradient': hideGradient
         }"
    >
      <div class="app-grid app-grid--justify-end v-app-projects-list__gallery__container"
           @scroll="onScrollInGallery"
      >
        <template v-for="(item, index) of project.gallery" :key="index">
          <video class="app-grid__col-4 v-app-projects-list__visual app-grid__shrink-0"
                 v-if="item.small.url.endsWith('.mp4')"
                 muted
                 autoplay
                 loop
                 :src="item.small.url"
          />
          <img class="app-grid__col-4 v-app-projects-list__visual app-grid__shrink-0"
               v-else
               :src="item.small.url"
          />
        </template>
      </div>
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type {CMS_API_Page_projet} from "#shared/cms_api";

defineProps<{
  project: CMS_API_Page_projet
}>()

const hideGradient = ref(false)

function onScrollInGallery(e: Event) {
  if (!(e.target instanceof HTMLElement)) return
  hideGradient.value = e.target.scrollLeft > 250;
}
</script>

<style lang="scss" scoped>
.v-app-projects-list__projects__item {
  border-top: solid 1px var(--app-color-dark);
  padding-top: var(--app-gutter);
  color: inherit;
  text-decoration: inherit;
}

.v-app-projects-list__visual {
  aspect-ratio: 16/9;
  object-fit: cover;
}

.v-app-projects-list__gallery {
  position: relative;

  &.has-scroll {
    &::after {
      z-index: 5;
      content: "";
      position: absolute;
      top: 0;
      right: 0;
      width: calc(100% / 5);
      height: 100%;
      transition: all .25s ease-in-out;
      background: linear-gradient(to left, var(--app-color-light) 0%, hsla(0, 0%, 100%, 0) 100%);
      pointer-events: none;
    }
  }
  &.hide-gradient::after {
    transform: translateX(100%);
  }
}

.v-app-projects-list__gallery__container {
  width: 100%;
  overflow: hidden;

  .has-scroll & {
    overflow: scroll;
    justify-content: flex-start;
  }
}
</style>
