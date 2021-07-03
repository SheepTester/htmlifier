export default function getDataUrl (blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (reader.result) {
        if (typeof reader.result !== 'string') {
          throw new TypeError('reader.result is not a string.')
        }
        resolve(reader.result)
      } else {
        reject(
          new RangeError(
            'The file might be too large to store as a JavaScript string. (I could not generate a data URI from the file) Try generating a .zip instead?'
          )
        )
      }
    })
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
