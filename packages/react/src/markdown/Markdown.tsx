import React from "react";
import { Parser, type Token, type Tokens } from "marked";
import { Divider, Heading, Html, Image, Paragraph, Table, renderToHtml } from "@unlayer/react-elements";
import type { DividerProps, HeadingProps, HtmlProps, ImageProps, ParagraphProps, TableProps } from "@unlayer/react-elements";
import { CodeBlock, codeInline, highlightCode, type CodeBlockProps, type CodeInlineOptions } from "@unlayer/react-elements/code";
import { escapeAttribute, escapeText, safeUrl, sanitizeHtml } from "./sanitize";
import { TABLE_CELLS, tooLarge, type TooLarge } from "./limits";
import { Bounded } from "./inline";

/** The blocks Markdown becomes, by its element: props each one gets (over Markdown's own defaults). */
export interface MarkdownBlocks {
  /** Every heading; `h1` … `h6` for one level. */
  heading?: Partial<HeadingProps>;
  h1?: Partial<HeadingProps>;
  h2?: Partial<HeadingProps>;
  h3?: Partial<HeadingProps>;
  h4?: Partial<HeadingProps>;
  h5?: Partial<HeadingProps>;
  h6?: Partial<HeadingProps>;
  paragraph?: Partial<ParagraphProps>;
  /** A list: a Paragraph holding it. */
  list?: Partial<ParagraphProps>;
  /** A quote: a Paragraph holding it. */
  blockquote?: Partial<ParagraphProps>;
  /** An image on a line of its own. */
  image?: Partial<ImageProps>;
  /** A thematic break (`---`). */
  divider?: Partial<DividerProps>;
  table?: Partial<TableProps>;
  /** Fenced and indented code (a CodeBlock: its theme, line numbers, font size …), also in lists and quotes. */
  code?: Partial<Omit<CodeBlockProps, "children" | "code">>;
  /** Raw HTML, and what Markdown has that no block above is. */
  html?: Partial<HtmlProps>;
}

/** Markup in text that can be styled: its inline CSS (`{ a: "color: #2563eb", blockquote: "…" }`), over Markdown's own. */
export type MarkdownStyles = Partial<Record<"a" | "strong" | "em" | "del" | "img" | "ul" | "ol" | "li" | "blockquote" | "p" | "hr", string>>;

type Attributes = Record<string, string> | ((url: string) => Record<string, string>);

export interface MarkdownProps {
  /** The Markdown (or as `markdown`). Indentation every line shares (a template literal's) is taken off first. */
  children?: React.ReactNode;
  markdown?: string;
  /** Props for the blocks it makes, by element. */
  blocks?: MarkdownBlocks;
  /** Inline CSS for markup in its text, by tag. */
  styles?: MarkdownStyles;
  /** Inline code's look (`theme`, `fontFamily`): see codeInline. */
  inlineCode?: CodeInlineOptions;
  /** Each link's attributes (default `{ target: "_blank", rel: "noopener" }`), or a function of its URL. */
  linkAttributes?: Attributes;
  /** Each image in text's attributes, or a function of its URL (an image on a line of its own is an Image block: `blocks.image`). */
  imageAttributes?: Attributes;
  /**
   * Rewrites each link's and image's URL (a CDN, tracking parameters); `undefined` leaves a link out (its text
   * stays) and an image out. URLs that could run code (`javascript:`) are left out first.
   */
  url?: (url: string, kind: "link" | "image") => string | undefined;
  /**
   * Raw HTML in the Markdown: kept to the tags and attributes that display, text, links, images, lists, tables and
   * sections, without event handlers, URLs that run code or CSS that loads anything (`"sanitize"`, the default: the
   * lists are sanitizeHtml's); shown as text (`"escape"`); or left out (`"drop"`).
   */
  html?: "sanitize" | "escape" | "drop";
  /** A line break in a paragraph is one in the text (GitHub's comments), not a space. */
  breaks?: boolean;
}

/** Heading sizes by level, as documents show them. */
const SIZES = ["28px", "24px", "20px", "18px", "16px", "14px"];
const STYLES: Required<Omit<MarkdownStyles, "a" | "strong" | "em" | "del">> = {
  ul: "margin: 0; padding: 0 0 0 24px",
  ol: "margin: 0; padding: 0 0 0 24px",
  li: "margin: 0 0 4px",
  blockquote: "margin: 0; padding: 0 0 0 12px; border-left: 3px solid #d5d9e0; color: #5b6472",
  p: "margin: 0 0 8px",
  img: "max-width: 100%; height: auto; border: 0",
  hr: "border: 0; border-top: 1px solid #d5d9e0; margin: 8px 0",
};

/** Text taken off the indentation all its lines share (blank lines aside). */
function dedent(text: string): string {
  // trimEnd(), not replace(/\s+$/): a regex tries each of a long run of spaces that isn't at the end, to its end.
  const lines = text.replace(/^\s*\n/, "").trimEnd().split("\n");
  // A loop, not Math.min(...lines): a spread of a long text's lines overflows the stack.
  let indent = Infinity;
  for (const l of lines) if (l.trim()) indent = Math.min(indent, /^[ \t]*/.exec(l)![0].length);
  return Number.isFinite(indent) && indent ? lines.map((l) => l.slice(indent)).join("\n") : lines.join("\n");
}

const textOf = (node: React.ReactNode): string =>
  node == null || typeof node === "boolean" ? "" : Array.isArray(node) ? node.map(textOf).join("") : React.isValidElement<{ children?: React.ReactNode }>(node) ? textOf(node.props.children) : String(node);

/**
 * On each block that holds Markdown's HTML: it's sanitized, so a <Tailwind> around it inlines no class of it that could
 * load or run something either (its sanitizer's check: see src/tailwind/load.ts). Last, so `blocks` can't change it.
 */
const SANITIZED = { _sanitized: true } as {};

/**
 * In place of a block Markdown can't render (a table past the cells its tables can have, or the list or quote it's
 * in): it fails as a component of yours fails, under the render's `onError` (a RenderError naming the Markdown and
 * where it is; with `onError: "omit"`, left out alone and listed, the Markdown's other blocks rendering).
 */
function Unrendered({ reason }: { reason: string }): React.ReactElement {
  throw new Error(reason);
}
// (Named as the Markdown it's in, so the error's position is the Markdown's.)
Unrendered.displayName = "Markdown";

/** A part of the template left out alone when it fails, as the main entry makes one (see its utils/internals.ts). */
type Part = (child: React.ReactElement) => React.ReactElement;
const part: Part = (renderToHtml as unknown as Record<symbol, { part?: Part } | undefined>)[Symbol.for("@unlayer/react-elements/internals")]?.part ?? ((child) => child);

const unrendered = (key: number, reason: string) => part(<Unrendered key={key} reason={reason} />);

type Table = Tokens.Table & { tooLarge?: TooLarge };

/**
 * The code a Markdown's blocks can be highlighted with: their sizes squared, together. highlight.js's time can grow
 * with a block's size squared (see the code entry's HIGHLIGHT_LIMIT, the most it's given at once: this is that
 * squared), so this is a block of 8,192 characters, or many smaller ones (64 of 1,024, a thousand of 256), about 0.4 s
 * at the most; past it a block is shown without colors. 46 MB of READMEs and docs held more in 21 of 4,782 documents.
 */
const CODE_WORK = 8192 ** 2;

/** Turns Markdown's tokens into Elements blocks and the HTML in their text. */
class Writer {
  /** Why the block being written can't render (a table in its list or quote is too large: see Unrendered). */
  private failed: string | undefined;
  /** What's left of CODE_WORK, and the code blocks past it (shown without colors). */
  private codeLeft = CODE_WORK;
  plain = 0;

  constructor(private props: MarkdownProps) {}

  private style(tag: keyof MarkdownStyles): string {
    const css = this.props.styles?.[tag] ?? STYLES[tag as keyof typeof STYLES];
    return css ? ` style="${escapeAttribute(css)}"` : "";
  }

  private attributes(given: Attributes | undefined, url: string): string {
    const list = typeof given === "function" ? given(url) : (given ?? {});
    return Object.entries(list)
      .filter(([name]) => /^[a-z][\w:-]*$/i.test(name) && !/^(on|href$|src$|style$)/i.test(name))
      .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
      .join("");
  }

  private url(url: string, kind: "link" | "image"): string | undefined {
    const safe = safeUrl(url, kind);
    const out = safe === undefined || !this.props.url ? safe : this.props.url(safe, kind);
    // A rewritten one is checked again.
    return out === undefined ? undefined : safeUrl(out, kind);
  }

  private raw(html: string): string {
    const mode = this.props.html ?? "sanitize";
    return mode === "drop" ? "" : mode === "escape" ? escapeText(html) : sanitizeHtml(html);
  }

  /** Inline tokens as HTML. */
  inline(tokens: Token[] | undefined): string {
    return (tokens ?? [])
      .map((token): string => {
        switch (token.type) {
          case "text":
            return "tokens" in token && token.tokens ? this.inline(token.tokens) : this.text(token.text);
          case "escape":
            return escapeText(token.text);
          case "strong":
          case "em":
          case "del":
            return `<${token.type}${this.style(token.type)}>${this.inline(token.tokens)}</${token.type}>`;
          case "codespan":
            return codeInline(token.text, this.props.inlineCode);
          case "br":
            return "<br/>";
          case "link": {
            const href = this.url(token.href, "link");
            const inner = this.inline(token.tokens);
            if (href === undefined) return inner;
            const title = token.title ? ` title="${escapeAttribute(token.title)}"` : "";
            return `<a href="${escapeAttribute(href)}"${title}${this.attributes(this.props.linkAttributes ?? { target: "_blank", rel: "noopener" }, href)}${this.style("a")}>${inner}</a>`;
          }
          case "image": {
            const src = this.url(token.href, "image");
            if (src === undefined) return "";
            const title = token.title ? ` title="${escapeAttribute(token.title)}"` : "";
            return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(token.text)}"${title}${this.attributes(this.props.imageAttributes, src)}${this.style("img")} />`;
          }
          case "html":
            return this.raw(token.text);
          case "checkbox":
            return (token as Tokens.Checkbox).checked ? "&#9745; " : "&#9744; ";
          default:
            return "tokens" in token && token.tokens ? this.inline(token.tokens as Token[]) : escapeText(String((token as { text?: string }).text ?? ""));
        }
      })
      .join("");
  }

  /** Text, escaped; with `breaks`, its line breaks as breaks. */
  private text(text: string): string {
    const html = escapeText(text);
    return this.props.breaks ? html.replace(/\n/g, "<br/>") : html;
  }

  /** A code block's language, where highlighting it fits in what's left of CODE_WORK; past it none (no colors). */
  private language(token: Tokens.Code, given: string | undefined): string | undefined {
    const language = token.lang?.trim().split(/\s+/)[0] || given;
    const work = token.text.length ** 2;
    if (!language || work <= this.codeLeft) {
      if (language) this.codeLeft -= work;
      return language;
    }
    this.plain++;
    return undefined;
  }

  private codeBlock(token: Tokens.Code): string {
    const { language, ...options } = this.props.blocks?.code ?? {};
    return highlightCode(token.text, { ...options, language: this.language(token, language) });
  }

  /** A block inside a list or quote, as HTML. */
  private nested(token: Token, loose: boolean): string {
    switch (token.type) {
      case "space":
        return "";
      case "text":
        return "tokens" in token && token.tokens ? this.inline(token.tokens) : this.text(token.text);
      case "paragraph":
        return loose ? `<p${this.style("p")}>${this.inline(token.tokens)}</p>` : this.inline(token.tokens);
      case "heading":
        return `<p${this.style("p")}><strong>${this.inline(token.tokens)}</strong></p>`;
      case "list":
        return this.list(token as Tokens.List);
      case "blockquote":
        return this.quote(token as Tokens.Blockquote);
      case "checkbox":
        return this.inline([token]);
      case "code":
        return this.codeBlock(token as Tokens.Code);
      case "hr":
        return `<hr${this.style("hr")} />`;
      case "html":
        return this.raw(token.text);
      case "table":
        return this.table(token as Table);
      default:
        return sanitizeHtml(Parser.parse([token]));
    }
  }

  /**
   * A table in a list or quote, as HTML (laid out as marked writes one): its cells as a top-level table's, their raw
   * HTML, links and styles as the props say.
   */
  private table(token: Table): string {
    if (token.tooLarge) {
      this.failed ??= tooLarge(token.tooLarge);
      return "";
    }
    const row = (cells: Tokens.TableCell[], tag: "th" | "td") => `<tr>\n${cells.map((cell) => `<${tag}${cell.align ? ` align="${cell.align}"` : ""}>${this.inline(cell.tokens)}</${tag}>\n`).join("")}</tr>\n`;
    const body = token.rows.map((cells) => row(cells, "td")).join("");
    return `<table>\n<thead>\n${row(token.header, "th")}</thead>\n${body && `<tbody>${body}</tbody>`}</table>\n`;
  }

  /** A block of HTML (a list's, a quote's), or what fails in its place where a table in it can't render. */
  private written(key: number, html: string, props: Partial<ParagraphProps> | undefined): React.ReactNode {
    const failed = this.failed;
    this.failed = undefined;
    return failed ? unrendered(key, failed) : <Paragraph key={key} {...props} html={html} {...SANITIZED} />;
  }

  list(token: Tokens.List): string {
    const tag = token.ordered ? "ol" : "ul";
    const start = token.ordered && typeof token.start === "number" && token.start !== 1 ? ` start="${token.start}"` : "";
    // A list in an item starts on a line of its own (in the plain text too).
    const items = token.items
      .map((item) => `<li${this.style("li")}>${item.tokens.map((t, i) => (i && t.type === "list" ? "<br/>" : "") + this.nested(t, item.loose)).join("")}</li>`)
      .join("");
    return `<${tag}${start}${this.style(tag)}>${items}</${tag}>`;
  }

  quote(token: Tokens.Blockquote): string {
    return `<blockquote${this.style("blockquote")}>${token.tokens.map((t) => this.nested(t, true)).join("")}</blockquote>`;
  }

  /** An image on a line of its own (maybe a link's): its URL, alt text and link. */
  private alone(token: Tokens.Paragraph): { src: string; alt: string; href?: string } | undefined {
    const parts = token.tokens.filter((t) => !(t.type === "text" && !t.text.trim()));
    const link = parts.length === 1 && parts[0].type === "link" ? (parts[0] as Tokens.Link) : undefined;
    const inner = (link?.tokens ?? parts).filter((t) => !(t.type === "text" && !t.text.trim()));
    if (inner.length !== 1 || inner[0].type !== "image") return undefined;
    const image = inner[0] as Tokens.Image;
    const src = this.url(image.href, "image");
    const href = link && this.url(link.href, "link");
    return src === undefined ? undefined : { src, alt: image.text, ...(href ? { href } : {}) };
  }

  /** Markdown's blocks as Elements blocks. */
  blocks(tokens: Token[]): React.ReactNode[] {
    const blocks = this.props.blocks ?? {};
    return tokens.map((token, key): React.ReactNode => {
      switch (token.type) {
        case "space":
        case "def":
          return null;
        case "heading": {
          const level = `h${token.depth}` as "h1";
          return <Heading key={key} level={level} fontSize={SIZES[token.depth - 1]} fontWeight={700} {...blocks.heading} {...blocks[level]} text={this.inline(token.tokens)} />;
        }
        case "paragraph": {
          const image = this.alone(token as Tokens.Paragraph);
          if (image) return <Image key={key} src={image.src} alt={image.alt} {...(image.href ? { action: image.href } : {})} {...blocks.image} />;
          return <Paragraph key={key} {...blocks.paragraph} html={this.inline(token.tokens)} {...SANITIZED} />;
        }
        case "text":
          return <Paragraph key={key} {...blocks.paragraph} html={"tokens" in token && token.tokens ? this.inline(token.tokens) : this.text(token.text)} {...SANITIZED} />;
        case "list":
          return this.written(key, this.list(token as Tokens.List), blocks.list);
        case "blockquote":
          return this.written(key, this.quote(token as Tokens.Blockquote), blocks.blockquote);
        case "hr":
          return <Divider key={key} {...blocks.divider} />;
        case "table": {
          const table = token as Table;
          if (table.tooLarge) return unrendered(key, tooLarge(table.tooLarge));
          return <Table key={key} {...blocks.table} headers={table.header.map((cell) => this.inline(cell.tokens))} data={table.rows.map((row) => row.map((cell) => this.inline(cell.tokens)))} />;
        }
        case "code": {
          const { language, ...options } = blocks.code ?? {};
          return <CodeBlock key={key} {...options} language={this.language(token as Tokens.Code, language)} code={(token as Tokens.Code).text} />;
        }
        case "html": {
          const html = this.raw(token.text);
          if (!html.trim()) return null;
          return this.props.html === "escape" ? <Paragraph key={key} {...blocks.paragraph} html={html} {...SANITIZED} /> : <Html key={key} {...blocks.html} html={html} {...SANITIZED} />;
        }
        default:
          return <Html key={key} {...blocks.html} html={sanitizeHtml(Parser.parse([token]))} {...SANITIZED} />;
      }
    });
  }
}

/**
 * Markdown - Markdown as Elements blocks: headings are Headings, paragraphs, lists and quotes Paragraphs, images on
 * a line of their own Images, `---` a Divider, tables Tables, code a CodeBlock, raw HTML an Html block, so the design
 * stays editable block by block. Place it in a Column. Raw HTML keeps only the tags and attributes that display (see
 * sanitizeHtml), and links and images that could run code are left out.
 *
 * @example
 * ```tsx
 * <Column>
 *   <Markdown blocks={{ paragraph: { fontSize: "16px" } }}>{`
 *     # Release notes
 *
 *     **Faster exports**, and \`renderToJson()\` keeps your [links](https://example.com).
 *   `}</Markdown>
 * </Column>
 * ```
 */
export function Markdown(props: MarkdownProps): React.ReactElement {
  const source = dedent(props.markdown ?? textOf(props.children));
  // (Its tables, its quotes' and lists' nesting and its inline syntax kept to what its size calls for: see limits.ts and inline.ts.)
  const tokens = new Bounded({ breaks: !!props.breaks, cells: Math.max(TABLE_CELLS, source.length), size: source.length }).lex(source);
  const writer = new Writer(props);
  const blocks = writer.blocks(tokens);
  if (writer.plain)
    console.warn(
      `[Unlayer] Markdown: ${writer.plain} of its code blocks ${writer.plain > 1 ? "are" : "is"} shown without colors: its code blocks' sizes squared add up to more than the ${CODE_WORK} highlight.js is given for one Markdown (on some code its time grows with a block's size squared).`
    );
  return <>{blocks}</>;
}

Markdown.displayName = "Markdown";
