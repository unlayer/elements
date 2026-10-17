/**
 * UTF-8 text as base64 and back, as @unlayer/exporters' Menu does it: it writes a link's click handler as a
 * `data-onclick-encoded` attribute (React leaves out an `onclick` given as a string), then as `onclick` decoded.
 * With TextEncoder, TextDecoder, btoa and atob, which every runtime Elements runs in has (the exporters' first choice).
 */
export function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(binary);
}

export function decodeBase64(base64: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
}
