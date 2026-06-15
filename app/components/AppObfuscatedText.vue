<template>
    <div class="v-app-obfuscated-text"
         data-nosnippet
         v-html="decodedText"
    />
</template>





<script setup lang="ts">
import { defineProps } from 'vue'
import {decodeObfuscatedHTML} from "~/utils/decodeObfuscatedHTML";

const props = defineProps<{
    text: string
}>()

const decodedText = ref(props.text)

onMounted(() => {
  const tempText = props.text.replaceAll(':::decode', '').replaceAll(':::', '')
  decodedText.value = tempText
  decodeObfuscatedHTML(props.text, decodedText)
})


</script>





<style lang="scss" scoped >
.v-app-obfuscated-text {
}
</style>
