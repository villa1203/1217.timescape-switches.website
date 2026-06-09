/**
 * Initial app loader state.
 *
 * `loaderDone` is false on first load (SSR included) and flips to true once the
 * loader has finished its blob exit animation. It gates the header/footer
 * reveal in app.vue, and (via useState) persists across client-side navigation
 * so the loader only ever plays once per session.
 */
export const useAppLoader = () => {
  const loaderDone = useState('appLoaderDone', () => false)
  const finish = () => { loaderDone.value = true }
  return { loaderDone, finish }
}
