/**
 * A text block's runs as the HTML the builder's text tools hold (a heading's, a text's, a button's `text`): words,
 * `<span>` with a run's style, `<sup>`/`<sub>`, `<a>` with its href, target, title and label, `<br>`, merge tags as
 * `{{name}}`. A List is `<ul>`/`<ol>` with no margin, its indent the list's padding and its gap each item's margin.
 * What HTML can't hold (a link's hover) is said in `lost`.
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

function runCss(style: Record<string, Json> | undefined): string {
  const out: string[] = [];
  for (const [key, value] of Object.entries(style ?? {})) {
    if (value === undefined || value === null || !CSS[key]) continue;
    const written = key === "fontSize" || key === "letterSpacing" ? cssPx(Number(value)) : key === "fontFamily" ? String(value).replace(/"/g, "'") : String(value);
    out.push(`${CSS[key]}:${escapeHtml(written)}`);
  }
  return out.join(";");
}

/** A node's runs as HTML; what it can't hold goes in `lost` ("a link's hover"). */
export function runsHtml(node: Node, lost: string[] = []): string {
  return (node.children ?? [])
    .map((child) => {
      if (typeof child === "string") return escapeHtml(child);
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

/** A List as the builder's text holds one: `<ul>` or `<ol>`, its indent its padding, its gap above each item but the first. */
export function listHtml(node: Node, lost: string[] = []): string {
  const numbered = node.props?.type === "number";
  const tag = numbered ? "ol" : "ul";
  const start = numbered && node.props?.start !== undefined && node.props.start !== 1 ? ` start="${Number(node.props.start)}"` : "";
  const indent = typeof node.style?.indent === "number" ? node.style.indent : 24;
  const gap = typeof node.style?.gap === "number" ? node.style.gap : 0;
  const items = (node.children ?? []).filter((child): child is Node => typeof child !== "string");
  const html = items
    .map((item, i) => {
      // Its words and the lists in it, in their order (words after a list go under it).
      const parts: string[] = [];
      let words: Node["children"] = [];
      const flush = () => {
        if (words!.length) parts.push(runsHtml({ ...item, children: words }, lost));
        words = [];
      };
      for (const child of item.children ?? []) {
        if (typeof child !== "string" && child.type === "List") {
          flush();
          parts.push(listHtml(child, lost));
        } else words.push(child);
      }
      flush();
      const space = i > 0 && gap ? ` style="margin-top:${cssPx(gap)}"` : "";
      return `<li${space}>${parts.join("")}</li>`;
    })
    .join("");
  return `<${tag}${start} style="margin:0;padding-left:${cssPx(indent)}">${html}</${tag}>`;
}
