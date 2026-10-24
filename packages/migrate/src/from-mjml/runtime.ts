/**
 * The `mjml` package this converter is pinned to (an exact version in package.json): its compiler, which gives the
 * reference HTML and the HTML of blocks kept as they are, and the parts of it the converter reads (the XML parser, the
 * components' default attributes, and juice, which MJML inlines `mj-style inline` CSS with). They're loaded from mjml's
 * own dependencies, so they're the copies mjml uses.
 */

import { createRequire } from "node:module";
import { dirname } from "node:path";
import type { MjmlNode } from "./types";

/** A component class as mjml-core registers it. */
export interface MjmlComponent {
  defaultAttributes?: Record<string, string | null>;
  allowedAttributes?: Record<string, string>;
  endingTag?: boolean;
  getTagName(): string;
}

export interface MjmlRuntime {
  /** MJML's compiler (async since MJML 5). */
  mjml2html(input: MjmlNode | string, options?: Record<string, unknown>): Promise<{ html: string; errors: Array<{ message?: string; formattedMessage?: string }> }>;
  /** The registered components, by tag name. */
  components: Record<string, MjmlComponent>;
  /** mjml-parser-xml: MJML's XML as its JSON tree. */
  parse(xml: string, options: Record<string, unknown>): MjmlNode;
  /** juice, for CSS MJML inlines. */
  juice: { inlineContent(html: string, css: string, options?: Record<string, unknown>): string };
  /** The version of mjml loaded. */
  version: string;
}

let loaded: MjmlRuntime | undefined;

export function mjmlRuntime(): MjmlRuntime {
  if (loaded) return loaded;
  const require = createRequire(import.meta.url);
  const main = require.resolve("mjml");
  const mjml2html = require(main);
  const corePath = require.resolve("mjml-core", { paths: [dirname(main)] });
  const core = require(corePath);
  const parse = require(require.resolve("mjml-parser-xml", { paths: [dirname(corePath)] }));
  const juice = require(require.resolve("juice", { paths: [dirname(corePath)] }));
  const version = require(require.resolve("mjml/package.json")).version as string;
  loaded = {
    mjml2html: typeof mjml2html === "function" ? mjml2html : mjml2html.default,
    components: core.components,
    parse: typeof parse === "function" ? parse : parse.default,
    juice: typeof juice === "function" || typeof juice === "object" ? juice : juice.default,
    version,
  };
  return loaded;
}
