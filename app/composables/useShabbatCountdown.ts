export const useShabbatCountdown = () => {
  const text = useState('shabbatCountdown', () => 'Weekly Timescape')
  return { text }
}
