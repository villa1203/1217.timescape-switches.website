<script setup lang="ts">
/**
 * Sticker-styled close button used by the Research overlay.
 *
 * Sits fixed at the top-right of the viewport with a z-index high enough to
 * stay above both the overlay it closes (z-index: 400) and the app header
 * which stays visible during the overlay on desktop (z-index: 500).
 *
 * Open/closed state:
 *   - open=true  → visible, clickable, fades in alongside the overlay.
 *   - open=false → faded out and pointer-events: none, so it doesn't intercept
 *                  clicks while the overlay is closed.
 *
 * Note on vertical alignment: the "×" character sits low in the font's em box
 * (centered around the math axis), so it appears further from the top than
 * letters with ascenders. The CSS below compensates with a reduced top
 * padding so the visible × lines up with the nav's Research/Info labels.
 */
const props = withDefaults(
  defineProps<{
    open?:      boolean
    font_size?: number
    color?:     string
  }>(),
  {
    open:      false,
    font_size: 40,
    color:     'var(--app-color-primary)',
  },
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const isHovered = ref(false)
</script>

<template>
  <button
    class="overlay-close-button"
    :class="{ 'overlay-close-button--open': open }"
    :aria-hidden="!open"
    :tabindex="open ? 0 : -1"
    aria-label="Close"
    type="button"
    @click="emit('close')"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <StickerParagraph
      text="×"
      :font_size="font_size"
      :color="color"
      :inverted="isHovered"
    />
  </button>
</template>

<style lang="scss" scoped>
.overlay-close-button {
  position: fixed;
  // Anchor to the very corner; the inner padding below puts the visible ×
  // glyph at the same distance from the edges as the nav's Research/Info
  // buttons (the nav uses `app-with-padding` = padding: var(--app-grid-gap)
  // on all sides). The padded zone outside the glyph remains clickable, so
  // the hit area extends all the way into the corner.
  top: 0;
  right: 0;
  // Sits above both the Research overlay (z-index: 400) and the app header
  // (z-index: 500 on desktop) so the click target is never intercepted.
  z-index: 600;

  background: none;
  border: none;
  // Right/bottom/left use the same gap as the nav padding (1rem).
  // Top is reduced because "×" sits low in the font's em box — without this
  // compensation the visible × glyph appears ~10px lower than the nav's
  // Research/Info labels with identical 1rem padding.
  padding: 0.25rem var(--app-grid-gap, 1rem) var(--app-grid-gap, 1rem);
  margin: 0;
  cursor: pointer;
  font: inherit;
  line-height: 1;

  // Hidden by default; fades in when `open` becomes true. Same 0.3s curve as
  // the overlay itself so they appear and disappear in sync.
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, transform 0.2s ease;

  &--open {
    opacity: 1;
    pointer-events: auto;
    // Fades in with the overlay. `--reveal-delay` (set by the parent on the home)
    // holds it back while the circles erase, matching the panel.
    transition: opacity 0.3s ease var(--reveal-delay, 0s), transform 0.2s ease;
  }

  &:hover {
    transform: scale(1.05);
  }
}
</style>
