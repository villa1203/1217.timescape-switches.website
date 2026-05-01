<template>
  <Teleport to="body">
    <div class="research-overlay" :class="{ 'is-open': isOpen }">

      <!-- Top-left: shabbat countdown — same position as nav left -->
      <div class="overlay-corner overlay-corner--tl">
        <StickerText :text="shabbatText" :font_size="24" :stroke_width="20" />
      </div>

      <!-- Top-right: Research + Info — same position as nav right -->
      <div class="overlay-corner overlay-corner--tr">
        <StickerButton
          text="Research"
          @click="toggle"
          :font_size="24"
          :stroke_width="20"
          color="var(--app-color-secondary)"
        />
        <NuxtLink to="/info" @click="close" class="overlay-nav-link">
          <StickerText text="Info" :font_size="24" :stroke_width="20" />
        </NuxtLink>
      </div>

      <!-- Bottom-left: footer text — same as homepage footer -->
      <div class="overlay-corner overlay-corner--bl">
        <StickerText
          :text="`Design Research On Ritual\nConstraints And Domestic Technology`"
          :font_size="24"
          :stroke_width="20"
        />
      </div>

      <!-- Body: left preview + right list -->
      <div class="overlay-body">

        <!-- Left half: 3D model -->
        <div class="overlay-preview">
          <Transition name="scene">
            <div v-if="activeObject" :key="activeObject.id" class="preview-mount">
              <component :is="activeObject.component" mode="plain" />
            </div>
          </Transition>
        </div>

        <!-- Right half: hierarchy + list -->
        <div class="overlay-list">
          <div class="list-content">

            <span class="list-label">Origin</span>

            <div class="design-time">
              <StickerText text="Design & Time" :font_size="32" :stroke_width="22" />
            </div>

            <span class="list-label">Objects</span>

            <ul class="objects-list">
              <li
                v-for="obj in objects"
                :key="obj.id"
                class="objects-list__item"
                @mouseenter="activeObject = obj"
                @mouseleave="activeObject = null"
              >
                <StickerText
                  :text="obj.label"
                  :font_size="38"
                  :stroke_width="26"
                  :color="activeObject?.id === obj.id ? 'var(--app-color-secondary)' : 'var(--app-color-primary)'"
                />
              </li>
            </ul>

          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, defineAsyncComponent } from 'vue'
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'
import { useResearchOverlay } from '~/composables/useResearchOverlay'

const { isOpen, close, toggle } = useResearchOverlay()
const { text: shabbatText } = useShabbatCountdown()

const ThreeKettle    = defineAsyncComponent(() => import('./ThreeKettle.vue'))
const ThreeSwitch    = defineAsyncComponent(() => import('./ThreeSwitch.vue'))
const ThreeFridge    = defineAsyncComponent(() => import('./ThreeFridge.vue'))
const ThreeElevator  = defineAsyncComponent(() => import('./ThreeElevator.vue'))
const ThreePlugtimer = defineAsyncComponent(() => import('./ThreePlugtimer.vue'))
const ThreeLamp      = defineAsyncComponent(() => import('./ThreeLamp.vue'))

const objects = [
  { id: 'kettle',    label: 'Kettle',               component: ThreeKettle },
  { id: 'switch',    label: 'Kosher Switch',         component: ThreeSwitch },
  { id: 'fridge',    label: 'Shabbat Refrigerator',  component: ThreeFridge },
  { id: 'elevator',  label: 'Elevator',              component: ThreeElevator },
  { id: 'plugtimer', label: 'Plug Timer',            component: ThreePlugtimer },
  { id: 'lamp',      label: 'Kosher Lamp',           component: ThreeLamp },
]

const activeObject = ref<typeof objects[0] | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(isOpen, (val) => {
  if (val) {
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
    activeObject.value = null
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
/* ── overlay shell ── */
.research-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #ffffff;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &.is-open {
    opacity: 1;
    pointer-events: all;
  }
}

/* ── corners — mirror the nav padding exactly ── */
.overlay-corner {
  position: absolute;
  z-index: 2;
  padding: var(--app-grid-gap);

  &--tl { top: 0; left: 0; }
  &--tr {
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  &--bl {
    bottom: 0;
    left: 0;
    padding-left: 0;
    padding-right: 0;
  }
}

.overlay-nav-link {
  text-decoration: none;
}

/* ── split body ── */
.overlay-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;
}

/* ── left: 3D preview ── */
.overlay-preview {
  position: relative;
  overflow: hidden;
}

.preview-mount {
  position: absolute;
  inset: 0;

  :deep(.scene-wrapper) {
    height: 100% !important;
  }
}

/* ── right: list ── */
.overlay-list {
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.list-label {
  font-family: 'Sligoil', sans-serif;
  font-size: 1rem;
  letter-spacing: 0.06em;
  font-weight: 800;
  text-transform: uppercase;
  color: #820FC1;
  opacity: 1;
  padding-left: 0.0.5rem;
  line-height: 1.6;
}

.design-time {
  margin-bottom: 1.2rem;
}

.objects-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

.objects-list__item {
  cursor: default;
  transition: transform 0.15s ease;

  &:hover {
    transform: translateX(-6px);
  }
}

/* ── 3D scene transition ── */
.scene-enter-active { transition: opacity 0.25s ease; }
.scene-leave-active  { transition: opacity 0.15s ease; }
.scene-enter-from,
.scene-leave-to      { opacity: 0; }
</style>
