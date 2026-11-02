/**
 * A laid-out template as text, for an author or an agent to check its layout without reading the HTML: each block on
 * a line under what holds it, with its width on desktop and what it shows (a heading's level and words, a link's
 * URL, an image's alt text). A Row says how many sit side by side and whether they stack on phones.
 *
 *   Email 600px
 *     Image 120px [Acme] https://example.com/logo.png
 *     Column 600px, background #ffffff
 *       Heading h1 536px "Thanks for your order, {{first_name}}"
 *       Row 536px: 2 side by side, stacked on phones
 */
import { linkParts, type LinkValue, type ResolvedNode } from "@unlayer-internal/elements-core";

const LONGEST = 80;
const clip = (text: string) => (text.length > LONGEST ? `${text.slice(0, LONGEST - 1)}…` : text);
const shown = (node: ResolvedNode) => !(node.hidden?.mobile && node.hidden?.desktop);
const blocks = (node: ResolvedNode) => node.children.filter((child): child is ResolvedNode => typeof child !== "string" && shown(child));

/** The words a node shows, a merge tag as `{{name}}`, a link's URL after its words, an image as its alt text; Lists in it are lines of their own. */
function words(node: ResolvedNode): string {
  return node.children
    .map((child) => {
      if (typeof child === "string") return child;
      if (!shown(child) || child.type === "List") return "";
      if (child.type === "MergeTag") return `{{${child.props.name}}}`;
      if (child.type === "LineBreak") return " / ";
      if (child.type === "Image") return `[${child.props.alt ?? ""}]`;
      if (child.type === "Link") return `${words(child)} (${linkParts(child.props.href as LinkValue).href})`;
      return words(child);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function describe(node: ResolvedNode): string {
  const parts: string[] = [node.type === "DocumentPage" ? "Document.Page" : node.type];
  if (node.type === "Heading") parts.push(`h${node.props.level}`);
  if (node.width !== null) parts.push(`${Math.round(node.width)}px`);
  const details: string[] = [];
  const children = blocks(node);
  // A Grid is laid out as its Rows (in a Column), so it shows as those.
  if (node.type === "Row") details.push(`${children.length} side by side${node.props.stackOnMobile === false ? "" : ", stacked on phones"}`);
  if (typeof node.style.backgroundColor === "string") details.push(`background ${node.style.backgroundColor}`);
  if (node.hidden?.desktop) details.push("phones only");
  if (node.hidden?.mobile) details.push("desktop only");
  const head = `${parts.join(" ")}${details.length ? `: ${details.join(", ")}` : ""}`;
  switch (node.type) {
    case "Image":
      return `${head} [${node.props.alt ?? ""}] ${clip(String((node.props.src as { src?: string })?.src ?? node.props.src))}`;
    case "Link":
    case "Button":
      return `${head} "${clip(words(node))}" → ${linkParts(node.props.href as LinkValue).href}`;
    case "Video":
      return `${head} "${clip(String(node.props.title ?? ""))}" ${node.props.src}`;
    case "Menu":
      return `${head} ${(node.props.items as Array<{ text: string; href: string }>).map((item) => `"${item.text}" → ${item.href}`).join(", ")}`;
    case "Social":
      return `${head} ${(node.props.icons as Array<{ name: string }>).map((icon) => icon.name).join(", ")}`;
    case "Svg":
      return `${head} (${children.length} shapes)`;
    default:
      return node.definition.children.text && words(node) ? `${head} "${clip(words(node))}"` : head;
  }
}

/** The lines of a node and what it holds, indented under it. Text and its inline parts are its line; Lists in it go under it. */
function lines(node: ResolvedNode, indent: string): string[] {
  const own = `${indent}${describe(node)}`;
  if (node.type === "Svg" || node.type === "Menu" || node.type === "Social") return [own];
  const under = node.definition.children.text ? blocks(node).filter((child) => child.type === "List") : blocks(node);
  return [own, ...under.flatMap((child) => lines(child, `${indent}  `))];
}

export function outlineOf(root: ResolvedNode): string {
  return lines(root, "").join("\n");
}
