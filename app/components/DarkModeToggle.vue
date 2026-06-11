<template>
  <button
    class="sticker-toggle"
    :class="{ 'is-on': isOn, 'sticker-toggle--inline': inline }"
    :aria-pressed="isOn"
    aria-label="Toggle transparent 3D"
    @click="toggle"
  >
    <span class="sticker-toggle__knob" />
  </button>
</template>

<script setup lang="ts">
import { useTransparentMode } from '~/composables/useTransparentMode'

const props = withDefaults(defineProps<{
  modelValue?: boolean  // controlled mode — when provided, isOn uses this
  inline?: boolean      // removes fixed viewport positioning (for footer use)
}>(), {
  modelValue: undefined,
  inline: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { isOn: transparentOn, toggle: transparentToggle } = useTransparentMode()

const isOn = computed(() =>
  props.modelValue !== undefined ? props.modelValue : transparentOn.value
)

function toggle() {
  if (props.modelValue !== undefined) {
    emit('update:modelValue', !props.modelValue)
  } else {
    transparentToggle()
  }
}
</script>

<style scoped lang="scss">
/* ── tweakables ─────────────────────────────────────────────── */
$pill-width:        5rem;
$pill-width-mobile: 4rem;    // smaller pill on mobile (≤768px)
$border:       2px;
$color:        #820FC1;
$bg:           #ffffff;
$knob-inset:   8%;       // distance from pill edge to knob (off state)
$knob-height:  70%;      // knob diameter relative to pill height
$ease:         0.25s ease;

/* sticker effect — inner glow fading from edge to center
   (= the inset shadow equivalent of StickerParagraph's stacked glow strokes) */
$glow-pill:    12px;     // pill inner-glow blur radius
$glow-knob:    6px;      // knob inner-glow blur radius
$glow-alpha:   0.65;

/* ── pill ──────────────────────────────────────────────────── */
.sticker-toggle {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 150;

  // Same proportions as the original SVG asset. Defined ON the element (not
  // :root) — a scoped <style> rewrites `:root` to `:root[data-v-…]`, which never
  // matches <html>, so the var was undefined → aspect-ratio invalid → height 0
  // → the button was invisible.
  --pill-ratio: 93 / 46;
  width: $pill-width;
  aspect-ratio: var(--pill-ratio);
  border-radius: 9999px;
  border: none;
  background: $bg;
  padding: 0;
  margin: 0;
  cursor: pointer;
  box-sizing: border-box;

  // Sticker effect: inner glow does double duty — it both defines the visible
  // edge (no hard border) and creates the soft gradient toward the center.
  box-shadow: inset 0 0 $glow-pill rgba($color, $glow-alpha);

  transition:
    background-color $ease,
    box-shadow       0.35s ease;

  // Inline mode: let the parent control positioning (footer use case).
  // `!important` beats the mobile @media rule below without extra selectors.
  &.sticker-toggle--inline {
    position: static !important;
    right: auto !important;
    left: auto !important;
    bottom: auto !important;
    z-index: auto;
  }

  // ON state — invert colors (same idea as StickerParagraph `inverted`)
  &.is-on {
    background: $color;
    box-shadow: inset 0 0 $glow-pill rgba($bg, $glow-alpha);
  }

  // Mobile: anchored to the 3D viewer (its positioned ancestor, .viewer-section)
  // instead of the viewport. Horizontally centered on the page (left offset by
  // half the fixed pill width, so it stays centered without a transform that
  // would clash with the :hover scale). bottom stays 1.5rem from the viewer.
  @media (max-width: 768px) {
    position: absolute;
    right: auto;
    // Slightly smaller pill on mobile; keep it horizontally centered using the
    // reduced width so the left offset still lands it in the middle.
    width: $pill-width-mobile;
    left: calc(50% - #{$pill-width-mobile} / 2);
  }
}

/* ── knob ──────────────────────────────────────────────────── */
.sticker-toggle__knob {
  position: absolute;
  top: 50%;
  left: $knob-inset;
  // Use translate() (same function as the on state) so the transform property
  // interpolates smoothly — translateY() vs translate() snaps instantly and
  // causes the knob to "jump out" at the start of the transition.
  transform: translate(0, -50%);

  height: $knob-height;
  aspect-ratio: 1;
  border-radius: 50%;
  border: none;
  background: $bg;
  box-sizing: border-box;

  // Same sticker inner-glow as the pill, scaled smaller for the knob
  box-shadow: inset 0 0 $glow-knob rgba($color, $glow-alpha);

  // Only transform animates — animating `left` is a layout property that janks
  // on mobile (visible as the knob stuttering / not settling fully to a side).
  transition:
    transform        $ease,
    background-color $ease,
    box-shadow       $ease;

  // Slide to the right edge via transform only. 142.6% of the knob's own width
  // is the exact off→on travel for the current geometry (pill ratio 93/46, 8%
  // inset, 70% knob height); because every term scales with the pill width, the
  // same percentage stays correct at any pill size (desktop and mobile).
  .is-on & {
    transform: translate(142.6%, -50%);
    background: $color;
    box-shadow: inset 0 0 $glow-knob rgba($bg, $glow-alpha);
  }

  // Hover grow only on devices with a real pointer. On touch the :hover state
  // sticks after a tap, so the scale would fire mid-toggle and leave the knob
  // offset / not fully to one side.
  @media (hover: hover) {
    .sticker-toggle:hover & {
      transform: translate(0, -50%) scale(1.06);
    }

    .sticker-toggle.is-on:hover & {
      transform: translate(142.6%, -50%) scale(1.12);
    }
  }
}
</style>
