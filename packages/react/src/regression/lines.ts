/** One tag per line, so a change in a snapshot shows as the lines it touches. */
export function lines(html: string): string {
  return `${html.replace(/>\s*</g, ">\n<").trim()}\n`;
}

/**
 * What a reader gets from an HTML document, whatever markup holds it: the body's words, where its links go and its
 * images, each in order. What only Outlook reads (in a conditional comment) isn't in it, nor the characters no one sees
 * (the filler after an email's preview text, which keeps an inbox from showing the body there).
 */
export function reads(html: string): { words: string[]; links: string[]; images: string[] } {
  const body = new DOMParser().parseFromString(html, "text/html").body;
  body.querySelectorAll("style, script").forEach((node) => node.remove());
  // Each tag is a boundary: blocks hold no space between them, and textContent would run their words together.
  const walker = body.ownerDocument.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const words: string[] = [];
  while (walker.nextNode()) words.push(...(walker.currentNode.nodeValue ?? "").replace(/[\p{Cf}\u034f]/gu, "").split(/\s+/).filter(Boolean));
  return {
    words,
    links: Array.from(body.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")!),
    images: Array.from(body.querySelectorAll("img")).map((img) => `${img.getAttribute("src")} ${img.getAttribute("alt") ?? ""}`.trim()),
  };
}
