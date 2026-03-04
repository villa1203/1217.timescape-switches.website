<template>
  <main class="v-works"
  >
    <AppRAndomProjects/>

    <div v-if="data?.result?.projects" class="app-with-padding--left-right">
      <AppProjectsList
        :filters="[
          {title: 'Art Direction', slug: 'art-direction'},
          {title: 'Visual Identity', slug: 'indentite'},
          {title: 'Brand Strategy', slug: 'strategy'},
          {title: 'Web Development', slug: 'web-development'},
          {title: 'Web Design', slug: 'Web Design'},
        ]"
        :projects="getProjectBySector('commercial' ,data.result.projects)"
      />
    </div>


  </main>
</template>


<script setup lang="ts">
import type {CMS_API_ImageInstance, CMS_API_Page_projet, CMS_API_Response, CMS_BlockData} from "#shared/cms_api";
import AppProjectsPreview__list from "~/components/AppProjectsPreview__list.vue";
import AppRAndomProjects from "~/components/AppRAndomProjects.vue";
import {KQL_QUERY_BLOCKS} from "#shared/KQLQueries";
import {getProjectBySector} from "#shared/projects_utils";

type FetchData = CMS_API_Response & {
  "result": {
    "title": string,
    "slug": string,
    content: CMS_BlockData[],
    projects: CMS_API_Page_projet[]
  }
}


const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('projects')`,
    select: {
      title: true,
      slug: true,
      projects: {
        query: 'page.children',
        select: {
          title: true,
          baseline: true,
          slug: true,
          sectors: {
            query: 'page.sectors.toPages',
            select: {
              title: true,
              slug: true,
            },
          },
          gallery: {
            query: 'page.gallery.toFiles',
            select: {
              alt: "file.alt.value",
              tiny: 'file.resize(50, null, 10)',
              small: 'file.resize(500)',
              reg: 'file.resize(1280)',
              large: 'file.resize(1920)',
              xxl: 'file.resize(2500)',
              focus: 'file.focus',
            },
          },
          miniature: {
            query: 'page.covers.toFiles.first',
            select: {
              alt: "file.alt.value",
              tiny: 'file.resize(50, null, 10)',
              small: 'file.resize(500)',
              reg: 'file.resize(1280)',
              large: 'file.resize(1920)',
              xxl: 'file.resize(2500)',
              focus: 'file.focus',
            },
          }
        }
      },
      content: KQL_QUERY_BLOCKS
    }
  }
})
</script>


<style lang="scss" scoped>
.v-works {
}
</style>
