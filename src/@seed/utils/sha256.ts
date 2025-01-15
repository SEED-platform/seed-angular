export const sha256 = async (text: string) => {
  // Encode the string as UTF-8
  const data = new TextEncoder().encode(text)

  // Calculate SHA-256 digest
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Convert ArrayBuffer to byte array
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // Convert bytes to hex string
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('')
}
