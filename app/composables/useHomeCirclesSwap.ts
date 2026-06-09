/**
 * Drives the home background circles' left↔right swap animation.
 *
 * Set `swapped` to true to play it. Used both when the Research overlay opens
 * and when navigating to the Info page from the home (so leaving the home
 * carries the same circle transition). index.vue resets it on mount.
 */
export const useHomeCirclesSwap = () => {
  const swapped = useState('homeCirclesSwapped', () => false)
  return { swapped }
}
