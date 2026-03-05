<template>
    <section class="v-app-last-projects-preview--list"
             :class="{
                'show-gradient': showGradient,
                'no-gradient': pages.length < 5,
             }"
    >
      <div class="app-grid app-grid--align-start app-grid--justify-start v-app-last-projects-preview--list__scroll app-scroll__scrollable-container"
           @scroll="onScrollInGallery"
      >
        <div v-for="project of pages"
             class="app-grid__col-3"
             style="flex-shrink: 0"
        >
          <AppProjectPreview__list
            :image="project.cover"
            :title="project.title"
            :baseline="project.baseline"
            :slug="project.slug"
          />
        </div>
      </div>

      <div class="v-app-last-projects-preview--list__button app-grid app-grid--align-start app-grid--justify-end">
        <nuxt-link to='/works' class="app-button app-button--variant-primary">see more <UIArrow/></nuxt-link>
      </div>
    </section>
</template>





<script setup lang="ts">
import type {CMS_API_Page_projet} from "#shared/cms_api";
import {defineProps} from "vue";
import AppProjectPreview__list from "~/components/AppProjectPreview__list.vue";

defineProps<{
  pages: CMS_API_Page_projet[]
}>()

const showGradient = ref(true)

function onScrollInGallery(e: Event) {
  if( ! (e.target instanceof HTMLElement) ) return

  showGradient.value = e.target.scrollLeft <= 250;
}

</script>





<style lang="scss" scoped >
.v-app-last-projects-preview--list {
  position: relative;

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
    transform: translateX(100%);
    pointer-events: none;
  }
  &.no-gradient::after {
    content: none;
  }

  &.show-gradient::after {
    transform: translateX(0);
  }
}

.v-app-last-projects-preview--list__scroll {
  overflow: scroll;
}

.v-app-last-projects-preview--list__button {
  position: relative;
  z-index: 10;
  margin-top: var(--app-gutter);
}
</style>
