// Object-page "transparent" (glass) 3D mode. Backed by the SAME shared state as
// the dark-mode toggle (`previewDark`, see useDarkMode) so the two are a single
// linked mode: enabling dark mode on the home also renders the objects' 3D in
// glass mode, and toggling the object-page switch also turns on the dark
// aesthetic — it's conceptually one button.
export const useTransparentMode = () => {
  const isOn   = useState('previewDark', () => false)
  const toggle = () => { isOn.value = !isOn.value }
  return { isOn, toggle }
}
