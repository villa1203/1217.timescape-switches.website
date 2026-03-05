<template>
    <nav class="v-nav app-with-padding--left-right app-with-padding--top-bottom"
    >
      <div class="app-grid app-grid--justify-between">

        <div class="app-button" style="z-index: 10"
             :class="{'infos-is-open': infosIsOpen}"
        >
          <div class="app-grid app-grid--align-center">
            <nuxt-link to="/">
              <img src="/logo.svg" role="button"/>
            </nuxt-link>
            <div @click="infosIsOpen = !infosIsOpen">
              <div class="toggle-infos">
                <UIOpen/>
              </div>
            </div>
          </div>
        </div>

        <div v-if="infosIsOpen"
             class="app-rm-child-margin v-nav__infos"
        >
          <p>
            <span class="app-text-strong">informations</span>
            <br>Daisy Chain is a new motion studio co-directed by Harry Butt and Connor Campbell with a focus on playful, experimental, vibrant aesthetics.</p>
          <p>We work with 3D, 2D and generative animation to create music videos, brand identities and typography in motion.</p>

          <p>
            <span class="app-text-strong">Get in touch</span>
            <br>295 Hoxton Street
            <br>London
            <br>N1 5JX
          </p>

          <div style="margin-top: 10rem; padding-bottom: 1rem;">
            <span class="app-button app-button--negative">Instagram</span>
            <span class="app-button app-button--negative">LinkedIn</span>
          </div>

        </div>

        <nav class="app-grid app-grid--justify-end"
             style="gap: .5rem"
        >
          <nuxt-link class="app-button" to="/works">works</nuxt-link>
<!--          <nuxt-link class="app-button" to="/office">office</nuxt-link>-->
          <nuxt-link class="app-button" to="/research">research</nuxt-link>
        </nav>

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
