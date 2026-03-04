<template>
    <section class="v-app-projects-list"
    >
      <div class="v-app-projects-list__filters">
        <button>All</button>
        <button v-for="filter of filters">{{filter.title}}</button>
      </div>
      <div class="v-app-projects-list__projects app-grid app-grid--direction-column">

        <nuxt-link :to="`/works/${project.slug}`"
                   v-for="project of projects"
                   class="v-app-projects-list__projects__item app-grid"
        >
          <div class="app-grid__col-6">
            <div class="app-grid">
              <div class="app-grid__col-4" >
                <div class="app-text-strong">{{project.title}}</div>
              </div>
              <div class="app-grid__col-4" >
                <div class="app-text-strong">services</div>
                <div v-for="sector of project.sectors">{{sector.title}}</div>
              </div>
              <div class="app-grid__col-4" >
                <div class="app-text-strong">sector</div>
                <div v-for="sector of project.sectors">{{sector.title}}</div>
              </div>
            </div>

            <div>
              <p class="app-color-grey">{{project.baseline}}</p>
            </div>
          </div>

          <div class="app-grid__col-6">
            <div class="app-grid">
              <template v-for="item of project.gallery">
                <video v-if="item.small.url.endsWith('.mp4')"
                       muted
                       autoplay
                       loop
                       :src="item.small.url"
                       class="app-grid__col-4"
                />
                <img class="app-grid__col-4"
                     v-else
                     :src="item.small.url"
                />
              </template>
            </div>
          </div>

        </nuxt-link>

      </div>
    </section>
</template>





<script setup lang="ts">
import { defineProps } from 'vue'
import type {CMS_API_Page_projet} from "#shared/cms_api";

const props = defineProps<{
  filters: {title: string, slug: string}[]
  projects: CMS_API_Page_projet[]
}>()

</script>





<style lang="scss" scoped >
.v-app-projects-list__projects__item {
  border-top: solid 1px var(--app-color-dark);
  padding-top: var(--app-gutter);
  color: inherit;
  text-decoration: inherit;
}
</style>
