<template>
<!--  todo: endroit pour layout des pages -->
    <section class="v-app-layout-columns app-with-padding--left-right"
    >
      <div class="app-grid">
        <div class="app-grid__col-6" >
          <slot name="first"/>
        </div>
        <div class="app-grid__col-6" >
          <slot name="second"/>
        </div>
      </div>
    </section>
</template>





<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
    message?: string
}>()
</script>





<style lang="scss" scoped >
.v-app-layout-columns {
}
</style>
