/**
 * MJML source → MJML's JSON tree, with `mj-include`s resolved. MJML 5 ignores includes unless told otherwise, and then
 * reads files itself: here the caller's resolver reads them (and refuses paths outside the input), and each include
 * lands where MJML 4 put it: an MJML partial's body where the include is, its head in the template's head; a CSS file
 * as an `mj-style`, at the end of the head; an HTML file as an `mj-raw`.
 */

import { mjmlRuntime } from "./runtime";
import { MjmlVersionError, type IncludeResolver, type MjmlNode, type Note } from "./types";

/** The tag `mj-include` is parsed as: mjml-parser-xml drops includes it doesn't follow. */
const INCLUDE = "mj-unlayer-include";

/** Parse `source` (one file) as MJML's parser does, keeping includes as nodes. */
function parseText(source: string, file: string | undefined): MjmlNode {
  const runtime = mjmlRuntime();
  const text = source.replace(/^﻿/, "").replace(/<(\/?)mj-include\b/g, `<$1${INCLUDE}`);
  // An empty filePath keeps the parser off the file system.
  const root = runtime.parse(text, { keepComments: false, components: runtime.components, filePath: "", ignoreIncludes: true });
  if (file) tagFile(root, file);
  return root;
}

function tagFile(node: MjmlNode, file: string): void {
  node.file = file;
  for (const child of node.children ?? []) tagFile(child, file);
}

/** Whether `source` is MJML 3: everything inside `mj-container`, which MJML 4 dropped (and MJML 5 can't migrate). */
export function isMjml3(source: string): boolean {
  return /<mj-container\b/.test(source);
}

/** Whether `source` is a whole MJML document (an `<mjml>` root), not a partial an `mj-include` pulls in. */
export function isMjmlDocument(source: string): boolean {
  const start = source.replace(/^﻿/, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<\?xml[^>]*>/, "").trimStart();
  return /^<mjml[\s>]/.test(start);
}

export function parseMjml(
  source: string,
  options: { filePath?: string; resolveInclude?: IncludeResolver },
  notes: { warnings: Note[]; info: Note[] },
): MjmlNode {
  if (isMjml3(source)) {
    throw new MjmlVersionError("it's MJML 3 (it wraps its content in <mj-container>), which MJML 5 doesn't read: upgrade it first with npx mjml-migrate <input> <output>, then migrate the output");
  }
  const root = parseText(source, options.filePath);
  if (root.tagName !== "mjml") throw new Error(`not an MJML document: its root is <${root.tagName}>, not <mjml>`);
  const head = () => {
    let found = root.children?.find((c) => c.tagName === "mj-head");
    if (!found) {
      found = { tagName: "mj-head", attributes: {}, children: [] };
      root.children = [found, ...(root.children ?? [])];
    }
    found.children ??= [];
    return found;
  };
  resolveIncludes(root, options.filePath, options.resolveInclude, head, options.filePath ? [options.filePath] : [], notes);
  return root;
}

function resolveIncludes(
  node: MjmlNode,
  file: string | undefined,
  resolver: IncludeResolver | undefined,
  head: () => MjmlNode,
  stack: string[],
  notes: { warnings: Note[]; info: Note[] },
): void {
  if (!node.children?.length) return;
  const out: MjmlNode[] = [];
  const isHead = node.tagName === "mj-head";
  for (const child of node.children) {
    if (child.tagName !== INCLUDE) {
      resolveIncludes(child, file, resolver, head, stack, notes);
      out.push(child);
      continue;
    }
    const path = String(child.attributes?.path ?? "");
    const type = String(child.attributes?.type ?? "mjml");
    if (!path) {
      notes.warnings.push({ reason: "mj-include without a path, left out" });
      continue;
    }
    if (!resolver) {
      notes.warnings.push({ reason: "mj-include not followed", detail: path });
      continue;
    }
    const got = resolver(path, file);
    if ("error" in got) {
      notes.warnings.push({ reason: "mj-include left out", detail: `${path} (${got.error})` });
      continue;
    }
    if (stack.includes(got.file)) {
      notes.warnings.push({ reason: "mj-include left out", detail: `${path} (it includes itself, through ${stack.length} file${stack.length === 1 ? "" : "s"})` });
      continue;
    }
    notes.info.push({ reason: "mj-include followed", detail: path });
    if (type === "css") {
      const inline = child.attributes?.["css-inline"] === "inline";
      head().children!.push({ tagName: "mj-style", attributes: inline ? { inline: "inline" } : {}, content: got.source, file: got.file });
      continue;
    }
    if (type === "html") {
      out.push({ tagName: "mj-raw", attributes: {}, content: got.source, file: got.file });
      continue;
    }
    // MJML wraps a partial without `<mjml>` (exactly that tag) in a document of its own, its content as the body.
    const text = got.source.indexOf("<mjml>") === -1 ? `<mjml><mj-body>${got.source}</mj-body></mjml>` : got.source;
    let partial: MjmlNode;
    try {
      partial = parseText(text, got.file);
    } catch (error) {
      notes.warnings.push({ reason: "mj-include left out", detail: `${path} (${(error as Error).message.split("\n")[0]})` });
      continue;
    }
    if (partial.tagName !== "mjml") continue;
    // Its own includes, from its folder.
    const partialHead = partial.children?.find((c) => c.tagName === "mj-head");
    const partialBody = partial.children?.find((c) => c.tagName === "mj-body");
    if (partialHead) resolveIncludes(partialHead, got.file, resolver, head, [...stack, got.file], notes);
    if (partialBody) resolveIncludes(partialBody, got.file, resolver, head, [...stack, got.file], notes);
    out.push(...(partialBody?.children ?? []));
    // MJML adds a partial's head to the template's as it reads the include: in place when the include is in the head
    // (the head is still being read), at its end from the body.
    if (partialHead?.children?.length) {
      if (isHead) out.push(...partialHead.children);
      else head().children!.push(...partialHead.children);
    }
  }
  node.children = out;
}
