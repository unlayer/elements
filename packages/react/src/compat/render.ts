/**
 * renderToHtml(), renderToHtmlParts() and renderToPlainText() through the new engine (RFC 0001 step 7, decision 13),
 * and what today's components render straight through React: a template of them lowered into the new engine's tree
 * (template.ts) and written by its writers. The HTML is the new engine's; what a reader gets is legacy's.
 */
import React from "react";
import { renderToStaticMarkup } from "../utils/server-renderer";
import { ElementsError, type Diagnostic } from "@unlayer-internal/elements-core";
import { renderTemplate, type RenderResult } from "@unlayer-internal/elements-exporters";
import { decodeEntities, htmlToPlainText, type UnlayerConfig } from "@unlayer-internal/shared-elements";
import { ErrorFallback, UNLAYER_CONFIG_KEY } from "../utils/create-component";
import { withRenderScope } from "../utils/render-scope";
import type { TreeNode } from "./lower";
import { forWriting, lowerTemplate, takeOut, type InReact } from "./template";
import { attribute, restoreServiceTags, withoutMarks } from "./values";

export interface Rendered {
  /** The whole document. */
  html: string;
  /**
   * Head and body as renderToHtmlParts() gives them: the body in the root's host <div> (its className and style), as
   * legacy's, holding the <body> tag in an email or a printed document.
   */
  head: string;
  body: string;
  css: string;
  js: string;
  tags: string[];
  /** The plain text, as legacy writes it (from the body's markup). */
  text: string;
  /** What a React render of it writes in its host <div>: the body with its stylesheet, as there's no head to hold it there. */
  inner: string;
  /** The markup its plain text is read from (only when asked: it's another render). */
  textMarkup: string;
  /** The new engine's notes. */
  diagnostics: RenderResult["diagnostics"];
}

export interface RenderOptions extends Partial<UnlayerConfig> {
  title?: string;
  lang?: string;
  fonts?: Array<{ url: string }>;
}

/** CSS for a `<style>` element: a `</style` in it would end the element. */
const styleText = (css: string) => css.replace(/<\/(style)/gi, "<\\/$1");

/** Legacy hides what's hidden on phones at this width and below, whatever an email's width (its columns stack at that). */
const PHONE_WIDTH = 480;

/** The new engine's preview text, which isn't the email's text. */
const PREVIEW = /^<div style="display:none;max-height:0;overflow:hidden;mso-hide:all" aria-hidden="true" data-skip-in-text="true">[\s\S]*?<\/div>/;
/** The new engine's page divider, a line legacy's isn't in plain text (legacy draws its divider with a border). */
const DIVIDER = /<hr\b[^>]*style="[^"]*border:0;border-top:[^"]*"[^>]*>/g;

/** A piece's markup alone, in a page of someone else's: it isn't that page's main content, or an email of its own. */
const asPiece = (body: string) => body.replace(/^<main\b/, "<div").replace(/<\/main>$/, "</div>").replace(/^<div role="article" aria-roledescription="email"/, "<div");

/**
 * A template rendered through the new engine, or says why it can't be (template.ts's `templateRoot`). `name` is the
 * API's, for messages. Called inside a render's scope.
 */
export function renderThroughNewEngine(element: React.ReactElement, options: RenderOptions | undefined, name: string, inReact: InReact = {}): Rendered {
  const { title, lang: optionLang, fonts: optionFonts = [], ...config } = options ?? {};
  const lowered = lowerTemplate(element, config, name, inReact);
  const rootProps = (lowered.root.props ?? {}) as { lang?: string; fonts?: Array<{ url: string }> };
  const lang = optionLang ?? rootProps.lang;
  const { root } = lowered.tree;
  root.props = withoutMarks({ ...root.props, ...(title !== undefined && title.trim() ? { title: title.trim() } : {}), ...(lang ? { lang: String(lang) } : {}) });
  const refused: Diagnostic[] = [];
  const result = writeWhatItTakes(lowered.tree, refused);
  const restore = (markup: string) => (lowered.tags.length ? restoreServiceTags(markup, lowered.tags) : markup);
  // (What they say of a value reads as the template wrote it.)
  const diagnostics = [...lowered.diagnostics, ...refused].map((diagnostic) => ({ ...diagnostic, message: restore(diagnostic.message) }));
  warnOnce(diagnostics);

  // The root's fonts, the option's, then the editor's the design uses, each URL once: stylesheets linked (an email's out
  // of Outlook's view), as the editor's export links them.
  const fonts = withoutMarks([...(rootProps.fonts ?? []), ...optionFonts, ...(inReact.embedded ? [] : lowered.fonts ?? [])]).filter((font, i, all) => font?.url && all.findIndex((f) => f?.url === font.url) === i);
  const links = fonts.map((font) => `<link href="${attribute(font.url)}" rel="stylesheet" type="text/css">`).join("");
  // What today's head functions add for blocks that keep their legacy HTML (a custom tool's script and tags).
  const js = lowered.head?.js ?? "";
  const tags = lowered.head?.tags ?? [];
  const extra = [
    tags.join("\n"),
    js ? `<script type="application/javascript">\n${js}\n</script>` : "",
    links && (lowered.mode === "email" ? `<!--[if !mso]><!-->${links}<!--<![endif]-->` : links),
  ].filter(Boolean);
  // (A replacer: a tool's script may hold `$&` or `$'`, which a replacement string reads as patterns.)
  // An email's head without what the new engine asks of a client that legacy's doesn't: a light color scheme (a
  // client's dark mode treats it as it treats legacy's), and no detection of phone numbers, addresses and dates (which
  // Apple's Mail links in legacy's).
  const shell = result.html.replace(
    '<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">',
    () => ""
  );
  const { className, style } = withoutMarks((lowered.root.props ?? {}) as { className?: string; style?: React.CSSProperties });
  // What only a whole page has. (The parts for another page, and a template rendered inside one, leave that page as it is.)
  const sized = inReact.embedded || !lowered.wholePage ? shell : shell.replace("<style>", () => `<style>${lowered.wholePage}`);
  const hosted = (markup: string) => renderToStaticMarkup(React.createElement("div", { dangerouslySetInnerHTML: { __html: markup }, className, style }));
  // (The marks go back in what the writers wrote, the tree's: what's written around it holds none.)
  const written = restore(sized);
  const withHost = lowered.bare && (className || style) ? written.replace(restore(result.body), () => hosted(restore(result.body))) : written;
  const html = extra.length ? withHost.replace("</head>", () => `${extra.join("\n")}</head>`) : withHost;

  // The parts: the stylesheet with the body's own style (an app's page embedding them takes the template's margin and
  // background, as legacy's head gave them), the script and the tags; the body.
  const styles = [...result.head.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1]);
  const css = [...styles, result.bodyStyle ? `body{${result.bodyStyle}}` : ""].filter(Boolean).join("\n");
  const head = [css ? `<style>${styleText(css)}</style>` : "", js ? `<script>${js}</script>` : "", ...tags].filter(Boolean).join("\n");
  // The plain text, as legacy's: from the tree as legacy's markup reads (only when asked: it's another render). A tag goes
  // back once it's read, so its service still fills it in, in the words as in a link's address. It's as it was written:
  // what React escaped of it (a component's children) is text here.
  const textMarkup = () => renderTemplate(forText(lowered.tree, lowered.mode)).body.replace(PREVIEW, "").replace(DIVIDER, "");
  const tagsAsWritten = () => lowered.tags.map(decodeEntities);
  // The body in the root's host <div>, as legacy's parts have it: the <body> tag inside it in an email or a printed
  // document (a page's has none).
  const bodyTag = /<body\b[^>]*>/.exec(result.html)?.[0] ?? "<body>";
  const framed = (content: string) => restore(lowered.mode === "web" ? content : `\n${bodyTag}${content}</body>\n`);
  // In a React render, where no head is: the stylesheet with the markup, as legacy's rows have theirs.
  const sheet = styles.length ? `<style>${styleText(styles.join("\n"))}</style>` : "";
  return {
    html,
    head,
    get body() {
      return hosted(framed(result.body));
    },
    css,
    js,
    tags,
    get text() {
      return restoreServiceTags(htmlToPlainText(textMarkup()), tagsAsWritten());
    },
    get textMarkup() {
      // (Written as text: what reads this markup would take a tag for an element.)
      return restoreServiceTags(textMarkup(), tagsAsWritten().map((tag) => tag.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")));
    },
    inner: inReact.piece ? restore(sheet + asPiece(result.body)) : framed(sheet + result.body),
    diagnostics: [...diagnostics, ...result.diagnostics],
  };
}

/**
 * A Row, Column or block rendered straight through React (a component's `renderToString`, a Server Component, a custom
 * tool's exporter), in the host <div> legacy's have: drawn in a root of its own (template.ts), in the mode it says or its
 * config does, with its body's values where it's given them. The rest of its props are its own.
 */
export function onItsOwn(type: React.ComponentType<any>, props: Record<string, any>): React.ReactElement {
  const { mode, className, style, index: _index, _metaHtmlId, colIndex: _colIndex, bodyValues, rowValues: _rowValues, columnValues: _columnValues, _config, ...own } = props;
  const name = type.displayName ?? type.name ?? "Block";
  // (A block's `cells` is where a Column would put it, not a value of its own.)
  if ((type as unknown as Record<string, unknown>)[UNLAYER_CONFIG_KEY]) delete own.cells;
  try {
    const element = React.createElement(type, own);
    const rendered = withRenderScope(() => renderThroughNewEngine(element, { ..._config, ...(mode ? { mode } : {}) }, name, { embedded: true, piece: true, body: bodyValues }), true);
    // (React reads only `__html`. `__text` is for a Row or Column placed in a Column: see writeBlock.)
    const markup = { __html: rendered.inner, get __text() { return withRenderScope(() => rendered.textMarkup, true); } };
    return React.createElement("div", { className, style, dangerouslySetInnerHTML: markup });
  } catch (error) {
    console.error(`${name} rendering failed:`, error);
    return React.createElement(ErrorFallback, { type: name, error: error as Error, className, style });
  }
}

type Tree = { root: TreeNode };

/**
 * The tree written, without what the new engine refuses (each value it says, at its place in the tree, taken out of it,
 * and said): what's left is drawn. Only a template it refuses for another reason fails.
 */
function writeWhatItTakes(tree: Tree, refused: Diagnostic[]): RenderResult {
  for (;;) {
    try {
      return renderTemplate({ root: forWriting(tree.root) }, { hideBelow: PHONE_WIDTH });
    } catch (error) {
      if (!(error instanceof ElementsError)) throw error;
      // (From the last: taking a child out moves those after it.)
      const out = [...error.diagnostics].reverse().filter((d) => d.severity === "error" && takeOut(tree, d.path));
      if (!out.length) throw error;
      refused.push(...out.map((d) => ({ code: "compat/refused", severity: "warning" as const, message: `${d.message}: it isn't drawn`, path: d.path })));
    }
  }
}

/** What's drawn otherwise than a template asks, each message once per process: a template renders many times. */
const warned = new Set<string>();

function warnOnce(diagnostics: Diagnostic[]): void {
  for (const { severity, message, path } of diagnostics) {
    // (At most so many: a message can hold a template's own values, and a server runs for a long time.)
    if (severity !== "warning" || warned.has(message) || warned.size >= 1000) continue;
    warned.add(message);
    console.warn(`[Unlayer] ${message} (${path})`);
  }
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
