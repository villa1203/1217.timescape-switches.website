<template>
    <nav class="v-nav app-with-padding--left-right app-with-padding--top-bottom"
    >
      <div class="app-grid app-grid--justify-between">
        <div>
        </div>

<!--        <div>-->
<!--          <div class="app-grid">-->
<!--            <div>-->
<!--              <StickerButton text="Research" to="/Research" :font-size="24" :stroke-width="20" />-->
<!--            </div>-->

<!--            <div>-->
<!--              <StickerButton text="Info" to="Info" :font-size="24" :stroke-width="20" />-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->


      </div>
    </nav>
</template>





<script setup lang="ts">
import UIOpen from "~/components/UIOpen.vue";

const infosIsOpen = ref(false)



</script>





<style lang="scss" scoped >
.v-nav {
  width: 100%;
  position: relative;
}

.v-nav__infos {
  position: absolute;
  top: var(--app-gutter);
  left: var(--app-gutter);
  width: 30rem;
  background: hsla(0, 0%, 0%, 0.25);
  border-radius: .75rem;
  color: white;
  padding: 5rem .75rem .75rem;
  z-index: 0;
}

.infos-is-open {
  background: transparent;
  transition: none;
  backdrop-filter: none;

  .toggle-infos {
    transform: rotate(45deg);
  }
}
</style>
