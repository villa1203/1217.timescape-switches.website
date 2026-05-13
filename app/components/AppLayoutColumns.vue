<template>
    <section class="v-app-layout-columns app-with-padding--left-right"
    >
      <div class="app-grid v-app-layout-columns__grid">
        <div class="app-grid__col-6 v-app-layout-columns__col v-app-layout-columns__col--first" >
          <slot name="first"/>
        </div>
        <div class="app-grid__col-6 v-app-layout-columns__col" >
          <slot name="second"/>
        </div>
      </div>
    </section>
</template>


<script setup lang="ts">
defineProps<{
    message?: string
}>()
</script>


<style lang="scss" scoped >
.v-app-layout-columns {
  height: calc(100vh - var(--app-header-height, 0px) - var(--app-footer-height, 0px));
  box-sizing: border-box;
}

.v-app-layout-columns__grid {
  height: 100%;
}

.v-app-layout-columns__col {
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: var(--app-color-primary) transparent;
  padding-top: 6rem;
  padding-bottom: 6rem;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--app-color-primary);
    border-radius: 4px;
  }

  // Fade content into the page background at top and bottom of the scroll area.
  // mask transparent ⇒ content invisible ⇒ parent (white) shows through.
  $fade: 4rem;
  -webkit-mask-image: linear-gradient(to bottom,
                       transparent 0,
                       black $fade,
                       black calc(100% - #{$fade}),
                       transparent 100%);
          mask-image: linear-gradient(to bottom,
                       transparent 0,
                       black $fade,
                       black calc(100% - #{$fade}),
                       transparent 100%);
}
</style>
