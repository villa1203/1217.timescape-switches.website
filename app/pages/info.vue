<template>
  <main class="v-info"
  >
    <AppLayoutColumns>
      <template v-slot:first>

        <div class="app-grid app-grid--justify-center">
          <div class="app-grid__col-12" >
            <img src="/TexteTMSINFO.svg" alt="TMS Info" class="hero-svg" style="width: 100%" />
          </div>
        </div>

        <Blocks
          v-if="data?.result.content_secondary"
          :content="data?.result.content_secondary"
        />
      </template>
      <template v-slot:second>
        <Blocks
          v-if="data?.result.content"
          :content="data?.result.content"
        />
      </template>
    </AppLayoutColumns>

    <!-- 3D Viewer Section -->
    <!-- <div class="viewer-section">
      <ThreeSwitch :mode="viewerMode" />
    </div> -->
  </main>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import type {CMS_API_Response, CMS_BlockData} from "#shared/cms_api";
import AppLayoutColumns from "~/components/AppLayoutColumns.vue";
import { seoSelect, siteSeoSelect } from "#shared/KQLQueries";
import { useCmsSeo, type CmsSeoFields, type CmsSiteSeo } from "~/composables/useCmsSeo";

const viewerMode = ref('normal')

type FetchData = CMS_API_Response & {
  "result": {
    "title": string,
    "slug": string,
    content: CMS_BlockData[]
    content_secondary: CMS_BlockData[]
    site: CmsSiteSeo
  } & CmsSeoFields
}

const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  // Not lazy: SEO meta must be in the server-rendered HTML for crawlers.
  method: 'POST',
  body: {
    query: `page('infos')`,
    select: {
      title: true,
      slug: true,
      content: {
        query: `page.content.content.toBlocks`,
      },
      content_secondary: {
        query: `page.content.content_secondary.toBlocks`,
      },
      ...seoSelect('page'),
      site: { query: 'site', select: siteSeoSelect() },
    }
  }
})

useCmsSeo(() => ({
  page: data.value?.result,
  site: data.value?.result?.site,
  path: '/info',
  fallbackTitle: data.value?.result?.title,
}))

</script>


<style lang="scss" scoped>
.v-info {

.viewer-section {
  position: relative;
  width: 100%;
  height: 100vh;
}

.viewer-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

.viewer-controls button {
  padding: 10px 20px;
  background: white;
  border: 2px solid #000;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.viewer-controls button:hover {
  background: #f0f0f0;
}

.viewer-controls button.active {
  background: #000;
  color: #fff;
}
}
</style>

.viewer-section {
  position: relative;
  width: 100%;
  height: 100vh;
}

.viewer-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

.viewer-controls button {
  padding: 10px 20px;
  background: white;
  border: 2px solid #000;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.viewer-controls button:hover {
  background: #f0f0f0;
}

.viewer-controls button.active {
  background: #000;
  color: #fff;
}
