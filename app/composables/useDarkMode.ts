/**
 * Whether the site is in its "dark" appearance — driven only by the manual
 * toggle (previewDark). The Shabbat auto-trigger has been removed.
 */
export const useDarkMode = () => {
  const previewDark = useState('previewDark', () => false)
  return { isDark: previewDark }
}
