import { compareStyles, normalizeWord, StyledDocument, styledWords, widerScreens, type StyleDifference, type Unverified } from "./cascade";
import { compareLayout, unplaced, type LayoutDifference } from "./geometry";

/**
 * Content check: does the converted HTML still say everything the original
 * says? Compares the visible words of two HTML documents as multisets, with
 * no browser, so a dropped block, row or loop shows up as missing words. The
 * same words in another order count too: words out of place are missing.
 */

export interface TextCheck {
  /** Words the original shows and the conversion doesn't (one per lost occurrence). */
  missing: string[];
  /** Words only the conversion shows. */
  added: string[];
  /** Links (href), images (src) and image text (alt) the original has and the conversion doesn't. */
  missingAttributes: string[];
  /** Links, images and image text only the conversion has. */
  addedAttributes: string[];
  /**
   * Text shown in another style (size, bold, italics, letter case, underline,
   * color, the background behind it, a link's target), when the words are the same.
   */
  styles: StyleDifference[];
  /**
   * What couldn't be verified: a style, or whether words are shown, that one
   * side sets in a way the check can't read (with the rule or value). The
   * check fails on it: unread isn't the same.
   */
  unverified: Unverified[];
  /**
   * At a phone's width (375px): words the original shows there and the
   * conversion doesn't, and the other way round (content shown or hidden
   * only on phones).
   */
  phone: { missing: string[]; added: string[]; missingAttributes?: string[]; addedAttributes?: string[] };
  /** Text and images that sit elsewhere across the page at a desktop width (a column stacked or moved, a block on the other side). */
  layout: LayoutDifference[];
  /** How much of the styles was compared: words, and properties left out because one side couldn't be worked out. */
  styleCoverage: { words: number; unknown: number };
}

/** The width phones are read at. */
export const PHONE_WIDTH = 375;

/** Whether a check fails: a difference anywhere, or anything it couldn't verify. */
export function checkFails(check: Omit<TextCheck, "styleCoverage">): boolean {
  return Boolean(
    check.missing.length || check.added.length || check.missingAttributes.length || check.addedAttributes.length ||
    check.styles.length || check.unverified.length || phoneDiffers(check.phone) || check.layout.length
  );
}

/** A phone shows other words, links or images than the original does there. */
export function phoneDiffers(phone: TextCheck["phone"]): boolean {
  return Boolean(phone.missing.length || phone.added.length || phone.missingAttributes?.length || phone.addedAttributes?.length);
}

/**
 * The words a reader sees in `html`, as written, with meaningful numeric punctuation
 * and lone signs preserved, in order. Hidden text isn't read: display:none (inline,
 * or from a rule that applies at desktop width), the `hidden` attribute, a box that
 * clips to nothing (`max-height:0;overflow:hidden`), visibility:hidden, opacity 0.
 * The preview text (`data-skip-in-text`) is read: inboxes show it.
 */
export function htmlWords(html: string): string[] {
  return wordsOf(new StyledDocument(html));
}

function wordsOf(doc: StyledDocument, within?: Parameters<StyledDocument["words"]>[0]): string[] {
  return doc.words(within).flatMap((w) => w.word.split(/\s+/)).map(normalizeWord).filter(Boolean);
}

/**
 * The links, images and image text a reader gets: `href=` of links, `src=`
 * and `alt=` of images (alt shows when images are blocked, common in email).
 * Hidden elements and Outlook-only markup aren't counted.
 */
export function htmlAttributes(html: string): string[] {
  return attributesOf(new StyledDocument(html));
}

function attributesOf(doc: StyledDocument): string[] {
  return doc.targets().map((t) => `${t.kind} ${t.value}`);
}

/** Each link with the words it carries, and each image with its text: a URL must stay on the same link or image. */
function pairsOf(doc: StyledDocument): string[] {
  const out: string[] = [];
  const targets = doc.targets();
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (t.kind === "href") out.push(JSON.stringify(["href", t.value, t.label ?? ""]));
    if (t.kind === "src") out.push(JSON.stringify(["src", t.value, targets[i + 1]?.kind === "alt" ? targets[i + 1].value : ""]));
  }
  return out;
}

/** Compare the words, links, images and text styles two HTML documents show. */
export function compareText(originalHtml: string, convertedHtml: string): TextCheck {
  const originalDoc = new StyledDocument(originalHtml);
  const convertedDoc = new StyledDocument(convertedHtml);
  const originalWords = wordsOf(originalDoc);
  const convertedWords = wordsOf(convertedDoc);
  const counts = new Map<string, number>();
  for (const word of convertedWords) counts.set(word, (counts.get(word) ?? 0) + 1);
  const missing: string[] = [];
  for (const word of originalWords) {
    const left = counts.get(word) ?? 0;
    if (left > 0) counts.set(word, left - 1);
    else missing.push(word);
  }
  const added = [...counts].flatMap(([word, n]) => Array<string>(n).fill(word));
  // Every word there, but not in order: two values swapped places (a total
  // and a subtotal, say). The words out of place count as missing.
  if (!missing.length) {
    const moved = outOfOrder(originalWords, convertedWords);
    missing.push(...moved);
    added.push(...moved);
  }
  // Count visible occurrences; Outlook-only duplicates are already excluded.
  const originalAttributeList = attributesOf(originalDoc);
  const convertedAttributeList = attributesOf(convertedDoc);
  const missingAttributes = lostOccurrences(originalAttributeList, convertedAttributeList);
  // Added ones as a set: a renderer may repeat a link (a button's fallback), but a new destination is new.
  const originalAttributes = new Set(originalAttributeList);
  const addedAttributes = [...new Set(convertedAttributeList)].filter((item) => !originalAttributes.has(item));
  // A destination must also stay on the same link/image, even if every URL
  // still appears elsewhere in the document.
  for (const item of lostOccurrences(pairsOf(originalDoc), pairsOf(convertedDoc))) {
    const [kind, value, label] = JSON.parse(item) as [string, string, string];
    if (!missingAttributes.includes(`${kind} ${value}`)) missingAttributes.push(`${kind} ${value} (${label})`);
  }
  // A link the original doesn't have on these words (the same URL on other words is another link). As a set:
  // a renderer may repeat a link on the same words.
  const originalPairs = new Set(pairsOf(originalDoc));
  for (const item of new Set(pairsOf(convertedDoc).filter((pair) => !originalPairs.has(pair)))) {
    const [kind, value, label] = JSON.parse(item) as [string, string, string];
    if (kind === "href" && !addedAttributes.includes(`${kind} ${value}`)) addedAttributes.push(`${kind} ${value} (${label})`);
  }
  // Images in another order (two product photos swapped): the same images, but not where they were.
  const images = (list: string[]) => list.filter((item) => item.startsWith("src "));
  if (!lostOccurrences(images(originalAttributeList), images(convertedAttributeList)).length) {
    for (const item of outOfOrder(images(originalAttributeList), images(convertedAttributeList))) {
      missingAttributes.push(`${item} (out of order)`);
      addedAttributes.push(`${item} (out of order)`);
    }
  }
  // Styles are compared word for word, so only when the words are the same.
  const same = !missing.length && !added.length;
  const style = same ? compareStyles(originalDoc, convertedDoc) : { differences: [], unverified: [], compared: 0, unknown: 0 };
  const originalStyled = same ? styledWords(originalDoc) : [];
  const convertedStyled = same ? styledWords(convertedDoc) : [];
  const layout = same ? compareLayout(originalDoc, convertedDoc, originalStyled, convertedStyled) : [];
  // Where words sit that only one side can place: unverified, as a style one side sets unreadably.
  const unread: Unverified[] = same
    ? unplaced(originalDoc, convertedDoc, originalStyled, convertedStyled).map(({ side, words }) => ({ what: "where it sits", side, cause: "a width, margin, padding or display the check can't read", words }))
    : [];
  // On phones: the same words shown (content a phone rule shows or hides), as a multiset.
  const originalPhone = new StyledDocument(originalHtml, { width: PHONE_WIDTH });
  const convertedPhone = new StyledDocument(convertedHtml, { width: PHONE_WIDTH });
  const phone = { missing: [] as string[], added: [] as string[] };
  const phoneCounts = new Map<string, number>();
  for (const word of wordsOf(convertedPhone)) phoneCounts.set(word, (phoneCounts.get(word) ?? 0) + 1);
  for (const word of wordsOf(originalPhone)) {
    const left = phoneCounts.get(word) ?? 0;
    if (left > 0) phoneCounts.set(word, left - 1);
    else phone.missing.push(word);
  }
  phone.added = [...phoneCounts].flatMap(([word, n]) => Array<string>(n).fill(word));
  // Links and images too: one a phone shows or hides on one side only (a phone-only call link, a hero image).
  const phoneAttributesA = attributesOf(originalPhone);
  const phoneAttributesB = attributesOf(convertedPhone);
  const phoneLost = lostOccurrences(phoneAttributesA, phoneAttributesB).filter((item) => !missingAttributes.some((m) => m.startsWith(item)));
  const phoneAdded = [...new Set(phoneAttributesB)].filter((item) => !phoneAttributesA.includes(item) && !addedAttributes.some((a) => a.startsWith(item)));
  const phoneWithAttributes = { ...phone, ...(phoneLost.length ? { missingAttributes: phoneLost } : {}), ...(phoneAdded.length ? { addedAttributes: phoneAdded } : {}) };
  const unverified = [...style.unverified, ...unread, ...targetDoubts(originalDoc, convertedDoc), ...phoneDoubts(originalPhone, convertedPhone, style.unverified)];
  const wide = same ? widerDifferences(originalHtml, convertedHtml, style.differences, unverified, missingAttributes, addedAttributes) : { styles: [], unverified: [] };
  return { missing, added, missingAttributes, addedAttributes, styles: [...style.differences, ...wide.styles], unverified: [...unverified, ...wide.unverified], phone: phoneWithAttributes, layout, styleCoverage: { words: style.compared, unknown: style.unknown } };
}

/**
 * On screens wider than the desktop width read, where a rule for them applies
 * on either side (Tailwind's `md:`, `lg:`): the same words must show, with
 * the same links and images, in the same styles. Each difference names the
 * width it starts at; links and images are added to the lists given.
 */
function widerDifferences(originalHtml: string, convertedHtml: string, desktopStyles: StyleDifference[], desktopUnverified: Unverified[], missingAttributes: string[], addedAttributes: string[]): { styles: StyleDifference[]; unverified: Unverified[] } {
  const styles: StyleDifference[] = [];
  const unverified: Unverified[] = [];
  // What the desktop width already shows isn't listed again.
  const key = (item: StyleDifference | Unverified) => JSON.stringify({ ...item, width: undefined });
  const known = new Set([...desktopStyles, ...desktopUnverified].map(key));
  for (const width of widerScreens(originalHtml, convertedHtml)) {
    const original = new StyledDocument(originalHtml, { width });
    const converted = new StyledDocument(convertedHtml, { width });
    const [a, b] = [wordsOf(original), wordsOf(converted)];
    const lost = lostOccurrences(a, b);
    const extra = lostOccurrences(b, a);
    if (lost.length) styles.push({ property: "shown", original: "shown", converted: "hidden", words: lost, width });
    if (extra.length) styles.push({ property: "shown", original: "hidden", converted: "shown", words: extra, width });
    const [targetsA, targetsB] = [attributesOf(original), attributesOf(converted)];
    for (const item of lostOccurrences(targetsA, targetsB)) if (!missingAttributes.some((m) => m.startsWith(item))) missingAttributes.push(`${item} (on screens ${width}px and wider)`);
    for (const item of new Set(targetsB)) if (!targetsA.includes(item) && !addedAttributes.some((m) => m.startsWith(item))) addedAttributes.push(`${item} (on screens ${width}px and wider)`);
    if (lost.length || extra.length) continue;
    const check = compareStyles(original, converted);
    for (const difference of check.differences) if (!known.has(key(difference))) styles.push({ ...difference, width });
    for (const doubt of check.unverified) if (!known.has(key(doubt))) unverified.push({ ...doubt, width });
  }
  return { styles, unverified };
}

/**
 * Links and images whether a reader gets can't be told on one side only (a
 * rule with a condition or selector the check can't read around them): read
 * as shown, a lost one would pass unseen.
 */
function targetDoubts(original: StyledDocument, converted: StyledDocument): Unverified[] {
  const doubted = (doc: StyledDocument) => doc.targets().filter((t) => t.doubt).map((t) => ({ item: `${t.kind} ${t.value}`, cause: t.doubt! }));
  const a = doubted(original);
  const b = doubted(converted);
  const out = new Map<string, Unverified>();
  const add = (side: Unverified["side"], list: Array<{ item: string; cause: string }>, other: Array<{ item: string }>) => {
    const left = counts(other.map((x) => x.item));
    for (const { item, cause } of list) {
      const n = left.get(item) ?? 0;
      if (n) {
        left.set(item, n - 1);
        continue;
      }
      const entry = out.get(`${side}\u0000${cause}`) ?? { what: "shown", side, cause, words: [] };
      entry.words.push(item);
      out.set(`${side}\u0000${cause}`, entry);
    }
  };
  add("original", a, b);
  add("migrated", b, a);
  return [...out.values()];
}

const counts = (list: string[]) => list.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());

/**
 * Words whether a phone shows can't be told on one side only (a phone rule
 * with a condition or selector the check can't read): read as shown, they
 * would pass unseen. Those the desktop check already lists aren't repeated.
 */
function phoneDoubts(original: StyledDocument, converted: StyledDocument, desktop: Unverified[]): Unverified[] {
  const listed = new Set(desktop.filter((u) => u.what === "shown").flatMap((u) => u.words));
  const doubted = (doc: StyledDocument) => {
    const out = new Map<string, Array<{ word: string; cause: string }>>();
    for (const w of styledWords(doc)) if (w.doubt && !listed.has(w.word)) out.set(w.word, [...(out.get(w.word) ?? []), { word: w.word, cause: w.doubt }]);
    return out;
  };
  const a = doubted(original);
  const b = doubted(converted);
  const groups = new Map<string, Unverified>();
  const add = (side: Unverified["side"], from: Map<string, Array<{ word: string; cause: string }>>, other: Map<string, unknown[]>) => {
    for (const [word, list] of from) {
      for (const { cause } of list.slice(other.get(word)?.length ?? 0)) {
        const key = `${side}\u0000${cause}`;
        const entry = groups.get(key) ?? { what: "shown on phones", side, cause, words: [] };
        entry.words.push(word);
        groups.set(key, entry);
      }
    }
  };
  add("original", a, b);
  add("migrated", b, a);
  return [...groups.values()];
}

/**
 * Words of `original` outside the longest sequence the two share in order.
 * Past a size limit, every word between the shared start and end.
 */
function outOfOrder(original: string[], converted: string[]): string[] {
  let start = 0;
  while (start < original.length && start < converted.length && original[start] === converted[start]) start++;
  let end = 0;
  while (end < original.length - start && end < converted.length - start && original[original.length - 1 - end] === converted[converted.length - 1 - end]) end++;
  const a = original.slice(start, original.length - end);
  const b = converted.slice(start, converted.length - end);
  if (!a.length) return [];
  if (a.length * b.length > 1_000_000) return a;
  // Longest common subsequence, then the words of `a` it leaves out.
  const width = b.length + 1;
  const table = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] = a[i] === b[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }
  const out: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) {
      i++;
      j++;
    } else if (j < b.length && table[i * width + j + 1] >= table[(i + 1) * width + j]) {
      j++;
    } else {
      out.push(a[i++]);
    }
  }
  return out;
}

function lostOccurrences(original: string[], converted: string[]): string[] {
  const counts = new Map<string, number>();
  for (const value of converted) counts.set(value, (counts.get(value) ?? 0) + 1);
  return original.filter((value) => {
    const count = counts.get(value) ?? 0;
    if (!count) return true;
    counts.set(value, count - 1);
    return false;
  });
}

/**
 * Classes a document's stylesheets hide everywhere (`.hide{display:none}`, outside
 * media queries): hidden though no inline style says so. A rule in a media query
 * (dark mode, phones) applies only sometimes, so it doesn't count.
 */
export function hiddenClasses(html: string): Map<string, { important: boolean }> {
  const out = new Map<string, { important: boolean }>();
  for (const [, sheet] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    const css = withoutAtRules(sheet.replace(/\/\*[\s\S]*?\*\//g, ""));
    for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const hide = /(?:^|;)\s*display\s*:\s*none\s*(!\s*important)?/i.exec(body);
      if (!hide) continue;
      for (const selector of selectors.split(",")) {
        const name = /^\s*\.([\w-]+)\s*$/.exec(selector)?.[1];
        if (name) out.set(name, { important: Boolean(hide[1]) || Boolean(out.get(name)?.important) });
      }
    }
  }
  return out;
}

/**
 * `html` with display:none written on the elements `classes` hide: unless their own style
 * sets a display, which wins over a class rule that isn't `!important`.
 */
export function hideClasses(
  html: string,
  classes: ReadonlyMap<string, { important: boolean }>,
  /** Whether an element with these classes is hidden, when another rule (`.show{display:block}`) can win: by default any hiding class hides it. */
  hides?: (names: string[]) => boolean
): string {
  if (!classes.size) return html;
  return html.replace(/<([a-z][\w-]*)((?:\s(?:"[^"]*"|'[^']*'|[^'">])*)?)>/gi, (tag, name: string, attrs: string) => {
    const names = /\sclass\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(attrs);
    const list = names ? (names[1] ?? names[2]).split(/\s+/) : [];
    const rules = list.flatMap((c) => classes.get(c) ?? []);
    if (!rules.length || (hides && !hides(list))) return tag;
    const style = /\sstyle\s*=\s*"([^"]*)"/i.exec(attrs);
    if (style && /(?:^|;)\s*display\s*:/i.test(style[1]) && !rules.some((rule) => rule.important)) return tag;
    if (style) return tag.replace(style[0], ` style="${style[1].replace(/;?\s*$/, ";")}display:none"`);
    const selfClosing = /\/\s*$/.test(attrs);
    return `<${name}${attrs.replace(/\/\s*$/, "")} style="display:none"${selfClosing ? "/" : ""}>`;
  });
}

/** CSS without its at-rule blocks (@media, @supports, @font-face). */
function withoutAtRules(css: string): string {
  let out = "";
  for (let i = 0; i < css.length; ) {
    const at = css.indexOf("@", i);
    if (at < 0) return out + css.slice(i);
    out += css.slice(i, at);
    const open = css.indexOf("{", at);
    const semi = css.indexOf(";", at);
    if (open < 0 || (semi >= 0 && semi < open)) {
      i = semi < 0 ? css.length : semi + 1;
      continue;
    }
    let depth = 1;
    let j = open + 1;
    for (; j < css.length && depth; j++) depth += css[j] === "{" ? 1 : css[j] === "}" ? -1 : 0;
    i = j;
  }
  return out;
}

