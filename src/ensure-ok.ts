export function toText (response: Response): Promise<string> {
  if (response.ok) {
    return response.text()
  } else {
    return Promise.reject(
      new Error(`Received HTTP ${response.status} error for ${response.url}`)
    )
  }
}

export function toBlob (response: Response): Promise<Blob> {
  if (response.ok) {
    return response.blob()
  } else {
    return Promise.reject(
      new Error(`Received HTTP ${response.status} error for ${response.url}`)
    )
  }
}
