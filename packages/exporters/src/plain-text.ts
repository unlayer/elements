/**
 * The plain-text version of a template (emails send it beside the HTML: spam
 * filters count against HTML-only mail), written from the tree rather than
 * read back out of the HTML. Same conventions as the main entry's
 * renderToPlainText: large headings in capitals, a link as "text (url)", an
 * image as "[alt]", a divider as "---", blocks apart by a blank line; list
 * items as "- " or "1. " (nested ones indented), a table's rows a line each,
 * its cells apart by " | ".
 */
import { linkParts, type LinkValue, type ResolvedDocument, type ResolvedNode } from "@unlayer-internal/elements-core";

export interface TextOptions {
  /** How a merge tag is written (default `{{name}}`). */
  mergeTag?: (name: string) => string;
}

export function renderText(resolved: ResolvedDocument, options: TextOptions = {}): string {
  const tag = options.mergeTag ?? ((name: string) => `{{${name}}}`);

  const inline = (node: ResolvedNode): string =>
    node.children
      .map((child) => {
        if (typeof child === "string") return child;
        if (child.hidden?.mobile && child.hidden?.desktop) return "";
        switch (child.type) {
          case "LineBreak":
            return "\n";
          case "MergeTag":
            return tag(child.props.name as string);
          case "Link":
            return withHref(inline(child), child);
          case "Image":
            return image(child);
          default:
            return inline(child);
        }
      })
      .join("");

  const withHref = (text: string, node: ResolvedNode): string => {
    const { href } = linkParts(node.props.href as LinkValue);
    const clean = tidy(text);
    return !clean || clean === href ? href : `${clean} (${href})`;
  };

  const image = (node: ResolvedNode): string => {
    const alt = (node.props.alt as string | undefined)?.trim();
    return alt ? `[${alt}]` : "";
  };

  const blocks = (node: ResolvedNode): string[] =>
    node.children.flatMap((child): string[] => {
      if (typeof child === "string" || (child.hidden?.mobile && child.hidden?.desktop)) return [];
      switch (child.type) {
        case "Heading": {
          const text = tidy(inline(child));
          return [Number(child.props.level) <= 2 ? text.toUpperCase() : text];
        }
        case "Text":
        case "Paragraph":
          return [tidy(inline(child))];
        case "Button":
          return [withHref(inline(child), child)];
        case "Link":
          return [withHref(inline(child), child)];
        case "Image":
          return [image(child)];
        case "Divider":
          return ["---"];
        case "List":
          return [list(child, "")];
        case "Table":
          return [table(child)];
        case "Video":
          return [`${tidy(String(child.props.title))} (${child.props.src})`];
        case "Svg":
          return child.props.title ? [`[${tidy(String(child.props.title))}]`] : [];
        // A Document's header and footer are on every page: its text is its pages' content, once.
        case "PageHeader":
        case "PageFooter":
          return [];
        default:
          return blocks(child);
      }
    });

  const shown = (node: ResolvedNode) => !(node.hidden?.mobile && node.hidden?.desktop);

  const list = (node: ResolvedNode, indent: string): string =>
    node.children
      .filter((child): child is ResolvedNode => typeof child !== "string" && shown(child))
      .map((item, index) => {
        const marker = node.props.type === "number" ? `${Number(node.props.start) + index}. ` : "- ";
        // The item's text and the Lists in it, in their order: text after a List goes under it, lined up with the first.
        const lines: string[] = [];
        let run: ResolvedNode["children"] = [];
        const flush = () => {
          const text = tidy(inline({ ...item, children: run }));
          if (text) lines.push(`${indent}${lines.length ? " ".repeat(marker.length) : marker}${text}`);
          run = [];
        };
        for (const child of item.children) {
          if (typeof child === "string" || child.type !== "List") {
            run.push(child);
            continue;
          }
          flush();
          if (!lines.length) lines.push(`${indent}${marker}`.trimEnd());
          if (shown(child)) lines.push(list(child, `${indent}  `));
        }
        flush();
        return (lines.length ? lines : [`${indent}${marker}`.trimEnd()]).join("\n");
      })
      .join("\n");

  const table = (node: ResolvedNode): string =>
    node.children
      .filter((row): row is ResolvedNode => typeof row !== "string" && shown(row))
      .map((row) =>
        row.children
          .filter((cell): cell is ResolvedNode => typeof cell !== "string")
          .map((cell) => tidy(inline(cell)))
          .join(" | ")
      )
      .join("\n");

  return blocks(resolved.root)
    .filter((block) => block.length > 0)
    .join("\n\n");
}

/** Spaces collapsed and each line trimmed, as a reader of plain text expects. */
function tidy(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .trim();
}
