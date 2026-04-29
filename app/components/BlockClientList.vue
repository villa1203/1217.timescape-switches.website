<template>
  <div class="v-block block-client-list app-with-padding--left-right">

    <div class="app-grid">

      <div class="app-grid__col-5 app-rm-child-margin">
        <h2>{{block_data.content.title}}</h2>
      </div>

      <div class="app-grid__col-7">
        <div class="app-block-client-list__clients app-grid app-grid--align-start app-grid--justify-start app-grid--wrap app-grid--no-gap">
          <div class="app-block-client-list__clients__item"
               v-for="client of data?.result?.content"
          >
            <div class="app-grid app-grid--align-center app-grid--justify-center app-aspect-ratio--1-1">
              <img class="block-client-list__logo"
                   v-if="client.logo?.reg.url"
                   :src="client.logo?.reg.url"
              />
              <div v-else
                   class="block-client-list__name"
              >{{client.title}}</div>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockClientList} from "#shared/cms_api"

defineProps<{
  block_data: CMS_BlockClientList,
}>()

type FetchData = CMS_API_Response & {
  "result"?: {
    "title"?: string,
    "slug"?: string,
    content?: {
      title?: string,
      logo?: CMS_API_ImageInstance
    }[],
  }
}

const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('clients')`,
    select: {
      title: true,
      slug: true,
      content: {
        query: 'page.children',
        select: {
          title: true,
          logo: {
            query: `page.logo.toFiles.first`,
            select: {
              alt: "file.alt.value",
              tiny: 'file.resize(50, null, 10)',
              small: 'file.resize(500)',
              reg: 'file.resize(1280)',
              large: 'file.resize(1920)',
              xxl: 'file.resize(2500)',
              focus: 'file.focus',
            }
          }
        }
      },
    },
  },
})

</script>


<style lang="scss" scoped>
.app-block-client-list__clients {
  width: 100%;
  box-sizing: border-box;
  border-top: 1px solid var(--app-color-dark);
  border-left: 1px solid var(--app-color-dark);
}

.app-block-client-list__clients__item {
  border-right: 1px solid black;
  border-bottom: 1px solid black;
  box-sizing: border-box;
  width: calc(100% / 4);
  background: white;
}

.block-client-list__logo {
  display: block;
  width: 60%;
  height: auto;
}
.block-client-list__name {
  text-align: center;
  font-size: 2vw;
}
</style>
