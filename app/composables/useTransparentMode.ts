// Shared state for the object-page bottom-right switch.
// When `isOn` is true the slug page renders its 3D model in transparent
// ("glass") mode; otherwise it stays in normal mode with the hover xray reveal.
export const useTransparentMode = () => {
  const isOn   = useState('transparentMode_isOn', () => false)
  const toggle = () => { isOn.value = !isOn.value }
  return { isOn, toggle }
}
