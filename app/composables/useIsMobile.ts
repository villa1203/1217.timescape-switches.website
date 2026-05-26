import { ref, onMounted, onUnmounted } from 'vue'

export function useIsMobile(maxWidth = 768) {
  const isMobile = ref(false)

  let mql: MediaQueryList | null = null
  const update = () => {
    if (mql) isMobile.value = mql.matches
  }

  onMounted(() => {
    mql = window.matchMedia(`(max-width: ${maxWidth}px)`)
    isMobile.value = mql.matches
    mql.addEventListener('change', update)
  })

  onUnmounted(() => {
    if (mql) mql.removeEventListener('change', update)
  })

  return { isMobile }
}
