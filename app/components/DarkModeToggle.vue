<template>
  <button
    class="sticker-toggle"
    :class="{ 'is-on': isOn }"
    :aria-pressed="isOn"
    aria-label="Toggle transparent 3D"
    @click="toggle"
  >
    <span class="sticker-toggle__knob" />
  </button>
</template>

<script setup lang="ts">
import { useTransparentMode } from '~/composables/useTransparentMode'

const { isOn, toggle } = useTransparentMode()
</script>

<style scoped lang="scss">
/* ── tweakables ─────────────────────────────────────────────── */
$pill-width:   5rem;
$pill-ratio:   93 / 46;  // same proportions as the original SVG asset
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

  width: $pill-width;
  aspect-ratio: #{$pill-ratio};
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
    box-shadow       $ease,
    transform        0.2s ease;

  &:hover { transform: scale(1.05); }

  // ON state — invert colors (same idea as StickerParagraph `inverted`)
  &.is-on {
    background: $color;
    box-shadow: inset 0 0 $glow-pill rgba($bg, $glow-alpha);
  }

  // Mobile: anchored to the 3D viewer (its positioned ancestor, .viewer-section)
  // instead of the viewport, so it sits at the bottom-right corner of the
  // object itself. right/bottom stay 1.5rem — now measured from the viewer.
  @media (max-width: 768px) {
    position: absolute;
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

  transition:
    left             $ease,
    transform        $ease,
    background-color $ease,
    box-shadow       $ease;

  .is-on & {
    // mirror inset on the right — same gap as the off state on the left
    left: calc(100% - #{$knob-inset});
    transform: translate(-100%, -50%);
    background: $color;
    box-shadow: inset 0 0 $glow-knob rgba($bg, $glow-alpha);
  }
}
</style>
