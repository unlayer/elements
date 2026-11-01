/**
 * A legacy template rendered by the new engine (RFC 0001 step 7, in shadow): its design lowered into the new
 * engine's tree (lower.ts), each block in the new components where it has moved over (blocks.ts), else a Raw node
 * with the HTML its exporter writes and the legacy stylesheet.
 * Not public: the comparison stories render with it, and its components move over one at a time.
 */
import type React from "react";
import { renderTemplate, type RenderResult } from "@unlayer-internal/elements-exporters";
import { htmlToPlainText } from "@unlayer-internal/shared-elements";
import { recordingBlockHtml } from "../utils/block-html";
import { renderToHtml } from "../utils/render-to-html";
import { renderToJson } from "../utils/render-to-json";
import { BLOCKS } from "./blocks";
import { lowerDesign } from "./lower";

/** The stylesheet a legacy document has, Outlook's own (in its conditional comments) left out. */
function legacyCss(html: string): string {
  const shown = html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/g, "");
  return [...shown.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1].trim()).join("\n");
}

export function renderWithNewEngine(element: React.ReactElement, mode: "email" | "web" = "email"): RenderResult {
  // Each block's HTML, in the order the render writes them: the design's order (rows, their columns, their blocks).
  // Not by id: the HTML numbers a Paragraph u_content_paragraph_1 where the design says u_content_text_1.
  const blocks: string[] = [];
  const legacy = recordingBlockHtml((_, html) => blocks.push(html), () => renderToHtml(element));
  const css = legacyCss(legacy);
  const design = renderToJson(element) as unknown as { body: Record<string, any> };
  let next = 0;
  const tree = lowerDesign(design, {
    mode,
    block: (block) => {
      const html = blocks[next++] ?? "";
      return BLOCKS[block.type]?.(block) ?? { type: "Raw", props: { html, css, text: htmlToPlainText(html) } };
    },
  });
  if (next !== blocks.length) throw new Error(`[Elements] The design has ${next} blocks and the render wrote ${blocks.length}: they can't be paired`);
  return renderTemplate(tree);
}
