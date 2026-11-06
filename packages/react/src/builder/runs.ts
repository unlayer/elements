/**
 * A text block's runs as the HTML the builder's text tools hold (a heading's, a text's, a button's `text`): words,
 * `<span>` with a run's style, `<sup>`/`<sub>`, `<a>` with its href, target, title and label, `<br>`, merge tags as
 * `{{name}}`. A Text's and a List's are its rich text (`textJson`), what its editor saves, each run a text node
 * in its style. What neither can hold (a link's hover) is said in `lost`.
 */
import { linkParts, type Json, type LinkValue, type Node } from "@unlayer-internal/elements-core";
import { cssPx } from "./values";

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** CSS of a run's style, in the properties a Span or a Link takes. */
const CSS: Record<string, string> = {
  color: "color",
  backgroundColor: "background-color",
  fontWeight: "font-weight",
  fontStyle: "font-style",
  textDecoration: "text-decoration",
  textTransform: "text-transform",
  fontSize: "font-size",
  letterSpacing: "letter-spacing",
  fontFamily: "font-family",
};

function runCss(style: Record<string, Json> | undefined, escaped: (value: string) => string = escapeHtml): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(style ?? {})) {
    if (value === undefined || value === null || !CSS[key]) continue;
    const written = key === "fontSize" || key === "letterSpacing" ? cssPx(Number(value)) : key === "fontFamily" ? String(value).replace(/"/g, "'") : String(value);
    out.push(`${CSS[key]}:${escaped(written)}`);
  }
  return out.join(";");
}

/** A node's runs as HTML; what it can't hold goes in `lost` ("a link's hover"). */
export function runsHtml(node: Node, lost: string[] = []): string {
  return (node.children ?? [])
    .map((child) => {
      if (typeof child === "string") return escapeHtml(child);
      if (Object.keys(child.mobile ?? {}).length) lost.push("phone styles on part of its text");
      if (child.id) lost.push("id on part of its text");
      if (child.type === "Link" && child.props?.attrs) lost.push("other attributes on a link");
      const css = runCss(child.style);
      const style = css ? ` style="${css}"` : "";
      switch (child.type) {
        case "LineBreak":
          return "<br>";
        case "MergeTag":
          return `{{${escapeHtml(String(child.props?.name ?? ""))}}}`;
        case "PageNumber":
          // The builder has no page numbers: its tokens in their place, read back as them in a Document.
          return child.props?.total ? "{{page_count}}" : "{{page_number}}";
        case "Link": {
          if (child.hover && Object.keys(child.hover).length) lost.push("a link's hover");
          const { href, target } = linkParts(child.props?.href as LinkValue);
          const attributes = [`href="${escapeHtml(href)}"`, target ? `target="${target}"` : "", ...(["title", "aria-label"] as const).map((name) => (typeof child.props?.[name] === "string" ? `${name}="${escapeHtml(String(child.props[name]))}"` : ""))].filter(Boolean);
          return `<a ${attributes.join(" ")}${style}>${runsHtml(child, lost)}</a>`;
        }
        default: {
          const inner = `<span${style}>${runsHtml(child, lost)}</span>`;
          const raised = child.style?.verticalAlign;
          const { verticalAlign: _, ...rest } = child.style ?? {};
          const plain = runCss(rest);
          if (raised === "super" || raised === "sub") {
            const tag = raised === "super" ? "sup" : "sub";
            return `<${tag}>${plain ? `<span style="${plain}">${runsHtml(child, lost)}</span>` : runsHtml(child, lost)}</${tag}>`;
          }
          return inner;
        }
      }
    })
    .join("");
}

type Item = Record<string, Json | undefined>;

/** Lexical's bitmask for a raised run. */
const RAISED: Record<string, number> = { sub: 32, super: 64 };
const unescaped = (value: string) => value;
/** Two styles as one: where both set something, the second's, as an inner style's is over an outer's. */
const within = (outer: string, inner: string) => {
  const declared = new Map(`${outer};${inner}`.split(";").filter(Boolean).map((declaration) => [declaration.slice(0, declaration.indexOf(":")), declaration.slice(declaration.indexOf(":") + 1)]));
  return [...declared].map(([name, value]) => `${name}:${value}`).join(";");
};
const textItem = (text: string, style: string, format: number): Item => ({ type: "extended-text", version: 1, detail: 0, format, mode: "normal", style, text });

/** A node's runs as rich text's nodes, each run's text in the style and format of the runs around it. */
function runItems(node: Node, lost: string[], around = "", format = 0): Item[] {
  return (node.children ?? []).flatMap((child): Item[] => {
    if (typeof child === "string") return [textItem(child, around, format)];
    if (Object.keys(child.mobile ?? {}).length) lost.push("phone styles on part of its text");
    if (child.id) lost.push("id on part of its text");
    if (child.type === "Link" && child.props?.attrs) lost.push("other attributes on a link");
    const { verticalAlign, ...style } = child.style ?? {};
    const own = within(around, runCss(style, unescaped));
    switch (child.type) {
      case "LineBreak":
        return [{ type: "linebreak", version: 1 }];
      case "MergeTag":
        return [textItem(`{{${String(child.props?.name ?? "")}}}`, own, format)];
      case "PageNumber":
        // The builder has no page numbers: its tokens in their place, read back as them in a Document.
        return [textItem(child.props?.total ? "{{page_count}}" : "{{page_number}}", own, format)];
      case "Link": {
        if (child.hover && Object.keys(child.hover).length) lost.push("a link's hover");
        const { href, target } = linkParts(child.props?.href as LinkValue);
        const label = child.props?.["aria-label"];
        return [
          {
            type: "extended-link",
            version: 1,
            format: "",
            indent: 0,
            direction: null,
            url: href,
            target: target ?? null,
            rel: null,
            title: typeof child.props?.title === "string" ? child.props.title : undefined,
            style: runCss(child.style, unescaped) || undefined,
            customAttrs: typeof label === "string" ? { "aria-label": label } : undefined,
            // Its words take what's around it only under its own style: it's inside the link, where the link's wouldn't win.
            children: runItems(child, lost, around && own, format) as Json[],
          },
        ];
      }
      default:
        return runItems(child, lost, own, format | (RAISED[String(verticalAlign)] ?? 0));
    }
  });
}

const richText = (children: Item[]) => JSON.stringify({ root: { type: "root", version: 1, format: "", indent: 0, direction: null, children } });

/** A node's runs as a Text's rich text (`textJson`), one paragraph in `style`. */
export function paragraphJson(node: Node, lost: string[], style: string): string {
  const children = runItems(node, lost);
  return richText(children.length ? [{ type: "extended-paragraph", version: 1, format: "", indent: 0, direction: null, textFormat: 0, textStyle: "", isInlineTool: false, style: style || undefined, children: children as Json[] }] : []);
}

/** A list's rich text: an item for its words, and one for each list in it, as the builder's editor nests a list. */
function listItem(node: Node, lost: string[]): Item {
  const numbered = node.props?.type === "number";
  const items = (node.children ?? []).filter((child): child is Node => typeof child !== "string");
  const entry = (children: Item[], value: number): Item => ({ type: "extended-listitem", version: 1, format: "", indent: 0, direction: null, value, children: children as Json[] });
  let value = 0;
  return {
    type: "extended-list",
    version: 1,
    format: "",
    indent: 0,
    direction: null,
    listType: numbered ? "number" : "bullet",
    tag: numbered ? "ol" : "ul",
    start: numbered && node.props?.start !== undefined ? Number(node.props.start) : 1,
    children: items.flatMap((item) => {
      if (Object.keys(item.style ?? {}).length || item.props?.dir) lost.push("style or direction of a list item's own");
      const parts: Item[] = [];
      let words: Node["children"] = [];
      const flush = () => {
        if (words!.length) parts.push(entry(runItems({ ...item, children: words }, lost), ++value));
        words = [];
      };
      let nested = false;
      for (const child of item.children ?? []) {
        if (typeof child !== "string" && child.type === "List") {
          flush();
          parts.push(entry([listItem(child, lost)], ++value));
          nested = true;
        } else {
          if (nested && (typeof child !== "string" || child.trim())) lost.push("words after a list in a list item, which are an item of their own");
          words.push(child);
        }
      }
      flush();
      return parts;
    }) as Json[],
  };
}

/** A List as a Text's rich text (`textJson`). */
export const listJson = (node: Node, lost: string[]): string => richText([listItem(node, lost)]);
