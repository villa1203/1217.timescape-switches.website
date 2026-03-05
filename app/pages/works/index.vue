<template>
  <main class="v-works"
  >
    <AppRandomProjects
      v-if="data?.result?.projects"
      :projects="data.result.projects"
    />

    <div v-if="data?.result?.projects" class="app-with-padding--left-right">
      <AppProjectsList
        :filters="[
          {title: 'Art Direction', slug: 'art-direction'},
          {title: 'Visual Identity', slug: 'visual-identity'},
          {title: 'Motion Design', slug: 'motion-design'},
          {title: 'Brand Strategy', slug: 'brand-strategy'},
          {title: 'Web Development', slug: 'web-development'},
          {title: 'Web Design', slug: 'web-design'},
        ]"
        :projects="getProjectBySector('commercial' ,data.result.projects)"
      />
    </div>


  </main>
</template>


<script setup lang="ts">
import type {CMS_API_Page_projet, CMS_API_Response, CMS_BlockData} from "#shared/cms_api";
import {KQL_PROJECTS_SELECT, KQL_QUERY_BLOCKS} from "#shared/KQLQueries";
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
        select: KQL_PROJECTS_SELECT,
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
