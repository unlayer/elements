/**
 * renderToHtml(), renderToHtmlParts() and renderToPlainText() through the new engine (RFC 0001 step 7, decision 13):
 * a template of today's components lowered into the new engine's tree (template.ts) and written by its writers. The
 * HTML is the new engine's; what a reader gets is legacy's. Undefined where the template renders as today: a root
 * that isn't one of today's (a block on its own), or a frame the new engine can't draw as legacy does.
 */
import type React from "react";
import { ElementsError } from "@unlayer-internal/elements-core";
import { renderTemplate, type RenderResult } from "@unlayer-internal/elements-exporters";
import { htmlToPlainText, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import type { TreeNode } from "./lower";
import { lowerTemplate } from "./template";

export interface Rendered {
  /** The whole document. */
  html: string;
  /** Head and body as renderToHtmlParts() gives them. */
  head: string;
  body: string;
  css: string;
  js: string;
  tags: string[];
  /** The plain text, as legacy writes it (from the body's markup). */
  text: string;
  /** The new engine's notes. */
  diagnostics: RenderResult["diagnostics"];
}

export interface RenderOptions extends Partial<UnlayerConfig> {
  title?: string;
  lang?: string;
  fonts?: Array<{ url: string }>;
}

/** Text interpolated into HTML (a font's URL), escaped as legacy escapes it. */
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** CSS for a `<style>` element: a `</style` in it would end the element. */
const styleText = (css: string) => css.replace(/<\/(style)/gi, "<\\/$1");

/** The new engine's preview text, which isn't the email's text. */
const PREVIEW = /^<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true">[\s\S]*?<\/div>/;
/** The new engine's page divider, a line legacy's isn't in plain text (legacy draws its divider with a border). */
const DIVIDER = /<hr\b[^>]*style="[^"]*border:0;border-top:[^"]*"[^>]*>/g;

/**
 * A template rendered through the new engine; undefined where it renders as today. `name` is the API's, for messages.
 * Called inside a render's scope.
 */
export function renderThroughNewEngine(element: React.ReactElement, options: RenderOptions | undefined, name: string): (Rendered & { unlowered?: undefined }) | { unlowered: string } | undefined {
  const { title, lang: optionLang, fonts: optionFonts = [], ...config } = options ?? {};
  const lowered = lowerTemplate(element, config, name);
  if (!lowered || "unlowered" in lowered) return lowered;
  const rootProps = (lowered.root.props ?? {}) as { lang?: string; fonts?: Array<{ url: string }> };
  const lang = optionLang ?? rootProps.lang;
  const { root } = lowered.tree;
  root.props = { ...root.props, ...(title !== undefined && title.trim() ? { title: title.trim() } : {}), ...(lang ? { lang: String(lang) } : {}) };
  let result: RenderResult;
  try {
    result = renderTemplate(forWriting(lowered.tree));
  } catch (error) {
    // A value the new engine refuses (a color it doesn't read) renders as today.
    if (error instanceof ElementsError) return { unlowered: error.message };
    throw error;
  }

  // The root's fonts, then the option's, each URL once: stylesheets legacy links (an email's out of Outlook's view).
  const fonts = [...(rootProps.fonts ?? []), ...optionFonts].filter((font, i, all) => font?.url && all.findIndex((f) => f?.url === font.url) === i);
  const links = fonts.map((font) => `<link href="${escapeHtml(String(font.url))}" rel="stylesheet" type="text/css">`).join("");
  // What today's head functions add for blocks that keep their legacy HTML (a custom tool's script and tags).
  const js = lowered.legacyHead?.js ?? "";
  const tags = lowered.legacyHead?.tags ?? [];
  const extra = [
    tags.join("\n"),
    js ? `<script type="application/javascript">\n${js}\n</script>` : "",
    links && (lowered.mode === "email" ? `<!--[if !mso]><!-->${links}<!--<![endif]-->` : links),
  ].filter(Boolean);
  const html = extra.length ? result.html.replace("</head>", `${extra.join("\n")}</head>`) : result.html;

  // The parts: the stylesheet with the body's own style (an app's page embedding them takes the template's margin and
  // background, as legacy's head gave them), the script and the tags; the body.
  const styles = [...result.head.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1]);
  const css = [...styles, result.bodyStyle ? `body{${result.bodyStyle}}` : ""].filter(Boolean).join("\n");
  const head = [css ? `<style>${styleText(css)}</style>` : "", js ? `<script>${js}</script>` : "", ...tags].filter(Boolean).join("\n");
  // The plain text, as legacy's: from the tree as legacy's markup reads (only when asked: it's another render).
  const text = () => htmlToPlainText(renderTemplate(forText(lowered.tree, lowered.mode)).body.replace(PREVIEW, "").replace(DIVIDER, ""));
  return {
    html,
    head,
    body: result.body,
    css,
    js,
    tags,
    get text() {
      return text();
    },
    diagnostics: result.diagnostics,
  };
}

type Tree = { root: TreeNode };

/** The tree the new engine writes: what's only for the plain text left out. */
function forWriting(tree: Tree): Tree {
  const visit = (node: TreeNode): TreeNode => {
    const { textAs: _, designColumn: __, ...rest } = node;
    return rest.children ? { ...rest, children: rest.children.map((c) => (typeof c === "string" ? c : visit(c))) } : rest;
  };
  return { root: visit(tree.root) };
}

/**
 * The tree whose markup reads as legacy's in plain text: each node as it reads there (`textAs`), and on a page or in a
 * printed document each block in a box of its own, as legacy's blocks are (a line between each two).
 */
function forText(tree: Tree, mode: string): Tree {
  const visit = (node: TreeNode): TreeNode => {
    const own = node.textAs ? visit(node.textAs) : node;
    const { textAs: _, designColumn, ...rest } = own;
    if (!rest.children) return rest;
    const children = rest.children.map((c) => (typeof c === "string" ? c : visit(c)));
    const boxed = designColumn && mode !== "email" ? children.map((c) => (typeof c === "string" ? c : { type: "Column", children: [c] })) : children;
    return { ...rest, children: boxed };
  };
  return { root: visit(tree.root) };
}
