export const useShabbatCountdown = () => {
  const text = useState('shabbatCountdown', () => 'Weekly Timescape')
  // True while we're currently between candle-lighting and havdalah (Shabbat).
  // Drives the site's dark (black-background) mode.
  const isShabbat = useState('isShabbat', () => false)
  return { text, isShabbat }
}
