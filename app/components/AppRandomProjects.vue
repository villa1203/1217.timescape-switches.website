<template>
    <section class="v-app-random-projects app-grid app-grid--justify-center app-grid--align-center"
    >
      <div class="app-grid app-grid--align-center v-app-random-projects__list">
        <nuxt-link v-for="projectInfo of listOfRandomImagesForProject"
                   :to="`/works/${projectInfo.slug}`"
        >
          <AppImageOrVideo
            :src="projectInfo.src"
          />
        </nuxt-link>
        <nuxt-link v-for="projectInfo of listOfRandomImagesForProject"
                   :to="`/works/${projectInfo.slug}`"
        >
          <AppImageOrVideo
            :src="projectInfo.src"
          />
        </nuxt-link>
      </div>
    </section>
</template>





<script setup lang="ts">
import { defineProps } from 'vue'
import type {CMS_API_Page_projet} from "#shared/cms_api";

const props = defineProps<{
    projects:CMS_API_Page_projet[]
}>()

const listOfRandomImagesForProject: ComputedRef<{ slug: true; src: string }[]> = computed(() => {
  return props.projects.map(project => {
    return {
      slug: project.slug,
      src: getRandomImageOrVideoImageOfProject(project),
    }
  })
})

function getRandomImageOrVideoImageOfProject(project: CMS_API_Page_projet): string {
  const listOfImageUrls: string[] = project.gallery.map(image => image.reg.url)

  if( project.cover?.reg.url ) listOfImageUrls.push( project.cover.reg.url )
  if( project.covers_video?.url ) listOfImageUrls.push(project.covers_video.url)

  const randomIndex = Math.floor(Math.random() * listOfImageUrls.length)

  return listOfImageUrls[randomIndex] || listOfImageUrls[0]!
}

</script>





<style lang="scss" >
.v-app-random-projects {
  width: 100%;
  height: calc( 100vh - 10rem);
  overflow: hidden;
}


.v-app-random-projects__list {
  animation: slide-in 10s linear infinite;

  &:hover {
    animation-play-state: paused;
  }
}

@keyframes slide-in {
  from {
    transform: translateX(0%);
  }

  to {
    transform: translateX(-200%);
  }
}


.v-app-random-projects {
  img, video {
    display: block;
    width: 20vw;
    aspect-ratio: 3/2;
  }
}
</style>
