/**
 * Beefree's rich text as an Unlayer text block's HTML, cleaned as Beefree's own exporter cleans it: the editor's
 * attributes (`data-mce-style`) and pasted comments (Figma's) out, line heights left to the block (Beefree stores
 * the px each line had in the editor), paragraphs without margins (Beefree spaces them with `paragraphSpacing`), and
 * TinyMCE's wrapper `<div>` lifted into the block's own settings.
 */
import { decodeEntities, escapeHtml, getAttr, parseStyle, serialize, setAttr, singleRoot, styleString, tokenize, type StartTag, type Token } from "./html";

/** Declarations that only held the editor's measured line heights. */
const LINE_HEIGHT = /^(line-height|mso-line-height-alt|mso-line-height-rule)$/;

/** Declarations Beefree's editor adds to every paragraph and span, which change nothing in a text block. */
const NOISE = (name: string, value: string) => name === "word-break" && /^break-word$/i.test(value);

/** A tag's style without some declarations (dropping `style` when nothing's left). */
function restyle(tag: StartTag, edit: (declarations: Array<[string, string]>) => Array<[string, string]>): void {
  const before = getAttr(tag, "style");
  if (before === undefined) {
    const added = edit([]);
    if (added.length) setAttr(tag, "style", styleString(added));
    return;
  }
  const after = edit(parseStyle(before));
  setAttr(tag, "style", after.length ? styleString(after) : undefined);
}

/** A tag without the editors' own attributes and classes. */
function withoutEditorMarks(tag: StartTag): void {
  tag.attrs = tag.attrs.filter(([name]) => !name.startsWith("data-mce-") && name !== "data-mce-bogus");
  const classes = getAttr(tag, "class");
  if (classes !== undefined) {
    const kept = classes.split(/\s+/).filter((name) => name && !/^(tinyMce-placeholder|txtTinyMce-wrapper|mce-[\w-]+)$/.test(name));
    setAttr(tag, "class", kept.length ? kept.join(" ") : undefined);
  }
}

/** Spans left with no attributes (a placeholder's): their content without them. */
function unwrapBareSpans(tokens: Token[]): Token[] {
  const out: Token[] = [];
  const dropped: boolean[] = [];
  for (const token of tokens) {
    if (token.kind === "start" && token.name === "span" && !token.selfClosing) {
      const bare = token.attrs.length === 0;
      dropped.push(bare);
      if (!bare) out.push(token);
    } else if (token.kind === "end" && token.name === "span") {
      if (!dropped.pop()) out.push(token);
    } else out.push(token);
  }
  return out;
}

/**
 * Beefree's merge tags and special links (`<code data-bee-code data-bee-type="mergetag">{{first_name}}</code>`, or
 * with the tag in `data-bee-value` and a `<q>no-content</q>` placeholder inside) as the text they stand for, which is
 * what Beefree exports: the sending platform fills them in.
 */
function mergeTags(tokens: Token[]): Token[] {
  const out: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.kind !== "start" || token.name !== "code" || token.selfClosing || !token.attrs.some(([name]) => name === "data-bee-code")) {
      out.push(token);
      continue;
    }
    let depth = 1;
    let end = i + 1;
    for (; end < tokens.length; end++) {
      const next = tokens[end];
      if (next.kind === "start" && next.name === "code" && !next.selfClosing) depth++;
      else if (next.kind === "end" && next.name === "code" && --depth === 0) break;
    }
    const inner = tokens.slice(i + 1, end);
    const value = getAttr(token, "data-bee-value");
    if (value !== undefined && decodeEntities(value).trim()) out.push({ kind: "text", text: escapeHtml(decodeEntities(value)) });
    else {
      // Without a value, what it shows is the tag (`{{contact.first_name}}`): the placeholder aside.
      const placeholder = (k: number) => inner[k]?.kind === "start" && (inner[k] as StartTag).name === "q" && inner[k + 1]?.kind === "text" && /^no-content$/.test((inner[k + 1] as { text: string }).text.trim()) && inner[k + 2]?.kind === "end";
      for (let k = 0; k < inner.length; k++) {
        if (placeholder(k)) k += 2;
        else out.push(inner[k]);
      }
    }
    i = end;
  }
  return out;
}

export interface CleanOptions {
  /** Paragraphs get `margin: 0` (and this spacing below each but the last), as Beefree exports them. */
  paragraphs?: { spacing?: string };
  /**
   * Links' color, as Beefree exports them: `color` on every link (over the link's own: a `paragraph`'s link color),
   * else `fallback` on links without one of their own (the legacy `text` module's, or the body's).
   */
  links?: { color?: string; fallback?: string };
}

/** Rich text tokens cleaned (see the module comment). */
function clean(tokens: Token[], options: CleanOptions = {}): Token[] {
  const kept = mergeTags(tokens.filter((token) => token.kind !== "comment"));
  for (const token of kept) {
    if (token.kind !== "start") continue;
    withoutEditorMarks(token);
    restyle(token, (declarations) => declarations.filter(([name, value]) => !LINE_HEIGHT.test(name) && !NOISE(name, value)));
  }
  if (options.links && (options.links.color || options.links.fallback)) {
    const { color, fallback } = options.links;
    for (const token of kept) {
      if (token.kind !== "start" || token.name !== "a") continue;
      restyle(token, (declarations) => {
        if (color) return [...declarations.filter(([name]) => name !== "color"), ["color", color]];
        return declarations.some(([name]) => name === "color") ? declarations : [...declarations, ["color", fallback!]];
      });
    }
  }
  if (options.paragraphs) {
    const paragraphs = kept.filter((token): token is StartTag => token.kind === "start" && token.name === "p");
    paragraphs.forEach((p, i) =>
      restyle(p, (declarations) => {
        const own = declarations.filter(([name]) => !/^margin(-top|-bottom)?$/.test(name));
        const spacing = options.paragraphs!.spacing && i < paragraphs.length - 1 ? [["margin-bottom", options.paragraphs!.spacing] as [string, string]] : [];
        return [["margin", "0"], ...spacing, ...own];
      })
    );
  }
  return unwrapBareSpans(kept);
}

export function cleanRichText(html: string, options: CleanOptions = {}): string {
  return serialize(clean(tokenize(html), options)).trim();
}

/** What a wrapper `<div>` set for its text (lifted into the block's settings). */
export interface Lifted {
  fontSize?: string;
  fontFamily?: string;
  color?: string;
  textAlign?: string;
}

const LIFTED: Record<string, keyof Lifted> = { "font-size": "fontSize", "font-family": "fontFamily", color: "color", "text-align": "textAlign" };

/**
 * TinyMCE's text: its wrapper `<div>` (`txtTinyMce-wrapper`, or a bare `<div>` around everything) lifted into the
 * block's settings, where it sets nothing else; the rest cleaned, with paragraphs as Beefree exports them.
 */
export function legacyText(html: string, options: CleanOptions = {}): { html: string; lifted: Lifted } {
  const tokens = tokenize(html).filter((token) => token.kind !== "comment");
  const root = singleRoot(tokens, ["div"]);
  const lifted: Lifted = {};
  if (root) {
    withoutEditorMarks(root.tag);
    const declarations = parseStyle(getAttr(root.tag, "style"));
    const others = declarations.filter(([name]) => !(name in LIFTED) && !LINE_HEIGHT.test(name) && name !== "word-break");
    const attrs = root.tag.attrs.filter(([name]) => name !== "style");
    if (!others.length && !attrs.length) {
      for (const [name, value] of declarations) if (name in LIFTED) lifted[LIFTED[name]] = decodeEntities(value);
      return { html: cleanRichText(serialize(root.inner), options), lifted };
    }
  }
  return { html: serialize(clean(tokens, options)).trim(), lifted };
}

/**
 * A button's label (TinyMCE's paragraphs, or inline HTML) as a button's text: inline HTML, its paragraphs as spans
 * (a line break between two), as Beefree exports a label.
 */
export function buttonLabel(html: string): { html: string; lifted: Lifted } {
  const tokens: Token[] = tokenize(html).filter((token) => token.kind !== "comment");
  const root = singleRoot(tokens, ["div"]);
  const lifted: Lifted = {};
  let inner = tokens;
  if (root) {
    for (const [name, value] of parseStyle(getAttr(root.tag, "style"))) if (name in LIFTED) lifted[LIFTED[name]] = decodeEntities(value);
    inner = root.inner;
  }
  const out: Token[] = [];
  let paragraphs = 0;
  for (const token of clean(inner)) {
    if (token.kind === "start" && (token.name === "p" || token.name === "div")) {
      if (paragraphs++ > 0) out.push({ kind: "start", name: "br", attrs: [], selfClosing: false });
      restyle(token, (declarations) => declarations.filter(([name, value]) => !/^margin/.test(name) && !(name === "font-family" && /^inherit$/i.test(value))));
      out.push({ ...token, name: "span" });
    } else if (token.kind === "end" && (token.name === "p" || token.name === "div")) out.push({ kind: "end", name: "span" });
    else if (token.kind === "text" && !token.text.trim() && paragraphs > 0 && /\n/.test(token.text)) continue;
    else out.push(token);
  }
  return { html: serialize(unwrapBareSpans(out)).trim(), lifted };
}

/** Text wrapped so it reads right to left (or left to right) inside a block of the other direction. */
export const withDirection = (html: string, direction: string) => `<div dir="${direction}">${html}</div>`;
