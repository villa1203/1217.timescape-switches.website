export function decodeObfuscatedHTML(
  obfuscatedText: string,
  propsToUpdate: Ref<string>,
) {

  let mouseMoved = false

  function decodeEncodedBlocks(text: string) {
    return text.replaceAll(/:::decode\s([\s\S]*?):::/g, (fullMatch, encodedText: string) => {
      return `${atob(encodedText)}`
    })
  }

  function onUserGesture() {
    if (mouseMoved) return

    mouseMoved = true
    window.setTimeout(() => {
      propsToUpdate.value = decodeEncodedBlocks(obfuscatedText)
    }, 500)
  }

  window.addEventListener('mousemove', onUserGesture)
  window.addEventListener('touchstart', onUserGesture)
}

