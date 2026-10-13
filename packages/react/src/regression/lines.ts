/** One tag per line, so a change in a snapshot shows as the lines it touches. */
export function lines(html: string): string {
  return `${html.replace(/>\s*</g, ">\n<").trim()}\n`;
}
