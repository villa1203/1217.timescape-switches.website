import { computed } from 'vue'
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'

/**
 * Whether the site is in its dark (Shabbat) appearance — true during Shabbat,
 * or when forced via the `?shabbat` / `?dark` preview flag (shared `previewDark`
 * state, set in app.vue).
 */
export const useDarkMode = () => {
  const { isShabbat } = useShabbatCountdown()
  const previewDark = useState('previewDark', () => false)
  const isDark = computed(() => isShabbat.value || previewDark.value)
  return { isDark }
}
