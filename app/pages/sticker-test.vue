<template>
  <div class="sticker-test">

    <!-- ── Controls ───────────────────────────────────────────────────── -->
    <div class="controls">
      <label>
        stroke_width <strong>{{ stroke_width }}</strong>
        <input type="range" min="10" max="60" v-model.number="stroke_width" />
        <span class="hint">outer blob — bigger connects words/lines</span>
      </label>
      <label>
        border_size <strong>{{ border_size }}</strong>
        <input type="range" min="2" max="30" v-model.number="border_size" />
        <span class="hint">visible colored ring — smaller = more white</span>
      </label>
      <label>
        font_size <strong>{{ font_size }}</strong>
        <input type="range" min="12" max="60" v-model.number="font_size" />
      </label>
      <label>
        line_height <strong>{{ line_height }}</strong>
        <input type="range" min="0.8" max="2.0" step="0.05" v-model.number="line_height" />
        <span class="hint">lower = lines merge tighter</span>
      </label>
      <label>
        max_width <strong>{{ max_width }}</strong>
        <input type="range" min="200" max="900" step="10" v-model.number="max_width" />
      </label>
    </div>

    <!-- ── Live preview ────────────────────────────────────────────────── -->
    <div class="section">
      <div class="label">Live — paragraph</div>
      <StickerParagraph
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        :stroke_width="stroke_width"
        :border_size="border_size"
        :font_size="font_size"
        :line_height="line_height"
        :max_width="max_width"
      />
    </div>

    <div class="section">
      <div class="label">Live — headline</div>
      <StickerParagraph
        text="Design Research On Ritual Constraints And Domestic Technology"
        :stroke_width="stroke_width"
        :border_size="border_size"
        :font_size="font_size + 14"
        :line_height="line_height"
        :max_width="max_width"
      />
    </div>

    <div class="section">
      <div class="label">Live — orange (secondary)</div>
      <StickerParagraph
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        variant="secondary"
        :stroke_width="stroke_width"
        :border_size="border_size"
        :font_size="font_size"
        :line_height="line_height"
        :max_width="max_width"
      />
    </div>

    <!-- ── Reference ──────────────────────────────────────────────────── -->
    <div class="section">
      <div class="label">Reference — StickerText (single word/label)</div>
      <StickerParagraph
        :text="`Lorem ipsum dolor\nconsectetur adipiscing`"
        :font_size="font_size"
        :stroke_width="stroke_width"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ disableShabbat: true })

const stroke_width = ref(37)
const border_size  = ref(24)
const font_size    = ref(20)
const line_height  = ref(1.3)
const max_width    = ref(600)
</script>

<style lang="scss" scoped>
.sticker-test {
  padding: 3rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  background: #ffffff;
  min-height: 100vh;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: white;
  padding: 1.2rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.controls label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: #444;
  min-width: 180px;

  strong {
    color: #820FC1;
    font-size: 1rem;
  }

  input[type=range] {
    accent-color: #820FC1;
    width: 180px;
  }
}

.hint {
  font-size: 0.65rem;
  color: #999;
  font-family: sans-serif;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.label {
  font-family: 'Sligoil', sans-serif;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #820FC1;
}
</style>
