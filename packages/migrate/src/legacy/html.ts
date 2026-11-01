/**
 * A legacy Paragraph's or Heading's `html`, the inline markup today's components take, as the new components'
 * children (JSX source): <b>/<strong>, <i>/<em>, <u>, <span style>, <a href style> and <br> become Span, Link and
 * LineBreak. Anything else (another tag, a style no run of text takes) is left to the caller, which says so: the
 * migration never drops markup quietly.
 */
import { decodeHtmlEntities } from "@unlayer/convert-core";

const TAG = /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
const ATTRIBUTE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

/** A run's style from a `style` attribute: the properties a Span or Link takes, in the new names. */
const RUN_STYLES: Record<string, string> = {
  color: "color",
  "background-color": "backgroundColor",
  "font-weight": "fontWeight",
  "font-style": "fontStyle",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "letter-spacing": "letterSpacing",
  "text-decoration": "textDecoration",
  "text-transform": "textTransform",
};

function attributes(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of text.matchAll(ATTRIBUTE)) out[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? "");
  return out;
}

/** A `style` attribute as a style object's source (each value written by `expression`), or undefined where it holds a property no run takes. */
function runStyle(css: string | undefined, expression: (value: string) => string = JSON.stringify): string | undefined | null {
  if (!css) return null;
  const entries: string[] = [];
  for (const declaration of css.split(";")) {
    const [property, ...rest] = declaration.split(":");
    const value = rest.join(":").trim();
    if (!property?.trim() || !value) continue;
    const key = RUN_STYLES[property.trim().toLowerCase()];
    if (!key) return undefined;
    entries.push(`${key}: ${expression(key === "textDecoration" ? value.split(/\s+/)[0] : value)}`);
  }
  return entries.length ? `{ ${entries.join(", ")} }` : null;
}

/** Where an expression sits in markup built by a template literal (`<b>${value}</b>`): its index between these. */
export const hole = (index: number) => `\uE000${index}\uE001`;
const HOLE = /\uE000(\d+)\uE001/;
const HOLES = /\uE000(\d+)\uE001/g;

/** Text as JSX source: as it is where JSX keeps it so, else a string expression (spaces at its ends, braces, angle brackets). */
function plain(value: string): string {
  if (!value) return "";
  return /^[^{}<>\s][^{}<>]*[^{}<>\s]$|^[^{}<>\s]$/.test(value) && !/\s{2,}/.test(value) ? value : `{${JSON.stringify(value)}}`;
}

type Frame = { tag: string; open: string; children: string[] };

/**
 * The markup as children's JSX source and the components they use; undefined (with why) for markup that isn't inline.
 * `holes` are the expressions of a template literal the markup came from, each where its hole() is.
 */
export function inlineHtml(html: string, holes: string[] = []): { jsx: string; used: Set<string> } | { unsupported: string } {
  const used = new Set<string>();
  const text = (value: string) => value.split(HOLES).map((part, index) => (index % 2 ? `{${holes[Number(part)]}}` : plain(part))).join("");
  /** A value as an expression: a string, or the template literal's expression (or a template literal) where it holds one. */
  const expression = (raw: string) => {
    if (!HOLE.test(raw)) return JSON.stringify(raw);
    const only = /^\uE000(\d+)\uE001$/.exec(raw);
    if (only) return holes[Number(only[1])];
    return `\`${raw.split(HOLES).map((part, index) => (index % 2 ? `\${${holes[Number(part)]}}` : part.replace(/[`\\]|\$\{/g, (m) => `\\${m}`))).join("")}\``;
  };
  /** An attribute's value as JSX. */
  const value = (raw: string) => (HOLE.test(raw) ? `{${expression(raw)}}` : JSON.stringify(raw));
  const root: Frame = { tag: "", open: "", children: [] };
  const stack: Frame[] = [root];
  let at = 0;
  const pushText = (raw: string) => {
    const value = decodeHtmlEntities(raw.replace(/\s+/g, " "));
    if (value) stack[stack.length - 1].children.push(text(value));
  };
  for (const match of html.matchAll(TAG)) {
    pushText(html.slice(at, match.index));
    at = match.index! + match[0].length;
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (tag === "br") {
      if (!closing) {
        used.add("LineBreak");
        stack[stack.length - 1].children.push("<LineBreak />");
      }
      continue;
    }
    if (closing) {
      const frame = stack.pop();
      if (!frame || frame.tag !== tag) return { unsupported: `</${tag}> closes nothing open` };
      stack[stack.length - 1].children.push(`${frame.open}${frame.children.join("")}</${frame.open.slice(1, frame.open.search(/[\s>]/))}>`);
      continue;
    }
    const attrs = attributes(match[3]);
    const style = runStyle(attrs.style, expression);
    if (style === undefined) return { unsupported: `a style a run of text can't take (${attrs.style})` };
    const styled = (base: string[]) => {
      const all = [...base, ...(style ? [style.slice(2, -2)] : [])];
      return all.length ? ` style={{ ${all.join(", ")} }}` : "";
    };
    let open: string;
    if (tag === "b" || tag === "strong") open = `<Span${styled(["fontWeight: 700"])}>`;
    else if (tag === "i" || tag === "em") open = `<Span${styled(['fontStyle: "italic"'])}>`;
    else if (tag === "u") open = `<Span${styled(['textDecoration: "underline"'])}>`;
    else if (tag === "span") open = `<Span${styled([])}>`;
    else if (tag === "a" && attrs.href) open = `<Link href=${value(attrs.href)}${styled([])}>`;
    else return { unsupported: `<${tag}>, which isn't inline text` };
    used.add(open.startsWith("<Link") ? "Link" : "Span");
    stack.push({ tag, open, children: [] });
  }
  pushText(html.slice(at));
  if (stack.length !== 1) return { unsupported: `<${stack[stack.length - 1].tag}> isn't closed` };
  return { jsx: root.children.join(""), used };
}
