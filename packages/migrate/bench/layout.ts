/**
 * Where a template's words land in Chromium, and how far a conversion moves
 * them: shared by the fidelity benchmark (run.ts) and the smoke test (smoke.ts).
 */

/** Word positions compared in Chromium (see `layoutScore`). */
export interface Layout {
  words: number;
  /** Share of the original's words the conversion doesn't render visibly. */
  missing: number;
  /** Share of words more than 48px off sideways, after removing a uniform shift. */
  moved: number;
  /** Times the text runs back up the page where the original runs down (blocks put side by side). */
  jumps: number;
  /** The original is wider than the window (a fixed-width table): the conversion can't match it there. */
  overflows?: boolean;
}

/** Images decoded and web fonts loaded. */
export const SETTLED = `(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 5000); })));
})()`;

/** A word, where it lands, and its font size in px. */
export type Word = { w: string; x: number; y: number; s?: number };

/** Every visible word with its position (strings: no bundler helpers reach the page). */
export const WORDS = `(() => {
  const hidden = (el) => {
    for (; el && el !== document.body; el = el.parentElement) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0" || cs.maxHeight === "0px") return true;
    }
    return false;
  };
  const found = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent || "";
    if (!text.trim() || hidden(node.parentElement)) continue;
    const re = /\\S+/g;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const range = document.createRange();
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const r = range.getBoundingClientRect();
      if (r.width < 1 || r.height < 4) continue;
      const w = m[0].toLowerCase().replace(/[^\\p{L}\\p{N}]/gu, "");
      if (w) found.push({ w, x: r.left, y: r.top + window.scrollY, s: parseFloat(getComputedStyle(node.parentElement).fontSize) });
    }
  }
  return found;
})()`;

/**
 * Pixel diffs on mostly-white emails stay low even when columns collapse, so
 * layout is compared through words: each of the original's words is matched
 * to the same occurrence in the conversion.
 */
export function layoutScore(original: Word[], converted: Word[]): Layout {
  const pairs = matchWords(original, converted);
  // The whole email shifted sideways (left-aligned vs centred) isn't a layout change.
  const dxs = pairs.map(([o, c]) => c.x - o.x).sort((p, q) => p - q);
  const offset = dxs[Math.floor(dxs.length / 2)] ?? 0;
  let jumps = 0;
  for (let i = 1; i < pairs.length; i++) {
    const [[o0, c0], [o1, c1]] = [pairs[i - 1], pairs[i]];
    if (o1.y - o0.y >= -2 && c1.y - c0.y < -20) jumps++;
  }
  return {
    words: original.length,
    missing: original.length ? 1 - pairs.length / original.length : 0,
    moved: pairs.length ? pairs.filter(([o, c]) => Math.abs(c.x - o.x - offset) > 48).length / pairs.length : 0,
    jumps,
  };
}

/** Each of the original's words paired with the same occurrence in the conversion. */
function matchWords(original: Word[], converted: Word[]): Array<[Word, Word]> {
  const pool = new Map<string, Word[]>();
  for (const word of converted) pool.set(word.w, [...(pool.get(word.w) ?? []), word]);
  const pairs: Array<[Word, Word]> = [];
  for (const word of original) {
    const match = pool.get(word.w)?.shift();
    if (match) pairs.push([word, match]);
  }
  return pairs;
}

/** The original's words shown at another font size in the conversion (more than 1px off). */
export function resizedWords(original: Word[], converted: Word[]): string[] {
  return matchWords(original, converted)
    .filter(([o, c]) => o.s !== undefined && c.s !== undefined && Math.abs(o.s - c.s) > 1)
    .map(([o, c]) => `${o.w} ${o.s}px→${c.s}px`);
}
